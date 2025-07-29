import { useState, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseUnits, keccak256, encodePacked, encodeAbiParameters, maxUint256, encodeFunctionData, getAddress } from 'viem'
import { SUPPORTED_NETWORKS } from '../constants/networks'
import { CONTRACTS } from '../constants/contracts'
import { V4Planner, Actions } from '@uniswap/v4-sdk'
import { Token as SDKToken, Currency, TradeType, Percent, CurrencyAmount } from '@uniswap/sdk-core'
import universalRouterAbi from '../../contracts/universalRouter.json'
import permit2Abi from '../../contracts/permit2.json'
import { ERC20_ABI } from '../../contracts/ERC20_ABI'


//TO-DO: Swapping tokens and sending to a recepient, Multi Hop swap
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface PoolKey {
  currency0: string
  currency1: string
  fee: number
  tickSpacing: number
  hooks: string
}

interface SwapState {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  poolKey: PoolKey | null
  slippageTolerance: number
  deadline: number
}

interface SwapValidation {
  tokenInError?: string
  tokenOutError?: string
  amountInError?: string
  poolIdError?: string
}

interface PoolInfo {
  token0Symbol: string
  token1Symbol: string
  fee: number
  liquidity: string
  tick: number
}

interface SwapResult {
  success: boolean
  error?: string
  txHash?: string
}

// V4 Universal Router Commands - following SDK pattern
const CommandType = {
  V4_SWAP: 0x10
} as const

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

const PERMIT2_DOMAIN = {
  name: 'Permit2',
  chainId: 0,
  verifyingContract: PERMIT2_ADDRESS as `0x${string}`
};

// Export utility functions that can be imported directly
export const isNativeToken = (tokenAddress: string): boolean => {
  return tokenAddress === '0x0000000000000000000000000000000000000000' ||
         tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
};

