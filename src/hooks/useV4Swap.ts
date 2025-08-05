import { useState, useCallback, useRef } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import {formatUnits } from 'viem'
import { parseUnits, keccak256, encodePacked, encodeAbiParameters, maxUint256, encodeFunctionData, getAddress } from 'viem'
import { SUPPORTED_NETWORKS } from '../constants/networks'
import { CONTRACTS } from '../constants/contracts'
import { V4Planner, Actions, Pool} from '@uniswap/v4-sdk'
import { Token as SDKToken, CurrencyAmount } from '@uniswap/sdk-core'
import universalRouterAbi from '../../contracts/universalRouter.json'
import permit2Abi from '../../contracts/permit2.json'
import { ERC20_ABI } from '../../contracts/ERC20_ABI'
import { getQuoteFromSqrtPriceX96 } from '../utils/getQuoteFromSqrtPriceX96'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId?: number
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
  sqrtPriceX96?: string
}

interface SwapResult {
  success: boolean
  error?: string
  txHash?: string
}

interface EnhancedPoolInfo extends PoolInfo {
  poolKey: PoolKey
  tvl?: number
  volume24h?: number
  estimatedOutput?: string
}

const CommandType = {
  V4_SWAP: 0x10
} as const

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Enhanced native token detection
export const isNativeToken = (tokenAddress: string): boolean => {
  if (!tokenAddress) return false;
  const addr = tokenAddress.toLowerCase();
  return addr === '0x0000000000000000000000000000000000000000' ||
         addr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
         addr === 'eth' ||
         addr === '0xeee';
};

// More flexible address normalization
export const normalizeTokenAddress = (tokenAddress: string, preserveNative = false): string => {
  if (!tokenAddress) return '0x0000000000000000000000000000000000000000';
  
  if (isNativeToken(tokenAddress)) {
    return preserveNative ? tokenAddress : '0x0000000000000000000000000000000000000000';
  }
  
  try {
    return getAddress(tokenAddress);
  } catch {
    return tokenAddress;
  }
};
const getWrappedTokenAddress = (chainId: number): string => {
  if (chainId === 56) return "0x0000000000000000000000000000000000000000"; // WBNB
  if (chainId === 1) return "0x0000000000000000000000000000000000000000"; // WETH
  // Add more chains as needed
  return "";
};

// ✅ FIXED: Memoized normalization to prevent unnecessary object creation
export const normalizePoolKey = (poolKey: PoolKey): PoolKey => {
  const currency0 = normalizeTokenAddress(poolKey.currency0);
  const currency1 = normalizeTokenAddress(poolKey.currency1);
  
  // Return same object if no changes needed
  if (currency0 === poolKey.currency0 && currency1 === poolKey.currency1) {
    return poolKey;
  }
  
  return {
    ...poolKey,
    currency0,
    currency1
  };
};

export const orderPoolTokens = (tokenA: string, tokenB: string): { currency0: string; currency1: string } => {
  const normalizedA = normalizeTokenAddress(tokenA);
  const normalizedB = normalizeTokenAddress(tokenB);
  
  return normalizedA.toLowerCase() < normalizedB.toLowerCase() 
    ? { currency0: normalizedA, currency1: normalizedB }
    : { currency0: normalizedB, currency1: normalizedA };
};

// ✅ FIXED: Helper to compare pool keys deeply
const arePoolKeysEqual = (a: PoolKey | null, b: PoolKey | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  return (
    a.currency0.toLowerCase() === b.currency0.toLowerCase() &&
    a.currency1.toLowerCase() === b.currency1.toLowerCase() &&
    a.fee === b.fee &&
    a.tickSpacing === b.tickSpacing &&
    a.hooks.toLowerCase() === b.hooks.toLowerCase()
  );
};

