import { useState } from 'react'
import { parseUnits, formatUnits, maxUint256, encodeFunctionData, getAddress } from 'viem'
import { mainnet, sepolia , bsc } from 'viem/chains'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { CONTRACTS } from '../constants/contracts'
import { generatePoolId } from '../utils/stateViewUtils'
import permit2Abi from '../../contracts/permit2.json'

import { Token, Percent, Ether } from '@uniswap/sdk-core'
import { Pool, Position } from '@uniswap/v4-sdk'
import { V4PositionManager } from '@uniswap/v4-sdk'
import { nearestUsableTick } from '@uniswap/v3-sdk'
import { getPoolInfo } from '../utils/stateViewUtils'
import { calculateTickSpacingFromFeeAmount } from '../components/Liquidity/utils'

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const PERMIT2_DOMAIN = {
  name: 'Permit2',
  chainId: 0,
  verifyingContract: PERMIT2_ADDRESS as `0x${string}`
};

const PERMIT2_BATCH_TYPES = {
  PermitBatch: [
    { name: 'details', type: 'PermitDetails[]' },
    { name: 'spender', type: 'address' },
    { name: 'sigDeadline', type: 'uint256' }
  ],
  PermitDetails: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint160' },
    { name: 'expiration', type: 'uint48' },
    { name: 'nonce', type: 'uint48' }
  ]
};

interface AddLiquidityParams {
  token0: {
    address: string;
    decimals: number;
    amount: string;
    symbol: string;
  };
  token1: {
    address: string;
    decimals: number;
    amount: string;
    symbol: string;
  };
  fee: number;
  tickLower: number;
  tickUpper: number;
  recipient?: string;
  hookAddress?: string;
  slippageToleranceBips?: number;
}

interface CalculateAmountsResult {
  success: boolean;
  error?: string;
  requiredAmount0?: string;
  requiredAmount1?: string;
  poolInfo?: {
    sqrtPriceX96: string;
    liquidity: string;
    tick: number;
  };
  _positionData?: {
    position: Position;
    token0: any;
    token1: any;
    positionManagerAddress: string;
    deadline: number;
    slippageTolerance: Percent;
  };
}

interface ExecuteTransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// Helper function to ensure proper number formatting for MetaMask
// const formatNumberForMetaMask = (value: any): string => {
//   // Handle arrays - this might be the issue
//   if (Array.isArray(value)) {
//     console.warn('Array passed to formatNumberForMetaMask:', value);
//     return value[0]?.toString() || '0';
//   }
  
//   if (typeof value === 'bigint') {
//     return value.toString();
//   }
//   if (typeof value === 'number') {
//     return value.toString();
//   }
//   if (typeof value === 'string') {
//     // Remove any locale-specific formatting and ensure proper decimal format
//     return value.replace(/,/g, '');
//   }
  
//   console.warn('Unexpected value type in formatNumberForMetaMask:', typeof value, value);
//   return String(value);
// };