export const normalizeTokenAddress = (tokenAddress: string): string => {
  if (isNativeToken(tokenAddress)) {
    return '0x0000000000000000000000000000000000000000';
  }
  return tokenAddress;
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

export function useV4Swap() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  // Prefer walletClient.chain.id, fallback to publicClient.chain.id, fallback to 1 (mainnet)
  const chainId = walletClient?.chain.id || publicClient?.chain?.id || 1;

  // Remove getChainFromId function entirely since we're using walletClient.chain directly

  const approveTokenToPermit2 = async (tokenAddress: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    const normalizedAddress = normalizeTokenAddress(tokenAddress);
    if (!walletClient || !publicClient || isNativeToken(normalizedAddress)) {
      return { success: true };
    }

    try {
      const currentAllowance = await publicClient.readContract({
        address: normalizedAddress as `0x${string}`,
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
        to: normalizedAddress as `0x${string}`,
        data,
        account: address as `0x${string}`,
        chain: walletClient.chain!, // Use walletClient.chain directly
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const checkPermit2Allowance = async (tokenAddress: string, spender: string): Promise<{ amount: bigint; expiration: number; nonce: number }> => {
    const normalizedAddress = normalizeTokenAddress(tokenAddress);
    if (!publicClient || !address || isNativeToken(normalizedAddress)) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }

    try {
      const result = await publicClient.readContract({
        address: PERMIT2_ADDRESS as `0x${string}`,
        abi: permit2Abi.abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, normalizedAddress as `0x${string}`, spender as `0x${string}`]
      }) as [bigint, bigint, bigint]; // Type the result properly

      return {
        amount: result[0],
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

  const executeSwap = async (swapParameters: {
    poolKey: PoolKey;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    amountOutMinimum: string;
    recipient?: string;
    deadline?: number;
    usePermit?: boolean;
  }): Promise<SwapResult> => {
    if (!isConnected || !walletClient || !publicClient || !chainId) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const { poolKey, tokenIn, tokenOut, amountIn, amountOutMinimum, recipient, deadline, usePermit } = swapParameters;
      
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      
      // Parse amounts
      const amountInWei = parseUnits(amountIn.replace(/,/g, ''), tokenIn.decimals);
      const amountOutMinWei = parseUnits(amountOutMinimum.replace(/,/g, ''), tokenOut.decimals);
      
      const universalRouterAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.UniversalRouter;
      if (!universalRouterAddress) {
        return { success: false, error: 'Universal Router not available on this chain' };
      }

      // Step 1: Skip Permit2 approval for native tokens, only approve ERC-20 tokens
      const normalizedTokenInAddress = normalizeTokenAddress(tokenIn.address);
      if (!isNativeToken(normalizedTokenInAddress)) {
        const permit2Expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now
        // Approve Permit2 for Universal Router with maxUint256 and 30 days expiration
        const approval = await approveTokenToPermit2(tokenIn.address, amountInWei);
        if (!approval.success) {
          return { success: false, error: approval.error };
        }
        // Explicitly approve Universal Router in Permit2 with 30-day expiration
        const permit2ApprovalTx = await walletClient.writeContract({
          address: PERMIT2_ADDRESS as `0x${string}`,
          abi: permit2Abi.abi,
          functionName: 'approve',
          args: [
            normalizedTokenInAddress as `0x${string}`,
            universalRouterAddress as `0x${string}`,
            amountInWei,
            BigInt(permit2Expiration)
          ],
          account: address as `0x${string}`,
          chain: walletClient.chain!, // Use walletClient.chain directly
        });
        await publicClient.waitForTransactionReceipt({ hash: permit2ApprovalTx });
      }
      // Step 2: Skip SDK Currency objects - we don't actually need them for V4Planner
      // The V4Planner works directly with addresses from the poolKey
      // Step 3: Skip CurrencyAmount objects - not needed for direct V4Planner usage

      // Step 4: Create V4Planner with exact test pattern
      const v4Planner = new V4Planner();
      
      // Determine zeroForOne based on poolKey currencies (already ordered)
      const zeroForOne = poolKey.currency0.toLowerCase() === normalizedTokenInAddress.toLowerCase();
      console.log(normalizedTokenInAddress, poolKey.currency0)
      // Add swap action - exact match to test pattern
      v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
        {
          poolKey: poolKey,
          zeroForOne: zeroForOne,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMinWei,
          hookData: '0x'
        }
      ]);
      
      // Add settle all - use poolKey currency addresses
      v4Planner.addAction(Actions.SETTLE_ALL, [
        zeroForOne ? poolKey.currency0 : poolKey.currency1, // Input currency from poolKey
        maxUint256 // Use MAX_UINT like in tests
      ]);
      
      // Add take all - use poolKey currency addresses  
      v4Planner.addAction(Actions.TAKE_ALL, [
        zeroForOne ? poolKey.currency1 : poolKey.currency0, // Output currency from poolKey
        BigInt(0) // Use 0 like in tests
      ]);
      
      // Step 5: Access actions and params directly like in tests
      const encodedActions = (typeof v4Planner.actions === 'string' && v4Planner.actions.startsWith('0x'))
        ? v4Planner.actions as `0x${string}`
        : `0x${Buffer.from(v4Planner.actions).toString('hex')}` as `0x${string}`;
      const encodedParams = Array.isArray(v4Planner.params)
        ? v4Planner.params.map(p => (typeof p === 'string' && p.startsWith('0x')) ? p as `0x${string}` : `0x${Buffer.from(p).toString('hex')}` as `0x${string}`)
        : [];
      
      // Step 6: Create Universal Router command exactly like tests
      const commands = encodePacked(['uint8'], [CommandType.V4_SWAP]);
      
      // Step 7: Properly structure inputs - combine actions and params into single input
      const combinedInput = encodeAbiParameters(
        [{ name: 'actions', type: 'bytes' }, { name: 'params', type: 'bytes[]' }],
        [encodedActions, encodedParams]
      );
      const inputs = [combinedInput];
      
      // Step 8: Calculate ETH value for native token swaps
      let ethValue = BigInt(0);
      if (isNativeToken(normalizedTokenInAddress)) {
        ethValue = amountInWei;
      }

      // Step 9: Execute the swap with proper 3-parameter structure
      const transactionConfig: any = {
        to: universalRouterAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: universalRouterAbi.abi,
          functionName: 'execute',
          args: [commands, inputs, swapDeadline]
        }),
        value: ethValue,
        account: address as `0x${string}`,
        chain: walletClient.chain!, // Use walletClient.chain directly
      };
      // Estimate gas to see what's happening
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: universalRouterAddress as `0x${string}`,
          data: transactionConfig.data,
          value: ethValue,
          gas: 5000000n // Increased gas limit for estimation
        });
        console.log('Estimated gas:', gasEstimate.toString());
      } catch (error) {
        console.log('Gas estimation failed:', error);
      }
      // Only log the config, do not reference any gas fee properties
      console.log('Swap transaction config:', {
        to: universalRouterAddress,
        value: ethValue.toString(),
        isNativeToken: isNativeToken(normalizedTokenInAddress),
        amountIn: amountInWei.toString(),
        amountOutMin: amountOutMinWei.toString(),
        gas: gasEstimate ? gasEstimate.toString() : 'not set',
        gasFees: 'Using wallet/provider defaults'
      });

      const hash = await walletClient.sendTransaction(transactionConfig);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 120_000,
      });

      if (receipt.status === 'success') {
        return { success: true, txHash: hash };
      } else {
        return { success: false, error: 'Transaction reverted' };
      }

    } catch (error: any) {
      console.error('Swap execution error:', error);
      
      // Check if it's a user rejection error
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes('User denied') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('MetaMask Tx Signature: User denied') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('user cancelled')
      ) {
        return { success: false, error: 'User rejected the transaction' };
      } else {
        return { success: false, error: errorMessage };
      }
    }
  };

  // State management for the swap form
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    poolKey: null,
    slippageTolerance: 50, // 0.5%
    deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
  });

  const [validation, setValidation] = useState<SwapValidation>({});
  const [isSwapping, setIsSwapping] = useState(false);
  const [isValidatingPool, setIsValidatingPool] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  // Update functions
  const updateTokenIn = useCallback((token: Token | null) => {
    setSwapState(prev => ({ ...prev, tokenIn: token }));
  }, []);

  const updateTokenOut = useCallback((token: Token | null) => {
    setSwapState(prev => ({ ...prev, tokenOut: token }));
  }, []);

  const updateAmountIn = useCallback((amount: string) => {
    setSwapState(prev => ({ ...prev, amountIn: amount }));
  }, []);

  const updatePoolId = useCallback((poolKeyStr: string) => {
    try {
      const poolKey = poolKeyStr ? JSON.parse(poolKeyStr) : null;
      setSwapState(prev => ({ ...prev, poolKey }));
    } catch (error) {
      setSwapState(prev => ({ ...prev, poolKey: null }));
    }
  }, []);

  const updateSlippageTolerance = useCallback((tolerance: number) => {
    setSwapState(prev => ({ ...prev, slippageTolerance: tolerance }));
  }, []);

  const updateDeadline = useCallback((deadline: number) => {
    setSwapState(prev => ({ ...prev, deadline }));
  }, []);

  const swapTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: ''
    }));
  }, []);

  const validateSwap = (): boolean => {
    const newValidation: SwapValidation = {};
    
    if (!swapState.tokenIn) {
      newValidation.tokenInError = 'Select input token';
    }
    
    if (!swapState.tokenOut) {
      newValidation.tokenOutError = 'Select output token';
    }
    
    if (!swapState.amountIn || parseFloat(swapState.amountIn) <= 0) {
      newValidation.amountInError = 'Enter valid amount';
    }
    
    if (!swapState.poolKey) {
      newValidation.poolIdError = 'Enter pool key';
    }
    
    setValidation(newValidation);
    
    return Object.keys(newValidation).length === 0;
  };

  // Main execute swap function that matches your component
  const executeSwapFromState = async (): Promise<SwapResult> => {
    if (!isConnected || !walletClient || !publicClient || !chainId) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!swapState.tokenIn || !swapState.tokenOut || !swapState.amountIn || !swapState.poolKey) {
      return { success: false, error: 'Missing required swap parameters' };
    }

    setIsSwapping(true);

    try {
      const result = await executeSwap({
        poolKey: swapState.poolKey,
        tokenIn: swapState.tokenIn,
        tokenOut: swapState.tokenOut,
        amountIn: swapState.amountIn,
        amountOutMinimum: swapState.amountOut || '0',
        recipient: address ?? undefined,
        deadline: swapState.deadline,
        usePermit: true
      });

      return result;
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    // State
    swapState,
    validation,
    isSwapping,
    isValidatingPool,
    poolInfo,
    
    // Update functions
    updateTokenIn,
    updateTokenOut,
    updateAmountIn,
    updatePoolId,
    updateSlippageTolerance,
    updateDeadline,
    swapTokens,
    
    // Validation and execution
    validateSwap,
    executeSwap: executeSwapFromState,
    
    // Permit2 functions
    approveTokenToPermit2,
    checkPermit2Allowance,
    signPermit2Batch,
    
    // Core swap function (for direct use)
    executeSwapDirect: executeSwap,
    
    // Utility functions
    // Remove getChainFromId from return since we're not using it anymore
  };
}