export function useV4Swap() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient(); // ✅ Use publicClient for reading contracts
  
  const chainId = walletClient?.chain?.id || publicClient?.chain?.id || 1;

  // ✅ FIXED: Use ref to track last pool key to prevent infinite updates
  const lastPoolKeyRef = useRef<PoolKey | null>(null);

  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    poolKey: null,
    slippageTolerance: 50,
    deadline: Math.floor(Date.now() / 1000) + 1800
  });

  const [validation, setValidation] = useState<SwapValidation>({});
  const [isSwapping, setIsSwapping] = useState(false);
  const [isValidatingPool, setIsValidatingPool] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  const getChainFromId = useCallback((chainId: number) => {
    const network = SUPPORTED_NETWORKS.find(net => net.id === chainId);
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return network;
  }, []);

  // ✅ FIXED: Memoized token updates to prevent unnecessary re-renders
  const updateTokenIn = useCallback((token: Token | null) => {
    console.log('🔥 useV4Swap: updateTokenIn called with:', token);
    
    setSwapState(prev => {
      // Don't update if same token
      if (prev.tokenIn === token) return prev;
      
      const tokenWithChainId = token ? {
        ...token,
        chainId: token.chainId || chainId,
        address: token.address
      } : null;
      
      console.log('🔥 useV4Swap: Setting tokenIn from', prev.tokenIn, 'to', tokenWithChainId);
      return { 
        ...prev, 
        tokenIn: tokenWithChainId,
        amountIn: '',
        amountOut: '',
        // Clear pool key when tokens change
        poolKey: null
      };
    });
    
    // Reset the ref when token changes
    lastPoolKeyRef.current = null;
  }, [chainId]);

  const updateTokenOut = useCallback((token: Token | null) => {
    console.log('🔥 useV4Swap: updateTokenOut called with:', token);
    
    setSwapState(prev => {
      // Don't update if same token
      if (prev.tokenOut === token) return prev;
      
      const tokenWithChainId = token ? {
        ...token,
        chainId: token.chainId || chainId,
        address: token.address
      } : null;
      
      console.log('🔥 useV4Swap: Setting tokenOut from', prev.tokenOut, 'to', tokenWithChainId);
      return { 
        ...prev, 
        tokenOut: tokenWithChainId,
        amountOut: '',
        // Clear pool key when tokens change
        poolKey: null
      };
    });
    
    // Reset the ref when token changes
    lastPoolKeyRef.current = null;
  }, [chainId]);

  const updateAmountIn = useCallback((amount: string) => {
    setSwapState(prev => {
      if (prev.amountIn === amount) return prev;
      return { ...prev, amountIn: amount, amountOut: '' };
    });
  }, []);

  // ✅ FIXED: Smart pool key update that prevents infinite loops
  const updatePoolId = useCallback((poolKeyStr: string) => {
    try {
      const poolKey = poolKeyStr ? JSON.parse(poolKeyStr) : null;
      const normalizedPoolKey = poolKey ? normalizePoolKey(poolKey) : null;
      
      // Check if this is actually a different pool key
      if (arePoolKeysEqual(lastPoolKeyRef.current, normalizedPoolKey)) {
        console.log('🔄 Pool key unchanged, skipping update');
        return;
      }
      
      console.log('🔄 Updating pool key:', normalizedPoolKey);
      lastPoolKeyRef.current = normalizedPoolKey;
      
      setSwapState(prev => {
        // Double-check to prevent unnecessary updates
        if (arePoolKeysEqual(prev.poolKey, normalizedPoolKey)) {
          return prev;
        }
        return { ...prev, poolKey: normalizedPoolKey };
      });
    } catch (error) {
      console.error('Invalid pool key JSON:', error);
      lastPoolKeyRef.current = null;
      setSwapState(prev => ({ ...prev, poolKey: null }));
    }
  }, []);

  const updateSlippageTolerance = useCallback((tolerance: number) => {
    setSwapState(prev => {
      if (prev.slippageTolerance === tolerance) return prev;
      return { ...prev, slippageTolerance: tolerance };
    });
  }, []);

  const updateDeadline = useCallback((deadline: number) => {
    setSwapState(prev => {
      if (prev.deadline === deadline) return prev;
      return { ...prev, deadline };
    });
  }, []);

  const swapTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: '',
      poolKey: null
    }));
    lastPoolKeyRef.current = null;
  }, []);

  // Debug version to identify the exact issue
