import { useState } from 'react'
import { parseUnits, formatUnits, maxUint256, encodeFunctionData } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { useWallet } from './useWallet'
import { CONTRACTS } from '../constants/contracts'
import { generatePoolId } from '../utils/stateViewUtils'

import { Token, Percent, Ether } from '@uniswap/sdk-core'
import { Pool, Position } from '@uniswap/v4-sdk'
import { V4PositionManager } from '@uniswap/v4-sdk'
import { nearestUsableTick } from '@uniswap/v3-sdk'
import { getPoolInfo } from '../utils/stateViewUtils'
import { positionManagerAbi } from '../../contracts/positionManager'
import { calculateTickSpacingFromFeeAmount } from '../components/Liquidity/utils'

// Permit2 contract address (same across all networks)
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

interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

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
  slippageToleranceBips?: number; // e.g., 50 = 0.5%
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
  // Internal data for actual execution
  _positionData?: {
    position: Position;
    mintOptions: any;
    token0: any;
    token1: any;
    positionManagerAddress: string;
  };
}

interface ExecuteTransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export function useV4Position() {
  const { publicClient, walletClient, chainId, address, isConnected } = useWallet()
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)

  // Helper function to get chain object from chainId
  const getChainFromId = (chainId: number) => {
    switch (chainId) {
      case 1:
        return mainnet;
      case 11155111:
        return sepolia;
      case 1301:
        // Unichain Sepolia - you may need to define this chain object
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

  // Helper function to approve token spending via Permit2
  const approveTokenForPermit2 = async (tokenAddress: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    if (!walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Skip approval for native ETH
      if (isNativeToken(tokenAddress)) {
        return { success: true };
      }

      console.log(`Checking Permit2 approval for token ${tokenAddress}`);

      // Check current allowance to Permit2 contract
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, PERMIT2_ADDRESS as `0x${string}`]
      });

      console.log(`Current Permit2 allowance: ${currentAllowance.toString()}`);

      // If allowance is sufficient, no need to approve
      if (currentAllowance >= amount) {
        console.log(`Token ${tokenAddress} already has sufficient Permit2 allowance`);
        return { success: true };
      }

      console.log(`Approving token ${tokenAddress} for Permit2 contract: ${PERMIT2_ADDRESS}`);

      // Approve token to Permit2 contract (not Position Manager)
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
      
      console.log(`Permit2 approval successful: ${hash}`);
      return { success: true };
    } catch (error: any) {
      console.error('Permit2 approval failed:', error);
      return { success: false, error: error.message || 'Permit2 approval failed' };
    }
  };
  const isNativeToken = (tokenAddress: string): boolean => {
    return tokenAddress === '0x0000000000000000000000000000000000000000' ||
           tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  };

  // Helper function to approve token spending
  const approveToken = async (tokenAddress: string, spender: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    if (!walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Skip approval for native ETH
      if (isNativeToken(tokenAddress)) {
        return { success: true };
      }

      console.log(`Checking and approving token ${tokenAddress} for ${spender}`);

      // Always do a fresh approval to avoid Permit2 expiration issues
      // First, check if we need to reset existing approval
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, spender as `0x${string}`]
      });

      console.log(`Current allowance: ${currentAllowance.toString()}`);

      // If there's an existing approval, reset it first to avoid Permit2 issues
      if (currentAllowance > 0n) {
        console.log(`Resetting existing approval for ${tokenAddress}`);
        
        const resetData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spender as `0x${string}`, 0n] // Reset to 0
        });

        const resetHash = await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data: resetData,
          account: address as `0x${string}`,
          chain: getChainFromId(chainId!),
        });

        await publicClient.waitForTransactionReceipt({ hash: resetHash });
        console.log(`Reset approval successful: ${resetHash}`);
      }

      // Now set the new approval
      console.log(`Setting new approval for ${tokenAddress}`);
      
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, maxUint256] // Max approval
      });

      const approveHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data: approveData,
        account: address as `0x${string}`,
        chain: getChainFromId(chainId!),
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      
      console.log(`Token approval successful: ${approveHash}`);
      return { success: true };
    } catch (error: any) {
      console.error('Token approval failed:', error);
      return { success: false, error: error.message || 'Token approval failed' };
    }
  };

  // Function to calculate required amounts (for token input updates)
  const calculateRequiredAmounts = async (params: AddLiquidityParams): Promise<CalculateAmountsResult> => {
    if (!chainId) return { success: false, error: 'Chain ID not available.' }

    if (!CONTRACTS[chainId as keyof typeof CONTRACTS])
      return { success: false, error: `Unsupported chain ID: ${chainId}` }

    try {
      // Sort tokens by address
      let token0 = params.token0
      let token1 = params.token1
      let tickLower = params.tickLower
      let tickUpper = params.tickUpper

      console.log("Token0: ", token0.address)
      console.log("Token1: ", token1.address)

      if (token0?.address && token1?.address && token0.address.toLowerCase() > token1.address.toLowerCase()) {
        [token0, token1] = [token1, token0]
        [tickLower, tickUpper] = [tickUpper * -1, tickLower * -1]
      }      

      // Calculate tick spacing based on fee
      const tickSpacing = calculateTickSpacingFromFeeAmount(params.fee);
      const hookAddress = params.hookAddress || '0x0000000000000000000000000000000000000000';

      // Generate pool ID
      const poolKey = {
        currency0: token0.address,
        currency1: token1.address,
        fee: params.fee,
        tickSpacing,
        hooks: hookAddress
      };
      const poolId = generatePoolId(poolKey);

      // Parse amounts - use sorted token amounts
      const amount0 = parseUnits(token0.address === params.token0.address ? params.token0.amount : params.token1.amount, token0.decimals)
      const amount1 = parseUnits(token1.address === params.token1.address ? params.token1.amount : params.token0.amount, token1.decimals)

      // Check for native currency
      const isToken0Native = isNativeToken(token0.address);
      const isToken1Native = isNativeToken(token1.address);
      
      // Create currency instances
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

      const poolInfo = await getPoolInfo(chainId, import.meta.env.VITE_SEPOLIA_RPC_URL, poolId);
      if (!poolInfo) {
        console.error('Pool does not exist or could not fetch real state');
        return { success: false, error: 'Failed to fetch pool data' };
      } else {
        console.log("Pool Info: ", poolInfo);
      }

      // Construct Pool instance
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

      console.log('Pool params:', {
        token0: currency0,
        token1: currency1,
        fee: params.fee,
        tickSpacing,
        tickLower,
        tickUpper
      });

      // Create Position instance using fromAmounts
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

      // Compute and print mint amounts with slippage
      const slippageBips = params.slippageToleranceBips ?? 50; // default 0.5%
      const slippageTolerance = new Percent(slippageBips, 10_000);

      const { amount0: requiredAmount0, amount1: requiredAmount1 } =
        position.mintAmountsWithSlippage(slippageTolerance);

      const requiredAmount0Formatted = formatUnits(BigInt(requiredAmount0.toString()), token0.decimals);
      const requiredAmount1Formatted = formatUnits(BigInt(requiredAmount1.toString()), token1.decimals);

      console.log('--- Required amounts for user with slippage ---');
      console.log(
        `amount0 (${token0.symbol ?? 'token0'}):`,
        requiredAmount0Formatted
      )
      console.log(
        `amount1 (${token1.symbol ?? 'token1'}):`,
        requiredAmount1Formatted
      )

      // Get Position Manager address for later use
      const positionManagerAddress = CONTRACTS[chainId as keyof typeof CONTRACTS].PositionManager;
      if (!positionManagerAddress) {
        return { success: false, error: 'Position Manager not available for this chain' };
      }

      // Prepare mint options for later use
      let userAddress = address;
      if (!userAddress && walletClient) {
        try {
          const addresses = await walletClient.getAddresses();
          if (addresses && addresses.length > 0) userAddress = addresses[0];
        } catch (error) {}
      }
      if (!userAddress) userAddress = address || '0x';

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
      const mintOptions = {
        slippageTolerance,
        deadline,
        recipient: userAddress,
        useNative: (isToken0Native || isToken1Native) ? Ether.onChain(chainId) : undefined,
      };

      return {
        success: true,
        requiredAmount0: requiredAmount0Formatted,
        requiredAmount1: requiredAmount1Formatted,
        poolInfo: {
          sqrtPriceX96: poolInfo.sqrtPriceX96,
          liquidity: poolInfo.liquidity,
          tick: poolInfo.tick
        },
        // Store position data for later execution
        _positionData: {
          position,
          mintOptions,
          token0,
          token1,
          positionManagerAddress
        }
      };

    } catch (error: any) {
      console.error('Error calculating required amounts:', error);
      return { success: false, error: error.message || 'Failed to calculate required amounts' };
    }
  };

  // Function to execute the actual transaction (for "Create" button)
  const executeTransaction = async (calculationResult: CalculateAmountsResult): Promise<ExecuteTransactionResult> => {
    if (!isConnected) return { success: false, error: 'Wallet not connected.' }
    if (!walletClient) return { success: false, error: 'Wallet client not initialized.' }
    if (!publicClient) return { success: false, error: 'Public client not initialized.' }
    if (!chainId) return { success: false, error: 'Chain ID not available.' }
    if (!calculationResult._positionData) return { success: false, error: 'Position data not available. Please recalculate amounts first.' }

    let userAddress = address;
    if (!userAddress && walletClient) {
      try {
        const addresses = await walletClient.getAddresses();
        if (addresses && addresses.length > 0) userAddress = addresses[0];
      } catch (error) {}
    }
    if (!userAddress) return { success: false, error: 'Address not available.' }

    setIsAddingLiquidity(true);

    try {
      const { position, mintOptions, token0, token1, positionManagerAddress } = calculationResult._positionData;
      const { requiredAmount0, requiredAmount1 } = calculationResult;

      if (!requiredAmount0 || !requiredAmount1) {
        return { success: false, error: 'Required amounts not calculated' };
      }

      console.log('--- Starting actual minting process ---');

      // Step 1: Approve tokens to Permit2 (not Position Manager)
      console.log('Step 1: Approving tokens to Permit2...');
      
      const approval0 = await approveTokenForPermit2(token0.address, parseUnits(requiredAmount0, token0.decimals));
      if (!approval0.success) {
        return { success: false, error: `Failed to approve ${token0.symbol} to Permit2: ${approval0.error}` };
      }

      const approval1 = await approveTokenForPermit2(token1.address, parseUnits(requiredAmount1, token1.decimals));
      if (!approval1.success) {
        return { success: false, error: `Failed to approve ${token1.symbol} to Permit2: ${approval1.error}` };
      }

      console.log('Permit2 approvals completed successfully');

      // Step 2: Generate calldata using V4PositionManager
      console.log('Step 2: Generating calldata...');
      const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);

      console.log('Generated calldata:', calldata);
      console.log('Transaction value from SDK:', value);

      // HOTFIX: Calculate the correct ETH value manually
      // The SDK is generating wrong values for native ETH
      let correctValue = BigInt(0);
      
      // Check if we're depositing native ETH and calculate the correct amount
      const isToken0Native = isNativeToken(token0.address);
      const isToken1Native = isNativeToken(token1.address);
      
      if (isToken0Native) {
        correctValue = parseUnits(requiredAmount0, 18); // ETH has 18 decimals
        console.log(`Using native ETH amount for token0: ${requiredAmount0} ETH = ${correctValue} wei`);
      } else if (isToken1Native) {
        correctValue = parseUnits(requiredAmount1, 18); // ETH has 18 decimals
        console.log(`Using native ETH amount for token1: ${requiredAmount1} ETH = ${correctValue} wei`);
      }
      
      console.log('Corrected transaction value:', correctValue.toString());
      console.log('SDK value was:', BigInt(value).toString());
      console.log('Difference factor:', BigInt(value) / correctValue);

      // Step 3: Simulate the transaction
      console.log('Step 3: Simulating transaction...');
      
      // Let's try a different approach - skip simulation for now and just execute
      console.log('Skipping simulation and attempting direct execution...');
      
      // Step 4: Execute the transaction directly
      console.log('Step 4: Executing transaction...');
      
      const hash = await walletClient.sendTransaction({
        to: positionManagerAddress as `0x${string}`,
        data: calldata as `0x${string}`,
        value: correctValue, // Use our corrected value instead of SDK value
        account: userAddress as `0x${string}`,
        chain: getChainFromId(chainId),
      });

      console.log('Transaction submitted:', hash);

      // Wait for confirmation with longer timeout for testnet
      console.log('Waiting for transaction confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60_000 // 60 seconds timeout for testnet
      });
      
      console.log('Transaction receipt:', receipt);
      
      if (receipt.status === 'success') {
        console.log('Position created successfully!');
        return { success: true, hash };
      } else if (receipt.status === 'reverted') {
        console.log('Transaction was reverted');
        return { success: false, error: 'Transaction was reverted by the contract' };
      } else {
        console.log('Transaction status unclear:', receipt.status);
        return { success: false, error: `Transaction status: ${receipt.status}` };
      }

    } catch (error: any) {
      console.error('Error executing transaction:', error);
      
      // Provide specific error messages
      if (error.message.includes('0x3b99b53d') || error.message.includes('InvalidSigner')) {
        return { 
          success: false, 
          error: 'InvalidSigner error: This is likely due to using a smart contract wallet or signature verification issues. Please try using MetaMask or another EOA wallet.' 
        };
      } else if (error.message.includes('InsufficientBalance')) {
        return { 
          success: false, 
          error: 'Insufficient token balance. Please ensure you have enough tokens and ETH for gas fees.' 
        };
      } else if (error.message.includes('DeadlinePassed')) {
        return { 
          success: false, 
          error: 'Transaction deadline has passed. Please try again.' 
        };
      } else {
        return { 
          success: false, 
          error: error.message || 'Transaction failed' 
        };
      }
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  return {
    // New separated functions
    calculateRequiredAmounts,
    executeTransaction,
    
    // State
    isAddingLiquidity,
  };
}