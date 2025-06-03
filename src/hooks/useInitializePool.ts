import { useState } from 'react'
import { parseUnits, formatUnits, maxUint256, encodeFunctionData } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { useWallet } from './useWallet'
import { CONTRACTS } from '../constants/contracts'
import { generatePoolId } from '../utils/stateViewUtils'
import permit2Abi from '../../contracts/permit2.json'
// import { addDeployedPool } from '../components/Swap/DeployedPoolsList'

import { Token, Percent, Ether } from '@uniswap/sdk-core'
import { Pool, Position } from '@uniswap/v4-sdk'
import { V4PositionManager } from '@uniswap/v4-sdk'
import { nearestUsableTick } from '@uniswap/v3-sdk'
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

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface FeeOption {
  fee: number;
  tickSpacing: number;
}

interface PoolState {
  token0: TokenInfo | null;
  token1: TokenInfo | null;
  fee: FeeOption;
  hookAddress: string;
}

interface Validation {
  token0Error?: string;
  token1Error?: string;
  hookError?: string;
}

interface InitializePoolParams {
  poolId: string;
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
  hookAddress?: string;
  slippageToleranceBips?: number;
}

interface InitializeResult {
  success: boolean;
  poolId?: string;
  hash?: string;
  error?: string;
}

// Helper function to format numbers for MetaMask (same as your working code)
const formatNumberForMetaMask = (value: any): string => {
  if (Array.isArray(value)) {
    console.warn('Array passed to formatNumberForMetaMask:', value);
    return value[0]?.toString() || '0';
  }
  
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value.replace(/,/g, '');
  }
  
  console.warn('Unexpected value type in formatNumberForMetaMask:', typeof value, value);
  return String(value);
};