const debugQuoteCalculation = (
  tokenIn,
  tokenOut,
  amountIn,
  poolInfo,
  normalizedPoolKey,
  zeroForOne
) => {
  console.log('🔍 DEBUG QUOTE CALCULATION:');
  console.log('Input params:', {
    tokenIn: { address: tokenIn.address, symbol: tokenIn.symbol, decimals: tokenIn.decimals },
    tokenOut: { address: tokenOut.address, symbol: tokenOut.symbol, decimals: tokenOut.decimals },
    amountIn,
    zeroForOne,
    poolSqrtPriceX96: poolInfo.sqrtPriceX96.toString(),
    poolTick: poolInfo.tick
  });

  // Debug the decimal assignment that goes to fallback
  const decimalsIn = tokenIn.decimals;
  const decimalsOut = tokenOut.decimals;
  
  console.log('Decimals being passed to fallback:', {
    decimalsIn,
    decimalsOut,
    tokenInSymbol: tokenIn.symbol,
    tokenOutSymbol: tokenOut.symbol
  });

  // Let's manually check what the fallback calculation does
  const amountInParsed = parseUnits(amountIn, decimalsIn);
  console.log('Parsed amount in:', {
    original: amountIn,
    parsed: amountInParsed.toString(),
    decimalsUsed: decimalsIn
  });

  // Debug the price calculation
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrtPriceX96 = BigInt(poolInfo.sqrtPriceX96);
  const priceX96 = (sqrtPriceX96 ** BigInt(2)) / Q96;
  
  console.log('Price calculation:', {
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceX96: priceX96.toString(),
    Q96: Q96.toString()
  });

  // Calculate based on direction
  let amountOut;
  if (zeroForOne) {
    // token0 → token1: use direct price
    amountOut = (amountInParsed * Q96) / priceX96;
    console.log('ZeroForOne = true (token0 → token1):', {
      calculation: `(${amountInParsed.toString()} * ${Q96.toString()}) / ${priceX96.toString()}`,
      result: amountOut.toString()
    });
  } else {
    // token1 → token0: use inverse price  
    amountOut = (amountInParsed * priceX96) / Q96;
    console.log('ZeroForOne = false (token1 → token0):', {
      calculation: `(${amountInParsed.toString()} * ${priceX96.toString()}) / ${Q96.toString()}`,
      result: amountOut.toString()
    });
  }

  const finalResult = formatUnits(amountOut, decimalsOut);
  console.log('Final result:', {
    amountOutRaw: amountOut.toString(),
    decimalsOutUsed: decimalsOut,
    finalFormatted: finalResult
  });

  // Let's also check what the "correct" calculation should be
  // For debugging: assume 1 USDT = 1 USD, 1 BNB = 760 USD
  const expectedRatio = 1 / 760; // USDT/BNB ratio
  const expectedOutput = parseFloat(amountIn) * expectedRatio;
  console.log('Expected output (for sanity check):', {
    expectedRatio,
    expectedOutput: expectedOutput.toString(),
    actualOutput: finalResult,
    difference: `${parseFloat(finalResult) / expectedOutput}x off`
  });

  return finalResult;
};

  // ✅ FIXED: Use publicClient for reading contracts