export function useV4Position() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  // For chainId, use walletClient?.chain.id or publicClient?.chain?.id or fallback
  const chainId = walletClient?.chain.id || publicClient?.chain?.id || 1;
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [currentPoolId, setCurrentPoolId] = useState<string | null>(null)

  const getChainFromId = (chainId: number) => {
    switch (chainId) {
      case 1:
        return mainnet;
      case 56:
        return bsc;
      case 11155111:
        return sepolia;
      case 1301:
        return {
          id: 1301,
          name: 'Unichain Sepolia',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://unichain-sepolia-rpc.publicnode.com'] },
            public: { http: ['https://unichain-sepolia-rpc.publicnode.com'] }
          }
        };
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  };

  const isNativeToken = (tokenAddress: string): boolean => {
    return tokenAddress === '0x0000000000000000000000000000000000000000' ||
           tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  };

  const approveTokenToPermit2 = async (tokenAddress: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    if (!walletClient || !publicClient || isNativeToken(tokenAddress)) {
      return { success: true };
    }

    try {
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, PERMIT2_ADDRESS as `0x${string}`]
      });

      if (currentAllowance >= amount) {
        return { success: true };
      }

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PERMIT2_ADDRESS as `0x${string}`, maxUint256]
      });

      const hash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        account: address as `0x${string}`,
        chain: getChainFromId(chainId!),
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const checkPermit2Allowance = async (tokenAddress: string, spender: string): Promise<{ amount: bigint; expiration: number; nonce: number }> => {
    if (!publicClient || !address || isNativeToken(tokenAddress)) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }

    try {
      const result = await publicClient.readContract({
        address: PERMIT2_ADDRESS as `0x${string}`,
        abi: permit2Abi.abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, tokenAddress as `0x${string}`, spender as `0x${string}`]
      });

      return {
        amount: result[0] as bigint,
        expiration: Number(result[1]),
        nonce: Number(result[2])
      };
    } catch (error) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }
  };

  const signPermit2Batch = async (permitBatch: any): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet not available');
    }

    const domain = {
      ...PERMIT2_DOMAIN,
      chainId: chainId!
    };

    // Helper function to extract value from JSBI or other complex objects
    const extractNumericValue = (value: any): string => {
      // Handle JSBI objects specifically
      if (value && typeof value === 'object') {
        // Check if it's a JSBI instance by looking for JSBI-specific methods/properties
        if (value.constructor && (value.constructor.name === 'JSBI' || value.constructor.name === '_JSBI')) {
          // Use JSBI's toString method
          return value.toString();
        }
        
        // Check if it has a toString method that returns a valid number string
        if (typeof value.toString === 'function') {
          const stringValue = value.toString();
          // Verify it's a valid number string (not "[object Object]")
          if (/^\d+$/.test(stringValue)) {
            return stringValue;
          }
        }
        
        // If it's an object with a 'words' array (BigNumber-like structure)
        if (value.words && Array.isArray(value.words)) {
          // Try to convert BigNumber-like object to string
          try {
            return value.toString();
          } catch (e) {
            console.warn('Failed to convert BigNumber-like object:', value);
          }
        }
        
        // Handle regular arrays (fallback)
        if (Array.isArray(value)) {
          return value[0]?.toString() || '0';
        }
      }
      
      // Handle regular numbers, bigints, strings
      if (typeof value === 'bigint') {
        return value.toString();
      }
      
      if (typeof value === 'number') {
        return value.toString();
      }
      
      if (typeof value === 'string') {
        return value.replace(/,/g, '');
      }
      
      // Last resort
      console.warn('Unexpected value type in extractNumericValue:', typeof value, value);
      return '0';
    };

    // Deep clone and sanitize the permit batch data
    const sanitizedPermitBatch = {
      spender: permitBatch.spender,
      sigDeadline: extractNumericValue(permitBatch.sigDeadline),
      details: permitBatch.details.map((detail: any) => {
        console.log('Original detail:', detail);
        console.log('Amount type and constructor:', typeof detail.amount, detail.amount?.constructor?.name);
        console.log('Amount methods:', detail.amount && typeof detail.amount === 'object' ? Object.getOwnPropertyNames(detail.amount) : 'N/A');
        
        const sanitizedDetail = {
          token: detail.token,
          amount: extractNumericValue(detail.amount),
          expiration: extractNumericValue(detail.expiration),
          nonce: extractNumericValue(detail.nonce)
        };
        
        console.log('Sanitized detail:', sanitizedDetail);
        return sanitizedDetail;
      })
    };

    console.log('Final sanitized permit batch:', sanitizedPermitBatch);

    const signature = await walletClient.signTypedData({
      account: address as `0x${string}`,
      domain,
      types: PERMIT2_BATCH_TYPES,
      primaryType: 'PermitBatch',
      message: sanitizedPermitBatch
    });

    return signature;
  };

  const calculateRequiredAmounts = async (params: AddLiquidityParams): Promise<CalculateAmountsResult> => {
    if (!chainId || !CONTRACTS[chainId as keyof typeof CONTRACTS]) {
      return { success: false, error: 'Chain not supported' };
    }

    try {
      let token0 = params.token0
      let token1 = params.token1
      let tickLower = params.tickLower
      let tickUpper = params.tickUpper

      if (token0?.address && token1?.address && token0.address.toLowerCase() > token1.address.toLowerCase()) {
        [token0, token1] = [token1, token0]
        [tickLower, tickUpper] = [tickUpper * -1, tickLower * -1]
      }

      const tickSpacing = calculateTickSpacingFromFeeAmount(params.fee);
      const hookAddress = params.hookAddress || '0x0000000000000000000000000000000000000000';

      const poolKey = {
        currency0: token0.address,
        currency1: token1.address,
        fee: params.fee,
        tickSpacing,
        hooks: hookAddress
      };
      const poolId = generatePoolId(poolKey);
      // Store the poolId for later use when the transaction succeeds
      setCurrentPoolId(poolId);

      // Use proper decimal formatting to avoid locale issues
      const amount0Str = token0.address === params.token0.address ? params.token0.amount : params.token1.amount;
      const amount1Str = token1.address === params.token1.address ? params.token1.amount : params.token0.amount;
      
      const amount0 = parseUnits(amount0Str.replace(/,/g, ''), token0.decimals);
      const amount1 = parseUnits(amount1Str.replace(/,/g, ''), token1.decimals);

      const isToken0Native = isNativeToken(token0.address);
      const isToken1Native = isNativeToken(token1.address);
      
      let currency0, currency1;
      
      if (isToken0Native) {
        currency0 = Ether.onChain(chainId);
      } else {
        currency0 = new Token(chainId, token0.address, token0.decimals, token0.symbol);
      }
      
      if (isToken1Native) {
        currency1 = Ether.onChain(chainId);
      } else {
        currency1 = new Token(chainId, token1.address, token1.decimals, token1.symbol);
      }

      console.log('Pool Info for stateview:', {
        poolId,
        chainId,
        rpcUrl: import.meta.env.VITE_BSC_MAINNET_RPC_URL,
      });

      // Use wallet provider for dynamic RPC
      const provider = walletClient?.transport?.provider || (typeof window !== 'undefined' ? window.ethereum : undefined);
      if (!provider) {
        return { success: false, error: 'No wallet provider available' };
      }
      const poolInfo = await getPoolInfo(chainId, provider, poolId);
      if (!poolInfo) {
        return { success: false, error: 'Failed to fetch pool data' };
      }

      const pool = new Pool(
        currency0,
        currency1,
        params.fee,
        tickSpacing,
        hookAddress,
        poolInfo.sqrtPriceX96,
        poolInfo.liquidity,
        poolInfo.tick
      );

      const adjustedTickLower = nearestUsableTick(tickLower, tickSpacing)
      const adjustedTickUpper = nearestUsableTick(tickUpper, tickSpacing)

      const position = Position.fromAmounts({
        pool,
        tickLower: adjustedTickLower,
        tickUpper: adjustedTickUpper,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        useFullPrecision: true
      });

      const slippageBips = params.slippageToleranceBips ?? 50;
      const slippageTolerance = new Percent(slippageBips, 10_000);

      const { amount0: requiredAmount0, amount1: requiredAmount1 } =
        position.mintAmountsWithSlippage(slippageTolerance);

      const requiredAmount0Formatted = formatUnits(BigInt(requiredAmount0.toString()), token0.decimals);
      const requiredAmount1Formatted = formatUnits(BigInt(requiredAmount1.toString()), token1.decimals);

      const positionManagerAddress = CONTRACTS[chainId as keyof typeof CONTRACTS].PositionManager;
      if (!positionManagerAddress) {
        return { success: false, error: 'Position Manager not available' };
      }

      const deadline = Math.floor(Date.now() / 1000) + 1800;

      return {
        success: true,
        requiredAmount0: requiredAmount0Formatted,
        requiredAmount1: requiredAmount1Formatted,
        poolInfo: {
          sqrtPriceX96: poolInfo.sqrtPriceX96,
          liquidity: poolInfo.liquidity,
          tick: poolInfo.tick
        },
        _positionData: {
          position,
          token0,
          token1,
          positionManagerAddress,
          deadline,
          slippageTolerance
        }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const executeTransaction = async (calculationResult: CalculateAmountsResult): Promise<ExecuteTransactionResult> => {
    if (!isConnected || !walletClient || !publicClient || !chainId || !calculationResult._positionData) {
      return { success: false, error: 'Prerequisites not met' };
    }

    let userAddress = address;
    if (!userAddress) return { success: false, error: 'Address not available' };

    setIsAddingLiquidity(true);

    try {
      const { position, token0, token1, positionManagerAddress, deadline, slippageTolerance } = calculationResult._positionData;
      const { requiredAmount0, requiredAmount1 } = calculationResult;

      if (!requiredAmount0 || !requiredAmount1) {
        return { success: false, error: 'Required amounts not calculated' };
      }

      const isToken0Native = isNativeToken(token0.address);
      const isToken1Native = isNativeToken(token1.address);

      // Clean amounts to avoid locale formatting issues
      const cleanAmount0 = requiredAmount0.replace(/,/g, '');
      const cleanAmount1 = requiredAmount1.replace(/,/g, '');

      // Step 1: Approve tokens to Permit2
      const approval0 = await approveTokenToPermit2(token0.address, parseUnits(cleanAmount0, token0.decimals));
      if (!approval0.success) {
        return { success: false, error: approval0.error };
      }

      const approval1 = await approveTokenToPermit2(token1.address, parseUnits(cleanAmount1, token1.decimals));
      if (!approval1.success) {
        return { success: false, error: approval1.error };
      }

      // Step 2: Check Permit2 allowances
      const permit2Allowance0 = await checkPermit2Allowance(token0.address, positionManagerAddress);
      const permit2Allowance1 = await checkPermit2Allowance(token1.address, positionManagerAddress);

      const now = Math.floor(Date.now() / 1000);
      const requiredAmount0Wei = parseUnits(cleanAmount0, token0.decimals);
      const requiredAmount1Wei = parseUnits(cleanAmount1, token1.decimals);

      const needsPermit0 = !isToken0Native && (permit2Allowance0.amount < requiredAmount0Wei || permit2Allowance0.expiration < now);
      const needsPermit1 = !isToken1Native && (permit2Allowance1.amount < requiredAmount1Wei || permit2Allowance1.expiration < now);

      let mintOptions: any = {
        slippageTolerance,
        deadline,
        recipient: userAddress,
        useNative: (isToken0Native || isToken1Native) ? Ether.onChain(chainId) : undefined,
      };

      // Step 3: Add permit signature if needed
      if (needsPermit0 || needsPermit1) {
        console.log('Permits needed - generating batch data...');
        
        const permitBatchData = position.permitBatchData(
          slippageTolerance,
          positionManagerAddress,
          Math.max(permit2Allowance0.nonce, permit2Allowance1.nonce),
          deadline
        );

        console.log('Raw permit batch data from SDK:', permitBatchData);

        const signature = await signPermit2Batch(permitBatchData);
        console.log('Permit signature generated successfully');

        mintOptions.batchPermit = {
          owner: userAddress,
          permitBatch: permitBatchData,
          signature
        };

        console.log('Mint options with batch permit:', mintOptions);
      }

      // Step 4: Execute transaction
      console.log('Generating call parameters...');
      console.log('Position details:', {
        token0: position.pool.token0.address,
        token1: position.pool.token1.address,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity: position.liquidity.toString()
      });
      console.log('Mint options:', mintOptions);

      // Create a sanitized position object to avoid JSBI issues in addCallParameters
      const sanitizedMintOptions = {
        ...mintOptions,
        // Ensure all numeric values are strings, not JSBI objects
        deadline: mintOptions.deadline.toString ? mintOptions.deadline.toString() : mintOptions.deadline,
      };

      // If we have batchPermit, sanitize it too
      if (sanitizedMintOptions.batchPermit) {
        sanitizedMintOptions.batchPermit.permitBatch = {
          ...sanitizedMintOptions.batchPermit.permitBatch,
          sigDeadline: sanitizedMintOptions.batchPermit.permitBatch.sigDeadline.toString(),
          details: sanitizedMintOptions.batchPermit.permitBatch.details.map((detail: any) => ({
            ...detail,
            amount: typeof detail.amount === 'string' ? detail.amount : detail.amount.toString(),
            expiration: typeof detail.expiration === 'string' ? detail.expiration : detail.expiration.toString(),
            nonce: typeof detail.nonce === 'string' ? detail.nonce : detail.nonce.toString(),
          }))
        };
      }

      console.log('Sanitized mint options:', sanitizedMintOptions);

      const { calldata, value } = V4PositionManager.addCallParameters(position, sanitizedMintOptions);
      console.log('Call parameters generated successfully');

      let ethValue = BigInt(0);
      if (isToken0Native) {
        ethValue = parseUnits(cleanAmount0, 18);
      } else if (isToken1Native) {
        ethValue = parseUnits(cleanAmount1, 18);
      }

      const hash = await walletClient.sendTransaction({
        to: positionManagerAddress as `0x${string}`,
        data: calldata as `0x${string}`,
        value: ethValue,
        account: userAddress as `0x${string}`,
        chain: getChainFromId(chainId),
      });

      // Minimal receipt checking to avoid excessive polling
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 120_000,
          pollingInterval: 60_000, // Only poll every 60 seconds
        });
        
        if (receipt.status === 'success') {
          return { success: true, hash };
        } else {
          return { success: false, error: 'Transaction reverted' };
        }
      } catch (receiptError) {
        // If receipt checking fails, still return success with hash
        return { 
          success: true, 
          hash,
          error: 'Transaction submitted but could not verify completion'
        };
      }

    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  return {
    calculateRequiredAmounts,
    executeTransaction,
    isAddingLiquidity,
  };
}