export function useInitializePool() {
  const { publicClient, walletClient, chainId, address: userAddress, isConnected, network } = useWallet()
  const [isInitializing, setIsInitializing] = useState(false)

  // Pool state management for CreatePoolForm UI
  const [poolState, setPoolState] = useState<PoolState>({
    token0: null,
    token1: null,
    fee: { fee: 3000, tickSpacing: 60 },
    hookAddress: '0x0000000000000000000000000000000000000000'
  });

  const [validation, setValidation] = useState<Validation>({});

  // UI state management functions
  const updateToken0 = (token: TokenInfo | null) => {
    setPoolState(prev => ({ ...prev, token0: token }));
    if (token) {
      setValidation(prev => ({ ...prev, token0Error: undefined }));
    }
  };

  const updateToken1 = (token: TokenInfo | null) => {
    setPoolState(prev => ({ ...prev, token1: token }));
    if (token) {
      setValidation(prev => ({ ...prev, token1Error: undefined }));
    }
  };

  const updateFee = (fee: FeeOption) => {
    setPoolState(prev => ({ ...prev, fee }));
  };

  const updateHook = (hookAddress: string) => {
    setPoolState(prev => ({ ...prev, hookAddress }));
    setValidation(prev => ({ ...prev, hookError: undefined }));
  };

  const updateSqrtPriceX96 = (sqrtPriceX96: string) => {
    console.log('SqrtPriceX96 updated:', sqrtPriceX96);
  };

  const validatePool = () => {
    const errors: Validation = {};
    
    if (!poolState.token0) {
      errors.token0Error = 'Please select the first token';
    }
    if (!poolState.token1) {
      errors.token1Error = 'Please select the second token';
    }
    if (poolState.token0 && poolState.token1 && 
        poolState.token0.address.toLowerCase() === poolState.token1.address.toLowerCase()) {
      errors.token0Error = 'Tokens must be different';
      errors.token1Error = 'Tokens must be different';
    }
    if (poolState.hookAddress && poolState.hookAddress !== '0x0000000000000000000000000000000000000000') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(poolState.hookAddress)) {
        errors.hookError = 'Invalid hook address format';
      }
    }
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  // Utility functions (same as your working code)
  const getChainFromId = (chainId: number) => {
    switch (chainId) {
      case 1:
        return mainnet;
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

  const calculateInitialSqrtPrice = (
    amount0: string,
    amount1: string,
    decimals0: number,
    decimals1: number
  ): bigint => {
    try {
      const cleanAmount0 = amount0.replace(/,/g, '');
      const cleanAmount1 = amount1.replace(/,/g, '');
      
      const amount0Decimal = parseFloat(cleanAmount0);
      const amount1Decimal = parseFloat(cleanAmount1);
      
      if (amount0Decimal <= 0 || amount1Decimal <= 0) {
        return BigInt('79228162514264337593543950336'); // 1:1 price
      }
      
      const price = (amount1Decimal * Math.pow(10, decimals0)) / (amount0Decimal * Math.pow(10, decimals1));
      const sqrtPrice = Math.sqrt(price);
      const Q96 = Math.pow(2, 96);
      const sqrtPriceX96 = sqrtPrice * Q96;
      
      const sqrtPriceX96Int = Math.floor(sqrtPriceX96);
      
      console.log('Price calculation:', {
        amount0Decimal,
        amount1Decimal,
        price,
        sqrtPrice,
        sqrtPriceX96: sqrtPriceX96Int.toString()
      });
      
      return BigInt(sqrtPriceX96Int.toString());
    } catch (error) {
      console.error('Error calculating initial price:', error);
      return BigInt('79228162514264337593543950336');
    }
  };

  // Copy your working approval and permit functions exactly
  const approveTokenToPermit2 = async (tokenAddress: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    if (!walletClient || !publicClient || isNativeToken(tokenAddress)) {
      return { success: true };
    }

    try {
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, PERMIT2_ADDRESS as `0x${string}`]
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
        account: userAddress as `0x${string}`,
        chain: getChainFromId(chainId!),
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const checkPermit2Allowance = async (tokenAddress: string, spender: string): Promise<{ amount: bigint; expiration: number; nonce: number }> => {
    if (!publicClient || !userAddress || isNativeToken(tokenAddress)) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }

    try {
      const result = await publicClient.readContract({
        address: PERMIT2_ADDRESS as `0x${string}`,
        abi: permit2Abi.abi,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, tokenAddress as `0x${string}`, spender as `0x${string}`]
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

  // Copy your exact working signPermit2Batch function
  const signPermit2Batch = async (permitBatch: any): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet not available');
    }

    const domain = {
      ...PERMIT2_DOMAIN,
      chainId: chainId!
    };

    // Use the same JSBI extraction logic from your working code
    const extractNumericValue = (value: any): string => {
      if (value && typeof value === 'object') {
        if (value.constructor && (value.constructor.name === 'JSBI' || value.constructor.name === '_JSBI')) {
          return value.toString();
        }
        
        if (typeof value.toString === 'function') {
          const stringValue = value.toString();
          if (/^\d+$/.test(stringValue)) {
            return stringValue;
          }
        }
        
        if (value.words && Array.isArray(value.words)) {
          try {
            return value.toString();
          } catch (e) {
            console.warn('Failed to convert BigNumber-like object:', value);
          }
        }
        
        if (Array.isArray(value)) {
          return value[0]?.toString() || '0';
        }
      }
      
      if (typeof value === 'bigint') {
        return value.toString();
      }
      
      if (typeof value === 'number') {
        return value.toString();
      }
      
      if (typeof value === 'string') {
        return value.replace(/,/g, '');
      }
      
      console.warn('Unexpected value type in extractNumericValue:', typeof value, value);
      return '0';
    };

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
      account: currentUserAddress as `0x${string}`,
      domain,
      types: PERMIT2_BATCH_TYPES,
      primaryType: 'PermitBatch',
      message: sanitizedPermitBatch
    });

    return signature;
  };

  // Main pool initialization function - modeled after your working position code
  const initializePool = async (params: InitializePoolParams): Promise<InitializeResult> => {
    if (!isConnected || !walletClient || !publicClient || !chainId) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!CONTRACTS[chainId as keyof typeof CONTRACTS]) {
      return { success: false, error: 'Chain not supported' };
    }

    let currentUserAddress = userAddress;
    if (!currentUserAddress) return { success: false, error: 'Address not available' };

    setIsInitializing(true);

    try {
      console.log('Initializing pool with params:', params);
      
      let token0 = params.token0;
      let token1 = params.token1;
      let tickLower = params.tickLower;
      let tickUpper = params.tickUpper;

      // Handle token ordering (same as your working code)
      if (token0?.address && token1?.address && token0.address.toLowerCase() > token1.address.toLowerCase()) {
        [token0, token1] = [token1, token0];
        [tickLower, tickUpper] = [tickUpper * -1, tickLower * -1];
      }

      const tickSpacing = calculateTickSpacingFromFeeAmount(params.fee);
      const hookAddress = params.hookAddress || '0x0000000000000000000000000000000000000000';

      console.log('Pool initialization details:', {
        poolId: params.poolId,
        token0: token0.address,
        token1: token1.address,
        fee: params.fee,
        tickLower,
        tickUpper,
        tickSpacing,
        hookAddress
      });

      // Calculate initial price from amounts
      const sqrtPriceX96 = calculateInitialSqrtPrice(
        token0.amount.replace(/,/g, ''),
        token1.amount.replace(/,/g, ''),
        token0.decimals,
        token1.decimals
      );

      // Parse amounts (same as your working code)
      const amount0Str = token0.address === params.token0.address ? params.token0.amount : params.token1.amount;
      const amount1Str = token1.address === params.token1.address ? params.token1.amount : params.token0.amount;
      
      const amount0 = parseUnits(amount0Str.replace(/,/g, ''), token0.decimals);
      const amount1 = parseUnits(amount1Str.replace(/,/g, ''), token1.decimals);

      const isToken0Native = isNativeToken(token0.address);
      const isToken1Native = isNativeToken(token1.address);

      // Step 1: Approve tokens to Permit2 (same as your working code)
      const approval0 = await approveTokenToPermit2(token0.address, amount0);
      if (!approval0.success) {
        return { success: false, error: approval0.error };
      }

      const approval1 = await approveTokenToPermit2(token1.address, amount1);
      if (!approval1.success) {
        return { success: false, error: approval1.error };
      }

      const positionManagerAddress = CONTRACTS[chainId as keyof typeof CONTRACTS].PositionManager;
      if (!positionManagerAddress) {
        return { success: false, error: 'Position Manager not available' };
      }

      // Create currencies (same as your working code)
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

      // Create a mock pool for SDK calculations only
      // The actual pool will be created with sqrtPriceX96 price and your liquidity
      const mockPool = new Pool(
        currency0,
        currency1,
        params.fee,
        tickSpacing,
        hookAddress,
        sqrtPriceX96.toString(), // REAL: Pool will be initialized with this price
        '0',                     // MOCK: Just for SDK math - real pool will have your liquidity
        0                        // MOCK: Just for SDK math - real tick calculated from sqrtPriceX96
      );

      const adjustedTickLower = nearestUsableTick(tickLower, tickSpacing);
      const adjustedTickUpper = nearestUsableTick(tickUpper, tickSpacing);

      const position = Position.fromAmounts({
        pool: mockPool,
        tickLower: adjustedTickLower,
        tickUpper: adjustedTickUpper,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        useFullPrecision: true
      });

      const slippageBips = params.slippageToleranceBips ?? 50;
      const slippageTolerance = new Percent(slippageBips, 10_000);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Step 2: Check Permit2 allowances (same as your working code)
      const permit2Allowance0 = await checkPermit2Allowance(token0.address, positionManagerAddress);
      const permit2Allowance1 = await checkPermit2Allowance(token1.address, positionManagerAddress);

      const now = Math.floor(Date.now() / 1000);
      const needsPermit0 = !isToken0Native && (permit2Allowance0.amount < amount0 || permit2Allowance0.expiration < now);
      const needsPermit1 = !isToken1Native && (permit2Allowance1.amount < amount1 || permit2Allowance1.expiration < now);

      let mintOptions: any = {
        slippageTolerance,
        deadline,
        recipient: currentUserAddress,
        useNative: (isToken0Native || isToken1Native) ? Ether.onChain(chainId) : undefined,
        // KEY DIFFERENCE: Add these options for pool initialization
        createPool: true,
        sqrtPriceX96: sqrtPriceX96.toString(),
      };

      // Step 3: Add permit signature if needed (same as your working code)
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
          owner: currentUserAddress,
          permitBatch: permitBatchData,
          signature
        };

        console.log('Mint options with batch permit:', mintOptions);
      }

      // Step 4: Execute transaction (same as your working code but with createPool)
      console.log('Generating call parameters...');
      console.log('Position details:', {
        token0: position.pool.token0.address,
        token1: position.pool.token1.address,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity: position.liquidity.toString()
      });
      console.log('Mint options:', mintOptions);

      // Sanitize mint options (same as your working code)
      const sanitizedMintOptions = {
        ...mintOptions,
        deadline: mintOptions.deadline.toString ? mintOptions.deadline.toString() : mintOptions.deadline,
        sqrtPriceX96: mintOptions.sqrtPriceX96.toString(),
      };

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
        ethValue = parseUnits(token0.amount.replace(/,/g, ''), 18);
      } else if (isToken1Native) {
        ethValue = parseUnits(token1.amount.replace(/,/g, ''), 18);
      }

      console.log('Executing pool initialization + position creation...');
      console.log('Calldata:', calldata);
      console.log('Value:', ethValue.toString());

      const hash = await walletClient.sendTransaction({
        to: positionManagerAddress as `0x${string}`,
        data: calldata as `0x${string}`,
        value: ethValue,
        account: userAddress as `0x${string}`,
        chain: getChainFromId(chainId),
      });

      console.log('Pool initialization transaction submitted:', hash);
      
      // Add the pool to deployed pools in localStorage
      // if (params.poolId) {
      //   addDeployedPool(params.poolId);
      // }
      
      return { success: true, poolId: params.poolId, hash };

    } catch (error: any) {
      console.error('Error initializing pool:', error);
      return { success: false, error: error.message };
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    poolState,
    validation,
    isInitializing,
    initializePool,
    updateToken0,
    updateToken1,
    updateFee,
    updateHook,
    updateSqrtPriceX96,
    validatePool,
    calculateInitialSqrtPrice
  };
}