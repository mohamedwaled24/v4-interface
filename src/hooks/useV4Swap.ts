import { useState, useCallback } from 'react'
import { useWallet } from './useWallet'
import { parseUnits, formatUnits } from 'viem'

// V4 Pool ABI (only the swap function)
const V4_POOL_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'zeroForOne', type: 'bool' },
      { name: 'amountSpecified', type: 'int256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' },
      { name: 'data', type: 'bytes' }
    ],
    name: 'swap',
    outputs: [
      { name: 'amount0', type: 'int256' },
      { name: 'amount1', type: 'int256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface Pool {
  address: string
  token0: Token
  token1: Token
  fee: number
  hookAddress: string
}

interface SwapState {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  selectedPool: Pool | null
  slippageTolerance: number
  deadline: number
}

interface SwapValidation {
  tokenInError?: string
  tokenOutError?: string
  amountInError?: string
  poolError?: string
}

interface SwapResult {
  success: boolean
  error?: string
  txHash?: string
}

// Whether we're in test mode (simulating swaps)
const isTestMode = true;

export function useV4Swap() {
  const { publicClient, walletClient, address, network } = useWallet()
  const [isSwapping, setIsSwapping] = useState(false)
  const [isLoadingPools, setIsLoadingPools] = useState(false)
  const [availablePools, setAvailablePools] = useState<Pool[]>([])
  
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    selectedPool: null,
    slippageTolerance: 0.5, // 0.5% default
    deadline: 20, // 20 minutes default
  })
  
  const [validation, setValidation] = useState<SwapValidation>({})

  const validateSwap = useCallback((): boolean => {
    const errors: SwapValidation = {}

    if (!swapState.tokenIn) {
      errors.tokenInError = 'Select a token'
    }
    
    if (!swapState.tokenOut) {
      errors.tokenOutError = 'Select a token'
    }
    
    if (swapState.tokenIn && swapState.tokenOut && 
        swapState.tokenIn.address.toLowerCase() === swapState.tokenOut.address.toLowerCase()) {
      errors.tokenInError = 'Tokens must be different'
      errors.tokenOutError = 'Tokens must be different'
    }
    
    if (!swapState.amountIn || parseFloat(swapState.amountIn) <= 0) {
      errors.amountInError = 'Enter an amount'
    }
    
    if (!swapState.selectedPool) {
      errors.poolError = 'Select a pool'
    }

    setValidation(errors)
    return Object.keys(errors).length === 0
  }, [swapState])

  const fetchAvailablePools = useCallback(async (tokenA: Token, tokenB: Token): Promise<Pool[]> => {
    setIsLoadingPools(true)
    
    try {
      // For test purposes, we'll create a mock pool if none exists
      if (availablePools.length === 0) {
        // Sort tokens by address to match pool creation logic
        const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() 
          ? [tokenA, tokenB] 
          : [tokenB, tokenA];
          
        const mockPool: Pool = {
          address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // Test address
          token0,
          token1,
          fee: 3000, // 0.3%
          hookAddress: '0x0000000000000000000000000000000000000000'
        }
        
        setAvailablePools([mockPool])
        return [mockPool]
      }
      
      return availablePools;
    } catch (error) {
      console.error('Error fetching pools:', error)
      return []
    } finally {
      setIsLoadingPools(false)
    }
  }, [availablePools])

  const getPoolPrice = useCallback(async (pool: Pool, zeroForOne: boolean): Promise<string> => {
    if (isTestMode) {
      // For test mode, use fixed prices based on token decimals
      // If WETH to USDC, 1 WETH ≈ 2000 USDC
      // If USDC to WETH, 1 USDC ≈ 0.0005 WETH
      if (pool.token0.symbol === 'WETH' && pool.token1.symbol === 'USDC') {
        return zeroForOne ? '2000' : '0.0005';
      } else if (pool.token0.symbol === 'USDC' && pool.token1.symbol === 'WETH') {
        return zeroForOne ? '0.0005' : '2000';
      }
      
      // Default test price 
      return '1.0'
    }
    
    // In a real implementation, we would query the pool contract to get the current price
    if (!publicClient) {
      return '0'
    }
    
    try {
      // Actual pool price query would go here
      return '1.0'
    } catch (error) {
      console.error('Error getting pool price:', error)
      return '0'
    }
  }, [publicClient])

  const calculateAmountOut = useCallback(async (
    amountIn: string,
    tokenIn: Token,
    tokenOut: Token,
    pool: Pool
  ): Promise<string> => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      return '0'
    }
    
    try {
      // Determine if we're swapping token0 for token1 or vice versa
      const zeroForOne = tokenIn.address.toLowerCase() === pool.token0.address.toLowerCase();
      
      // Get the pool price
      const price = await getPoolPrice(pool, zeroForOne);
      
      // Calculate output amount based on input, price, and token decimals
      let amountOut: number;
      
      if (isTestMode) {
        // In test mode, adjust for token decimals in the calculation
        const amountInFloat = parseFloat(amountIn);
        amountOut = amountInFloat * parseFloat(price);
        
        // Apply a small price impact (0.3% as per the pool fee)
        const priceImpact = 0.003; // 0.3%
        amountOut = amountOut * (1 - priceImpact);
      } else {
        // In real implementation, this would use proper calculations
        amountOut = parseFloat(amountIn) * parseFloat(price);
      }
      
      // Round to appropriate number of decimals based on the output token
      const decimals = tokenOut.decimals;
      return amountOut.toFixed(Math.min(decimals, 8));
    } catch (error) {
      console.error('Error calculating amount out:', error)
      return '0'
    }
  }, [getPoolPrice])

  const executeSwap = useCallback(async (): Promise<SwapResult> => {
    if (!validateSwap()) {
      return { success: false, error: 'Invalid swap parameters' }
    }
    
    const { tokenIn, tokenOut, amountIn, selectedPool, slippageTolerance, deadline } = swapState;
    
    if (!tokenIn || !tokenOut || !selectedPool) {
      return { success: false, error: 'Missing swap parameters' }
    }
    
    setIsSwapping(true);
    
    try {
      if (isTestMode) {
        // In test mode, simulate a successful swap
        // Wait for a short time to simulate transaction processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Calculate final output amount with slippage
        const amountOut = await calculateAmountOut(amountIn, tokenIn, tokenOut, selectedPool);
        const slippageAdjustedAmount = parseFloat(amountOut) * (1 - slippageTolerance / 100);
        
        // Update the state with the output amount
        setSwapState(prev => ({ ...prev, amountOut: slippageAdjustedAmount.toString() }));
        
        // Return a mock transaction hash
        return {
          success: true,
          txHash: `0x${Math.random().toString(16).substring(2, 62)}`
        };
      }
      
      // For real implementation
      if (!walletClient || !publicClient || !address) {
        return { success: false, error: 'Wallet not connected' }
      }
      
      // Determine if we're swapping token0 for token1 or vice versa
      const zeroForOne = tokenIn.address.toLowerCase() === selectedPool.token0.address.toLowerCase();
      
      // Calculate amount with slippage
      const parsedAmount = parseUnits(amountIn, tokenIn.decimals);
      
      // Set a reasonable price limit (this would need to be calculated properly in a real implementation)
      const sqrtPriceLimitX96 = zeroForOne
        ? BigInt('4295128740') // Minimum price
        : BigInt('1461446703485210103287273052203988822378723970341'); // Maximum price
      
      // Prepare the transaction
      const { request } = await publicClient.simulateContract({
        address: selectedPool.address as `0x${string}`,
        abi: V4_POOL_ABI,
        functionName: 'swap',
        args: [
          address as `0x${string}`,
          zeroForOne,
          parsedAmount,
          sqrtPriceLimitX96,
          '0x' as `0x${string}`, // No hook data for now
        ],
        account: address as `0x${string}`,
      });
      
      // Send the transaction
      const hash = await walletClient.writeContract(request);
      
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        success: true,
        txHash: hash,
      };
    } catch (error: any) {
      console.error('Error executing swap:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute swap',
      };
    } finally {
      setIsSwapping(false);
    }
  }, [walletClient, publicClient, address, swapState, validateSwap, calculateAmountOut])

  const updateTokenIn = useCallback((token: Token) => {
    setSwapState(prev => ({ ...prev, tokenIn: token }));
    setValidation(prev => ({ ...prev, tokenInError: undefined }));
    
    // If we have both tokens, fetch available pools
    if (swapState.tokenOut) {
      fetchAvailablePools(token, swapState.tokenOut);
    }
  }, [swapState.tokenOut, fetchAvailablePools])

  const updateTokenOut = useCallback((token: Token) => {
    setSwapState(prev => ({ ...prev, tokenOut: token }));
    setValidation(prev => ({ ...prev, tokenOutError: undefined }));
    
    // If we have both tokens, fetch available pools
    if (swapState.tokenIn) {
      fetchAvailablePools(swapState.tokenIn, token);
    }
  }, [swapState.tokenIn, fetchAvailablePools])

  const updateAmountIn = useCallback(async (amount: string) => {
    setSwapState(prev => ({ ...prev, amountIn: amount }));
    setValidation(prev => ({ ...prev, amountInError: undefined }));
    
    // Calculate amount out if we have all the necessary data
    if (swapState.tokenIn && swapState.tokenOut && swapState.selectedPool) {
      const amountOut = await calculateAmountOut(
        amount,
        swapState.tokenIn,
        swapState.tokenOut,
        swapState.selectedPool
      );
      setSwapState(prev => ({ ...prev, amountOut }));
    }
  }, [swapState.tokenIn, swapState.tokenOut, swapState.selectedPool, calculateAmountOut])

  const updateSelectedPool = useCallback((pool: Pool) => {
    setSwapState(prev => ({ ...prev, selectedPool: pool }));
    setValidation(prev => ({ ...prev, poolError: undefined }));
    
    // Recalculate amount out with the new pool
    if (swapState.amountIn && swapState.tokenIn && swapState.tokenOut) {
      calculateAmountOut(
        swapState.amountIn,
        swapState.tokenIn,
        swapState.tokenOut,
        pool
      ).then(amountOut => {
        setSwapState(prev => ({ ...prev, amountOut }));
      });
    }
  }, [swapState.amountIn, swapState.tokenIn, swapState.tokenOut, calculateAmountOut])

  const updateSlippageTolerance = useCallback((slippage: number) => {
    setSwapState(prev => ({ ...prev, slippageTolerance: slippage }));
  }, [])

  const updateDeadline = useCallback((minutes: number) => {
    setSwapState(prev => ({ ...prev, deadline: minutes }));
  }, [])

  const swapTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: '',
    }));
  }, [])

  return {
    swapState,
    validation,
    isSwapping,
    isLoadingPools,
    availablePools,
    updateTokenIn,
    updateTokenOut,
    updateAmountIn,
    updateSelectedPool,
    updateSlippageTolerance,
    updateDeadline,
    swapTokens,
    executeSwap,
    validateSwap,
    setAvailablePools
  }
} 