const fetchQuote = useCallback(async ({
    tokenIn,
    tokenOut,
    amountIn,
    poolKey,
    ticks,
  }: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    poolKey: PoolKey;
    ticks: any[];
  }): Promise<string | null> => {
    try {
      if (!tokenIn || !tokenOut || !amountIn || !poolKey || !publicClient) return null;

      const normalizedPoolKey = normalizePoolKey(poolKey);
      
      // Debug logging for pool and token information
      console.log('[fetchQuote Debug]', {
        tokenIn: { address: tokenIn.address, symbol: tokenIn.symbol, decimals: tokenIn.decimals },
        tokenOut: { address: tokenOut.address, symbol: tokenOut.symbol, decimals: tokenOut.decimals },
        poolKey: {
          currency0: normalizedPoolKey.currency0,
          currency1: normalizedPoolKey.currency1,
          fee: normalizedPoolKey.fee
        },
        chainId
      });
      
      const { getPoolInfo, generatePoolId } = await import('../utils/stateViewUtils');
      const poolId = generatePoolId(normalizedPoolKey);
      
      const poolInfo = await getPoolInfo(chainId, publicClient, poolId);

      if (!poolInfo || !poolInfo.sqrtPriceX96 || poolInfo.tick === undefined)
        return null;
      if (
        typeof tokenIn.decimals !== "number" ||
        typeof tokenOut.decimals !== "number"
      )
        return null;

      // 🔥 FIX: Enhanced helper function to check if token matches pool currency
      const isTokenMatchingPoolCurrency = (tokenAddress: string, poolCurrency: string): boolean => {
        const normalizedToken = tokenAddress.toLowerCase();
        const normalizedPool = poolCurrency.toLowerCase();
        
        // Debug logging
        console.log('[Token Matching]', {
          originalToken: tokenAddress,
          normalizedToken,
          poolCurrency,
          normalizedPool
        });
        
        // Direct match (case insensitive)
        if (normalizedToken === normalizedPool) {
          console.log('[Token Matching] Direct match found');
          return true;
        }
        
        // Check if token is native and pool currency is wrapped token
        const isTokenNative = isNativeToken(tokenAddress) || 
                             tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        
        if (isTokenNative) {
          const wrappedAddress = getWrappedTokenAddress(chainId);
          const normalizedWrapped = wrappedAddress.toLowerCase();
          console.log('[Token Matching] Native token check:', {
            wrappedAddress,
            normalizedWrapped,
            matches: normalizedPool === normalizedWrapped
          });
          return normalizedPool === normalizedWrapped;
        }
        
        // Check if pool currency is native representation and token is wrapped
        const isPoolNative = poolCurrency === '0x0000000000000000000000000000000000000000' || 
                            poolCurrency.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
                            poolCurrency.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
                            
        if (isPoolNative) {
          const wrappedAddress = getWrappedTokenAddress(chainId);
          const normalizedWrapped = wrappedAddress.toLowerCase();
          console.log('[Token Matching] Pool native check:', {
            normalizedToken,
            normalizedWrapped,
            matches: normalizedToken === normalizedWrapped
          });
          return normalizedToken === normalizedWrapped;
        }
        
        return false;
      };

      // Use the helper function for comparisons
      const isTokenInCurrency0 = isTokenMatchingPoolCurrency(tokenIn.address, normalizedPoolKey.currency0);
      const isTokenOutCurrency0 = isTokenMatchingPoolCurrency(tokenOut.address, normalizedPoolKey.currency0);
      const isTokenInCurrency1 = isTokenMatchingPoolCurrency(tokenIn.address, normalizedPoolKey.currency1);
      const isTokenOutCurrency1 = isTokenMatchingPoolCurrency(tokenOut.address, normalizedPoolKey.currency1);

      // Debug logging for token matching results
      console.log('[Token Matching Results]', {
        tokenIn: { address: tokenIn.address, symbol: tokenIn.symbol },
        tokenOut: { address: tokenOut.address, symbol: tokenOut.symbol },
        poolCurrency0: normalizedPoolKey.currency0,
        poolCurrency1: normalizedPoolKey.currency1,
        isTokenInCurrency0,
        isTokenOutCurrency0,
        isTokenInCurrency1,
        isTokenOutCurrency1
      });

      // 🔥 FIXED: More robust decimal and symbol assignment with fallback
      let currency0DecimalsFinal: number;
      let currency1DecimalsFinal: number;
      let currency0Symbol: string;
      let currency1Symbol: string;

      // First, try to determine currency0 properties
      if (isTokenInCurrency0) {
        currency0DecimalsFinal = tokenIn.decimals;
        currency0Symbol = tokenIn.symbol;
      } else if (isTokenOutCurrency0) {
        currency0DecimalsFinal = tokenOut.decimals;
        currency0Symbol = tokenOut.symbol;
      } else {
        // Fallback: If we can't match either token to currency0, try to infer from addresses
        console.warn('[fetchQuote] Using fallback for currency0 properties');
        
        // Check if currency0 looks like a native token address
        const currency0IsNative = normalizedPoolKey.currency0 === '0x0000000000000000000000000000000000000000' ||
                                  normalizedPoolKey.currency0.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
                                  normalizedPoolKey.currency0.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        
        if (currency0IsNative) {
          // If currency0 is native, check which of our tokens is native or wrapped
          const tokenInIsNative = isNativeToken(tokenIn.address) || 
                                 tokenIn.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          const tokenOutIsNative = isNativeToken(tokenOut.address) || 
                                  tokenOut.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          const wrappedAddress = getWrappedTokenAddress(chainId).toLowerCase();
          const tokenInIsWrapped = tokenIn.address.toLowerCase() === wrappedAddress;
          const tokenOutIsWrapped = tokenOut.address.toLowerCase() === wrappedAddress;
          
          if (tokenInIsNative || tokenInIsWrapped) {
            currency0DecimalsFinal = tokenIn.decimals;
            currency0Symbol = tokenIn.symbol;
          } else if (tokenOutIsNative || tokenOutIsWrapped) {
            currency0DecimalsFinal = tokenOut.decimals;
            currency0Symbol = tokenOut.symbol;
          } else {
            console.error('[fetchQuote] Cannot determine currency0 properties - no native/wrapped match');
            return null;
          }
        } else {
          // If currency0 is not native, try direct address comparison (case insensitive)
          const currency0Lower = normalizedPoolKey.currency0.toLowerCase();
          const tokenInLower = tokenIn.address.toLowerCase();
          const tokenOutLower = tokenOut.address.toLowerCase();
          
          console.log('[Currency0 Address Comparison]', {
            currency0Lower,
            tokenInLower,
            tokenOutLower,
            tokenInMatches: tokenInLower === currency0Lower,
            tokenOutMatches: tokenOutLower === currency0Lower
          });
          
          if (tokenInLower === currency0Lower) {
            currency0DecimalsFinal = tokenIn.decimals;
            currency0Symbol = tokenIn.symbol;
          } else if (tokenOutLower === currency0Lower) {
            currency0DecimalsFinal = tokenOut.decimals;
            currency0Symbol = tokenOut.symbol;
          } else {
            console.error('[fetchQuote] Cannot determine currency0 properties - no address match', {
              currency0: normalizedPoolKey.currency0,
              currency0Lower,
              tokenIn: tokenIn.address,
              tokenInLower,
              tokenOut: tokenOut.address,
              tokenOutLower
            });
            return null;
          }
        }
      }

      // Then, determine currency1 properties
      if (isTokenInCurrency1) {
        currency1DecimalsFinal = tokenIn.decimals;
        currency1Symbol = tokenIn.symbol;
      } else if (isTokenOutCurrency1) {
        currency1DecimalsFinal = tokenOut.decimals;
        currency1Symbol = tokenOut.symbol;
      } else {
        // Fallback: Similar logic for currency1
        console.warn('[fetchQuote] Using fallback for currency1 properties');
        
        const currency1IsNative = normalizedPoolKey.currency1 === '0x0000000000000000000000000000000000000000' ||
                                  normalizedPoolKey.currency1.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
                                  normalizedPoolKey.currency1.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        
        if (currency1IsNative) {
          const tokenInIsNative = isNativeToken(tokenIn.address) || 
                                 tokenIn.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          const tokenOutIsNative = isNativeToken(tokenOut.address) || 
                                  tokenOut.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
          const wrappedAddress = getWrappedTokenAddress(chainId).toLowerCase();
          const tokenInIsWrapped = tokenIn.address.toLowerCase() === wrappedAddress;
          const tokenOutIsWrapped = tokenOut.address.toLowerCase() === wrappedAddress;
          
          if (tokenInIsNative || tokenInIsWrapped) {
            currency1DecimalsFinal = tokenIn.decimals;
            currency1Symbol = tokenIn.symbol;
          } else if (tokenOutIsNative || tokenOutIsWrapped) {
            currency1DecimalsFinal = tokenOut.decimals;
            currency1Symbol = tokenOut.symbol;
          } else {
            console.error('[fetchQuote] Cannot determine currency1 properties - no native/wrapped match');
            return null;
          }
        } else {
          const currency1Lower = normalizedPoolKey.currency1.toLowerCase();
          const tokenInLower = tokenIn.address.toLowerCase();
          const tokenOutLower = tokenOut.address.toLowerCase();
          
          console.log('[Currency1 Address Comparison]', {
            currency1Lower,
            tokenInLower,
            tokenOutLower,
            tokenInMatches: tokenInLower === currency1Lower,
            tokenOutMatches: tokenOutLower === currency1Lower
          });
          
          if (tokenInLower === currency1Lower) {
            currency1DecimalsFinal = tokenIn.decimals;
            currency1Symbol = tokenIn.symbol;
          } else if (tokenOutLower === currency1Lower) {
            currency1DecimalsFinal = tokenOut.decimals;
            currency1Symbol = tokenOut.symbol;
          } else {
            console.error('[fetchQuote] Cannot determine currency1 properties - no address match', {
              currency1: normalizedPoolKey.currency1,
              currency1Lower,
              tokenIn: tokenIn.address,
              tokenInLower,
              tokenOut: tokenOut.address,
              tokenOutLower
            });
            return null;
          }
        }
      }

      const currency0 = new SDKToken(
        chainId,
        normalizedPoolKey.currency0,
        currency0DecimalsFinal,
        currency0Symbol
      );
      const currency1 = new SDKToken(
        chainId,
        normalizedPoolKey.currency1,
        currency1DecimalsFinal,
        currency1Symbol
      );

      // Determine trade direction - more robust approach
      let zeroForOne: boolean;
      
      // First try using the original matching results
      if (isTokenInCurrency0 && (isTokenOutCurrency1 || !isTokenOutCurrency0)) {
        zeroForOne = true;
      } else if (isTokenInCurrency1 && (isTokenOutCurrency0 || !isTokenOutCurrency1)) {
        zeroForOne = false;
      } else {
        // Fallback: determine based on which token matches which currency
        const tokenInLower = tokenIn.address.toLowerCase();
        const currency0Lower = normalizedPoolKey.currency0.toLowerCase();
        const currency1Lower = normalizedPoolKey.currency1.toLowerCase();
        
        // Check for direct address match
        const tokenInMatchesCurrency0Direct = tokenInLower === currency0Lower;
        
        // Check for native/wrapped token match with currency0
        const tokenInIsNative = isNativeToken(tokenIn.address) || 
                               tokenInLower === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        const currency0IsNative = currency0Lower === '0x0000000000000000000000000000000000000000' ||
                                 currency0Lower === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        const wrappedAddressLower = getWrappedTokenAddress(chainId).toLowerCase();
        const tokenInMatchesCurrency0Native = 
          (tokenInIsNative && currency0Lower === wrappedAddressLower) ||
          (currency0IsNative && tokenInLower === wrappedAddressLower);
        
        const tokenInMatchesCurrency0 = tokenInMatchesCurrency0Direct || tokenInMatchesCurrency0Native;
        
        zeroForOne = tokenInMatchesCurrency0;
        
        console.log('[Trade Direction Fallback]', {
          tokenInLower,
          currency0Lower,
          currency1Lower,
          tokenInIsNative,
          currency0IsNative,
          wrappedAddressLower,
          tokenInMatchesCurrency0Direct,
          tokenInMatchesCurrency0Native,
          tokenInMatchesCurrency0,
          zeroForOne
        });
      }

      console.log('[Trade Direction]', {
        zeroForOne,
        tokenInSymbol: tokenIn.symbol,
        tokenOutSymbol: tokenOut.symbol,
        currency0Symbol,
        currency1Symbol
      });

      try {
        const pool = new Pool(
          currency0,
          currency1,
          normalizedPoolKey.fee,
          normalizedPoolKey.tickSpacing,
          normalizedPoolKey.hooks,
          poolInfo.sqrtPriceX96,
          poolInfo.liquidity,
          poolInfo.tick,
          ticks
        );

        const amountInParsed = CurrencyAmount.fromRawAmount(
          zeroForOne ? currency0 : currency1,
          parseUnits(amountIn, tokenIn.decimals).toString()
        );

        const result: any = pool.getOutputAmount(amountInParsed, zeroForOne);
        const amountOut = result?.amountOut;
        if (amountOut) {
          return amountOut.toSignificant(6);
        }
      } catch (sdkError) {
        console.warn(
          "[fetchQuote] SDK pool failed — trying fallback",
          sdkError
        );
      }

      // 🔥 FIXED: Correct decimal mapping for fallback
      const decimalsIn = tokenIn.decimals;
      const decimalsOut = tokenOut.decimals;
      const debugResult = debugQuoteCalculation(tokenIn, tokenOut, amountIn, poolInfo, normalizedPoolKey, zeroForOne);
      console.log('Debug result:', debugResult);

      const fallbackAmountOut = getQuoteFromSqrtPriceX96(
        amountIn,
        BigInt(poolInfo.sqrtPriceX96),
        decimalsIn,
        decimalsOut,
        zeroForOne
      );

      return fallbackAmountOut;

    } catch (e) {
      console.error('[fetchQuote] Quote error:', e);
      return null;
    }
  }, [chainId, publicClient]);
  // ✅ FIXED: Use publicClient for reading, walletClient for writing
  const approveTokenToPermit2 = useCallback(async (tokenAddress: string, amount: bigint): Promise<{ success: boolean; error?: string }> => {
    const normalizedAddress = normalizeTokenAddress(tokenAddress);
    
    if (!walletClient || !publicClient || isNativeToken(tokenAddress)) {
      return { success: true };
    }

    try {
      // ✅ Use publicClient for reading allowance
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

      // ✅ Use walletClient for sending transaction
      const hash = await walletClient.sendTransaction({
        to: normalizedAddress as `0x${string}`,
        data,
        account: address as `0x${string}`,
        chain: getChainFromId(chainId),
      });

      // ✅ Use publicClient to wait for receipt
      await publicClient.waitForTransactionReceipt({ hash });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [walletClient, publicClient, address, chainId, getChainFromId]);

  const checkPermit2Allowance = useCallback(async (tokenAddress: string, spender: string): Promise<{ amount: bigint; expiration: number; nonce: number }> => {
    const normalizedAddress = normalizeTokenAddress(tokenAddress);
    if (!publicClient || !address || isNativeToken(tokenAddress)) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }

    try {
      // ✅ Use publicClient for reading contract
      const result = await publicClient.readContract({
        address: PERMIT2_ADDRESS as `0x${string}`,
        abi: permit2Abi.abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, normalizedAddress as `0x${string}`, spender as `0x${string}`]
      });

      return {
        amount: result[0] as bigint,
        expiration: Number(result[1]),
        nonce: Number(result[2])
      };
    } catch (error) {
      return { amount: BigInt(0), expiration: 0, nonce: 0 };
    }
  }, [publicClient, address]);

  // ✅ FIXED: Use publicClient for reading, walletClient for writing
  const executeSwap = useCallback(async (swapParameters: {
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
      const { poolKey, tokenIn, tokenOut, amountIn, amountOutMinimum, deadline } = swapParameters;
      
      console.log('🚀 Starting swap with parameters:', {
        tokenIn: { symbol: tokenIn.symbol, address: tokenIn.address, isNative: isNativeToken(tokenIn.address) },
        tokenOut: { symbol: tokenOut.symbol, address: tokenOut.address, isNative: isNativeToken(tokenOut.address) },
        amountIn,
        poolKey
      });

      const normalizedPoolKey = normalizePoolKey(poolKey);
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1800;
      
      const amountInWei = parseUnits(amountIn.replace(/,/g, ''), tokenIn.decimals);
      const amountOutMinWei = parseUnits(amountOutMinimum.replace(/,/g, ''), tokenOut.decimals);
      
      const universalRouterAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.UniversalRouter;
      if (!universalRouterAddress) {
        return { success: false, error: 'Universal Router not available on this chain' };
      }

      // Handle approvals for non-native tokens
      if (!isNativeToken(tokenIn.address)) {
        console.log('🔐 Handling approvals for token:', tokenIn.symbol);
        
        const permit2Expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
        const approval = await approveTokenToPermit2(tokenIn.address, amountInWei);
        if (!approval.success) {
          return { success: false, error: approval.error };
        }

        // Permit2 approval for Universal Router - use walletClient for writing
        const permit2ApprovalTx = await walletClient.writeContract({
          address: PERMIT2_ADDRESS as `0x${string}`,
          abi: permit2Abi.abi,
          functionName: 'approve',
          args: [
            normalizeTokenAddress(tokenIn.address) as `0x${string}`,
            universalRouterAddress as `0x${string}`,
            amountInWei,
            BigInt(permit2Expiration)
          ],
          account: address as `0x${string}`,
          chain: walletClient.chain!,
        });
        
        // ✅ Use publicClient to wait for receipt
        await publicClient.waitForTransactionReceipt({ hash: permit2ApprovalTx });
        console.log('✅ Approvals completed');
      }

      // Create V4 swap plan
      const v4Planner = new V4Planner();
      
      const normalizedTokenInAddr = normalizeTokenAddress(tokenIn.address);
      const zeroForOne = normalizedPoolKey.currency0.toLowerCase() === normalizedTokenInAddr.toLowerCase();
      
      console.log('📋 Creating swap plan:', {
        zeroForOne,
        currency0: normalizedPoolKey.currency0,
        currency1: normalizedPoolKey.currency1,
        tokenInNormalized: normalizedTokenInAddr
      });

      v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
        {
          poolKey: normalizedPoolKey,
          zeroForOne: zeroForOne,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMinWei,
          hookData: '0x'
        }
      ]);

      v4Planner.addAction(Actions.SETTLE_ALL, [
        zeroForOne ? normalizedPoolKey.currency0 : normalizedPoolKey.currency1,
        maxUint256
      ]);

      v4Planner.addAction(Actions.TAKE_ALL, [
        zeroForOne ? normalizedPoolKey.currency1 : normalizedPoolKey.currency0,
        BigInt(0)
      ]);

      // Prepare transaction data
      const encodedActions = (typeof v4Planner.actions === 'string' && v4Planner.actions.startsWith('0x'))
        ? v4Planner.actions as `0x${string}`
        : `0x${Buffer.from(v4Planner.actions).toString('hex')}` as `0x${string}`;
      const encodedParams = Array.isArray(v4Planner.params)
        ? v4Planner.params.map(p => (typeof p === 'string' && p.startsWith('0x')) ? p as `0x${string}` : `0x${Buffer.from(p).toString('hex')}` as `0x${string}`)
        : [];

      const commands = encodePacked(['uint8'], [CommandType.V4_SWAP]);
      const combinedInput = encodeAbiParameters(
        [{ name: 'actions', type: 'bytes' }, { name: 'params', type: 'bytes[]' }],
        [encodedActions, encodedParams]
      );
      const inputs = [combinedInput];

      // Calculate ETH value for native token swaps
      let ethValue = BigInt(0);
      if (isNativeToken(tokenIn.address)) {
        ethValue = amountInWei;
        console.log('💰 Native token swap - ETH value:', ethValue.toString());
      }

      console.log('📤 Executing swap transaction...');
      
      // ✅ Use walletClient for sending transaction
      const hash = await walletClient.sendTransaction({
        to: universalRouterAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: universalRouterAbi.abi,
          functionName: 'execute',
          args: [commands, inputs, swapDeadline]
        }),
        value: ethValue,
        account: address as `0x${string}`,
        chain: getChainFromId(chainId),
      });

      console.log('⏳ Waiting for transaction receipt...', hash);
      
      // ✅ Use publicClient to wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 120_000,
      });

      if (receipt.status === 'success') {
        console.log('✅ Swap successful!', hash);
        return { success: true, txHash: hash };
      } else {
        return { success: false, error: 'Transaction reverted' };
      }

    } catch (error: any) {
      console.error('❌ Swap execution error:', error);
      
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
  }, [isConnected, walletClient, publicClient, chainId, approveTokenToPermit2, getChainFromId, address]);

  const validateSwap = useCallback((): boolean => {
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
  }, [swapState]);

  const executeSwapFromState = useCallback(async (): Promise<SwapResult> => {
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
  }, [isConnected, walletClient, publicClient, chainId, swapState, executeSwap, address]);

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
    
    // Utility functions
    fetchQuote,
    isNativeToken,
    normalizeTokenAddress,
    normalizePoolKey,
    orderPoolTokens,
    getChainFromId,
    
    // Permit2 functions
    approveTokenToPermit2,
    checkPermit2Allowance,
  };
}