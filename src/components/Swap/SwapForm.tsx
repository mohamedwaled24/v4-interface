import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { TokenSelector } from '../CreatePool/TokenSelector'
import { SwapSettings } from './SwapSettings'
import { useV4Swap } from '../../hooks/useV4Swap'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ArrowDown } from '../shared/icons'
import { DeployedPoolsList, addDeployedPool } from './DeployedPoolsList'
import { GRAPHQL_ENDPOINTS } from '../../config/graphql';
import { SUPPORTED_NETWORKS } from '../../constants/networks';
import { useBalance } from '../../hooks/useBalance'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  padding:20px;
  box-sizing: border-box;
  flex-direction: column;
  position: relative;
  @media (max-width: 768px) {
    flex-direction: column;
    min-height: auto;
    padding: 16px;
  }
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 480px;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  @media (max-width: 768px) {
    max-width: 100%;
  }
`

const SwapContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  position: relative;
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const SwapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0px;
  margin-top: -30px;
`

const SwapTabs = styled.div`
  display: flex;
  gap: 4px;
  background: transparent;
  border-radius: 12px;
  padding: 4px;
`

const SwapTab = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => 
    $active ? 'rgba(0, 0, 0, 0.02)' : 'transparent'};
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
  color: ${({ $active }) => 
    $active ? '#131313' : '#131313A1'};
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $active }) => 
      $active ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
    color: #131313;
  }
`

const InputContainer = styled.div`
  background: rgba(51, 51, 51, 0.02);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const InputHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral3};
`

const InputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const AmountInput = styled.input`
  background: none;
  border: none;
  color: #131313;
  font-size: 24px;
  font-weight: 500;
  outline: none;
  padding: 0;
  text-align: left;
  width: 100%;
  
  &::placeholder {
    color: #666;
  }
`

const USDValue = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
`

const TokenBalance = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const BalanceAmount = styled.span`
  color: ${({ theme }) => theme.colors.neutral2};
  font-weight: 500;
`

const SwapButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  top: 50%;
  margin-top: -30px;
`

const IconBackground = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 4px solid ${({ theme }) => theme.colors.backgroundModule};
  color: ${({ theme }) => theme.colors.neutral2};
  z-index: 10;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral1};
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }
`

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary'; $disabled?: boolean }>`
  width: 100%;
  padding: 16px 20px ;
  border-radius: 20px;
  border: none;
  transform: scale(1);
  background-color: rgba(255, 55, 199, 0.08);
  outline-color: rgba(0, 0, 0, 0);
  color: rgb(255, 55, 199);
  font-weight: 600;
  font-size: 16px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: opacity 0.2s ease;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    background-color: rgba(255, 55, 199, 0.12);
  }
    &:disabled {
      color: gray;
      opacity: 0.5;
      cursor: not-allowed;
      }
`

const ConnectWalletButton = styled.button`
  width: 100%;
  padding: 16px 20px;
  border-radius: 999px;
  border: none;
  background-image: linear-gradient(25deg, #741ff5, #e348ff);
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.77, 0, 0.175, 1);
  transform: scale(1);

  &:hover, &:focus {
    transform: scale(1.04);
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.accentFailure};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.accentSuccess || '#4CAF50'};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
  padding: 8px;
  background: ${({ theme }) => `${theme.colors.accentSuccess || '#4CAF50'}20`};
  border-radius: 8px;
`

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.background}80;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 1000;
`

const LoadingContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  padding: 32px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 300px;
`

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`
const LoadingSubtext = styled.div`
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 14px;
  text-align: center;
`
interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}
export function SwapForm() {
  // Basic UI state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sellMode, setSellMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap');
  const [inputHover, setInputHover] = useState(false);
  // Auto-selection tracking
  const [autoSelectedPool, setAutoSelectedPool] = useState<any>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [ticks, setTicks] = useState<any[]>([]);
  // ✅ FIXED: Use refs to prevent infinite loops
  const autoSelectionInProgressRef = useRef(false);
  const lastAutoSelectionKeyRef = useRef<string>('');
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal()
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient(); // ✅ Add publicClient for reading
  
  const {
    swapState,
    validation,
    isSwapping,
    isValidatingPool,
    poolInfo,
    updateTokenIn,
    updateTokenOut,
    updateAmountIn,
    updatePoolId,
    updateSlippageTolerance,
    updateDeadline,
    swapTokens,
    executeSwap,
    validateSwap,
    fetchQuote,
    normalizeTokenAddress,
    isNativeToken,
  } = useV4Swap()
  
  // ✅ FIXED: Get balances using both publicClient and walletClient
  const { balance: tokenInBalance } = useBalance(
    swapState.tokenIn?.address,
    walletClient?.chain?.id ?? undefined,
    publicClient, // ✅ Use publicClient for reading
    walletClient  // ✅ Use walletClient for account info
  );
  
  const { balance: tokenOutBalance } = useBalance(
    swapState.tokenOut?.address,
    walletClient?.chain?.id ?? undefined,
    publicClient, // ✅ Use publicClient for reading
    walletClient  // ✅ Use walletClient for account info
  );
  
  // Pool data for auto-selection
  const [allPools, setAllPools] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [poolLiquidity , setPoolLiquidity] = useState<any>(null);
  const [matchingPoolss, setMatchingPoolss] = useState<boolean>(false);

  // Fetch pools on mount
  useEffect(() => {
    setPoolsLoading(true);
    fetch(GRAPHQL_ENDPOINTS.allPools,{
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:`  
        query Pool {
    Pool(where: { liquidity: { _neq: "0" } }) {
    id
    chainId
    name
    createdAtTimestamp
    createdAtBlockNumber
    token0
    token1
    feeTier
    liquidity
    sqrtPrice
    token0Price
    token1Price
    tick
    tickSpacing
    observationIndex
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    feesUSDUntracked
    txCount
    collectedFeesToken0
    collectedFeesToken1
    collectedFeesUSD
    totalValueLockedToken0
    totalValueLockedToken1
    totalValueLockedETH
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    liquidityProviderCount
    hooks
    db_write_timestamp
  }
}
`
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Fetched pools:', data)
        setAllPools(data.data?.Pool || []);
        setPoolsLoading(false);
      })
      .catch(() => setPoolsLoading(false));
  }, []);

  // ✅ FIXED: Prevent infinite loop by removing poolKey from dependencies and using refs
const autoSelectPool = useCallback(async () => {
  if (!publicClient || !walletClient || autoSelectionInProgressRef.current) {
    return;
  }

  const chainId = walletClient.chain?.id;
  if (!chainId) {
    console.warn('No chainId available');
    return;
  }

  if (!swapState.tokenIn || !swapState.tokenOut || allPools.length === 0 || poolsLoading) {
    return;
  }

  const selectionKey = `${swapState.tokenIn.address}-${swapState.tokenOut.address}-${chainId}`;
  if (lastAutoSelectionKeyRef.current === selectionKey) {
    return;
  }

  autoSelectionInProgressRef.current = true;
  lastAutoSelectionKeyRef.current = selectionKey;

  try {
    console.log('🔍 Starting auto pool selection for tokens:', {
      tokenIn: swapState.tokenIn.symbol,
      tokenOut: swapState.tokenOut.symbol,
      tokenInAddr: swapState.tokenIn.address,
      tokenOutAddr: swapState.tokenOut.address
    });

    const tokenInAddress = normalizeTokenAddress(swapState.tokenIn.address).toLowerCase();
    const tokenOutAddress = normalizeTokenAddress(swapState.tokenOut.address).toLowerCase();

    console.log('🔧 Normalized addresses:', {
      tokenInAddress,
      tokenOutAddress,
      tokenInIsNative: isNativeToken(swapState.tokenIn.address),
      tokenOutIsNative: isNativeToken(swapState.tokenOut.address)
    });

    if (!tokenInAddress || !tokenOutAddress) {
      setPoolLiquidity(null);
      return;
    }

    const matchingPools = allPools.filter(pool => {
      const poolToken0 = pool.token0.split('_')[1]?.toLowerCase();
      const poolToken1 = pool.token1.split('_')[1]?.toLowerCase();

      const matches = (
        (poolToken0 === tokenInAddress && poolToken1 === tokenOutAddress) ||
        (poolToken0 === tokenOutAddress && poolToken1 === tokenInAddress)
      );

      if (matches) {
        console.log('🎯 Found matching pool:', {
          poolToken0,
          poolToken1,
          fee: pool.feeTier,
          liquidity: pool.totalValueLockedToken0,
          pool
        });
        setMatchingPoolss(true);
      }

      return matches;
    });

    console.log(`📊 Found ${matchingPools.length} matching pools`);

    if (matchingPools.length === 0) {
      setMatchingPoolss(false);
      console.log('❌ No matching pools found');
      setAutoSelectedPool(null);
      updatePoolId('');
      setPoolLiquidity(null);
      return;
    }

    const { generatePoolId, getPoolInfo } = await import('../../utils/stateViewUtils');
    const { convertPoolToPoolKey } = await import('../../utils/poolSelectionUtils');

    const poolsWithLiquidity = await Promise.all(
      matchingPools.map(async (pool) => {
        try {
          const poolKey = convertPoolToPoolKey(pool);
          const poolId = generatePoolId(poolKey);
          let liquidity = 0n;
          let liquidityString = '0';

          try {
            const info = await getPoolInfo(chainId, publicClient, poolId);
            liquidity = BigInt(info?.liquidity || '0');
            liquidityString = info?.liquidity || '0';
            console.log('Liquidity check:', {
              raw: info?.liquidity,
              bigint: liquidity,
              isZero: liquidity === 0n
            });
          } catch (e) {
            console.warn('Failed to get pool info for:', poolId, e);
          }

          return {
            pool,
            poolKey,
            fee: typeof pool.feeTier === 'string' ? parseInt(pool.feeTier) : pool.feeTier,
            liquidity,
            liquidityString
          };
        } catch (e) {
          console.warn('Failed to process pool:', pool, e);
          return null;
        }
      })
    );

    const validPools = poolsWithLiquidity
      .filter(p => p !== null)
      .sort((a, b) => {
        if (a.liquidity > b.liquidity) return -1;
        if (a.liquidity < b.liquidity) return 1;
        return 0;
      });

    console.log('💰 Valid pools sorted by liquidity:', validPools.map(p => ({
      fee: p.fee,
      liquidity: p.liquidity.toString(),
      liquidityString: p.liquidityString,
      isZeroLiquidity: p.liquidity === 0n,
      tvl0: p.pool.totalValueLockedToken0,
      tvl1: p.pool.totalValueLockedToken1
    })));

    const MIN_TOKEN_AMOUNT = 1;
    const usablePools = validPools.filter(p => {
      return (
        p.liquidity > 0n &&
        Number(p.pool.totalValueLockedToken0) > MIN_TOKEN_AMOUNT &&
        Number(p.pool.totalValueLockedToken1) > MIN_TOKEN_AMOUNT
      );
    });

    console.log(`✅ ${usablePools.length} usable pools found`);

    let bestPoolData = usablePools[0];

    if (!bestPoolData && validPools.length > 0) {
      bestPoolData = validPools[0];
      console.log('⚠️ Using fallback pool with low/zero liquidity');
    }

    if (bestPoolData) {
      const bestPool = bestPoolData.pool;
      const poolKey = bestPoolData.poolKey;

      console.log('🚀 Auto-selected pool:', {
        fee: (bestPoolData.fee / 10000).toFixed(2) + '%',
        liquidity: bestPoolData.liquidity.toString(),
        liquidityString: bestPoolData.liquidityString,
        hasLiquidity: bestPoolData.liquidity > 0n,
        poolKey
      });

      updatePoolId(JSON.stringify(poolKey));
      setAutoSelectedPool(bestPool);
      // 🔥 FIX: Store the string liquidity for proper comparison
      setPoolLiquidity(bestPoolData.liquidityString);
    } else {
      setAutoSelectedPool(null);
      updatePoolId('');
      setPoolLiquidity(null);
    }
  } catch (error) {
    console.error('Auto selection error:', error);
    setPoolLiquidity(null);
  } finally {
    autoSelectionInProgressRef.current = false;
  }
}, [swapState.tokenIn, swapState.tokenOut, allPools, poolsLoading, publicClient, walletClient, updatePoolId, normalizeTokenAddress, isNativeToken]);

// Optional: Add visual indicator for liquidity status
  // ✅ FIXED: Separate effect for auto selection without poolKey dependency
  useEffect(() => {
    if (swapState.tokenIn && swapState.tokenOut) {
      autoSelectPool();
    } else {
      setAutoSelectedPool(null);
      lastAutoSelectionKeyRef.current = '';
    }
  }, [autoSelectPool]);

  // Fetch ticks when pool changes
  useEffect(() => {
    async function fetchTicks() {
      if (!swapState.poolKey) {
        setTicks([]);
        return;
      }
      
      try {
        const poolId = JSON.stringify(swapState.poolKey);
        const res = await fetch(GRAPHQL_ENDPOINTS.allPools, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query Tick {
                Tick {
                  chainId
                  createdAtBlockNumber
                  createdAtTimestamp
                  db_write_timestamp
                  id
                  liquidityGross
                  liquidityNet
                  pool_id
                  price0
                  price1
                  tickIdx
                }
              }
            `,
          }),
        });
        const data = await res.json();
        console.log('📊 Fetched ticks:', data);
        setTicks(data.data?.Tick || []);
      } catch (e) {
        console.warn('Failed to fetch ticks:', e);
        setTicks([]);
      }
    }
    fetchTicks();
  }, [swapState.poolKey]);

  // Fetch quote when input changes
  useEffect(() => {
    let cancelled = false;

    async function getQuote() {
      const { tokenIn, tokenOut, amountIn, poolKey } = swapState;

      if (!tokenIn || !tokenOut || !amountIn || !poolKey) {
        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
        return;
      }

      if (parseFloat(amountIn) <= 0) {
        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
        return;
      }

      setQuoteLoading(true);
      setQuote(null);
      setQuoteError(null);

      try {
        console.log('💱 Fetching quote for:', {
          tokenIn: tokenIn.symbol,
          tokenOut: tokenOut.symbol,
          amountIn,
          ticksLength: ticks.length
        });

        const result = await fetchQuote({
          tokenIn,
          tokenOut,
          amountIn,
          poolKey,
          ticks,
        });

        if (!cancelled) {
          if (result && Number(result) > 0) {
            setQuote(result);
            setQuoteError(null);
            console.log('✅ Quote fetched:', result);
          } else {
            setQuote(null);
            setQuoteError('No quote available for this amount/pool.');
          }
        }
      } catch (e) {
        console.error('[SwapForm] Quote fetch failed:', e);
        if (!cancelled) {
          setQuoteError('Failed to fetch quote.');
          setQuote(null);
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }

    getQuote();

    return () => {
      cancelled = true;
    };
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn, swapState.poolKey, ticks, fetchQuote]);

  const handleSwapButtonClick = async () => {
    if (!isConnected) {
      return;
    }
    
    if (!validateSwap()) {
      return;
    }
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      const result = await executeSwap();
      
      if (!result.success) {
        setError(result.error || 'Swap failed');
        console.log('❌ Swap failed:', result);
      } else if (result.txHash) {
        const shortHash = `${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`;
        setSuccessMessage(`Swap successful! Tx: ${shortHash}`);
        updateAmountIn('');
        console.log('✅ Swap successful:', result.txHash);
      }
    } catch (error: any) {
      console.error('Swap execution error:', error);
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes('User denied') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('MetaMask Tx Signature: User denied') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('user cancelled')
      ) {
        setError('User rejected the transaction');
      } else {
        setError(errorMessage || 'Swap failed');
      }
    }
  }
  const isLiquidityInsufficient = (liquidityString: string | null): boolean => {
  if (!liquidityString) return true;
  try {
    const liquidityBigInt = BigInt(liquidityString);
    return liquidityBigInt === 0n;
  } catch {
    return true; // If conversion fails, treat as no liquidity
  }
};
  
const getButtonText = () => {
  if (!swapState.poolKey) return 'Not Availble';
  if(swapState.poolKey && !matchingPoolss) return 'No pools found';
  if (isValidatingPool) return 'Validating Pool...';
  if (!swapState.tokenIn) return 'Select input token';
  if (!swapState.tokenOut) return 'Select output token';
  if (!swapState.amountIn) return 'Enter an amount';
  if (isSwapping) return 'Swapping...';
  
  // 🔥 FIX: Properly check string liquidity
  if (autoSelectedPool && isConnected) {
    if (isLiquidityInsufficient(poolLiquidity)) {
      return 'No liquidity available';
    }
    return 'Get Started';
  }
  
  return 'Swap';
};
  
const isButtonDisabled = () => {
  return (
    !isConnected ||
    !swapState.poolKey ||
    isValidatingPool ||
    !swapState.tokenIn ||
    !swapState.tokenOut ||
    !swapState.amountIn ||
    isSwapping ||
    isLiquidityInsufficient(poolLiquidity) // 🔥 FIX: Use helper function
  );
};
  
  // Clear messages when inputs change
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn]);

  return (
    <Container>
      <MainContent>
        <SwapContainer>
          <SwapHeader>
            <SwapTabs>
              <SwapTab $active={activeTab === 'swap'} onClick={() => setActiveTab('swap')}>
                Swap
              </SwapTab>
            </SwapTabs>
            <SwapSettings
              slippageTolerance={swapState.slippageTolerance}
              deadline={swapState.deadline}
              onSlippageChange={updateSlippageTolerance}
              onDeadlineChange={updateDeadline}
            />
          </SwapHeader>

          {/* Pool selection status */}
          {swapState.poolKey && (
            <div style={{ 
              fontSize: '12px', 
              color: '#4CAF50', 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#4CAF5020', 
              borderRadius: '8px',
              border: '1px solid #4CAF5040'
            }}>
               Pool Selected: {swapState.poolKey.currency0.slice(0, 6)}.../{swapState.poolKey.currency1.slice(0, 6)}... | Fee: {(swapState.poolKey.fee / 10000).toFixed(2)}%
              {autoSelectedPool && <span> (Auto-Selected)</span>}
            </div>
          )}
          
          {/* Input (From) section */}
          <InputContainer
            onMouseEnter={() => setInputHover(true)}
            onMouseLeave={() => setInputHover(false)}
          >
            <InputHeader>
              {activeTab === 'swap' ? (sellMode ? 'You sell' : 'You pay') : 
               activeTab === 'limit' ? 'From' :
               activeTab === 'buy' ? 'You pay' : 'You sell'}
            </InputHeader>
            
            {/* ✅ FIXED: Quick-select percentage buttons - now properly checking balance */}
            {swapState.tokenIn && tokenInBalance && parseFloat(tokenInBalance) > 0 && inputHover && (
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '4px',
                justifyContent: 'flex-end',
                position: 'relative',
                zIndex: 2,
              }}>
                {[25, 50, 75, 'MAX'].map(label => (
                  <button
                    key={label}
                    style={{
                      padding: '2px 7px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 11,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      let amount = '';
                      const balance = parseFloat(tokenInBalance);
                      if (label === 'MAX') amount = balance.toString();
                      else amount = (balance * (label as number) / 100).toString();
                      updateAmountIn(amount);
                    }}
                    type="button"
                  >
                    {label}{label !== 'MAX' ? '%' : ''}
                  </button>
                ))}
              </div>
            )}
            
            <InputRow>
              <AmountInput
                placeholder="0"
                value={swapState.amountIn}
                onChange={(e) => updateAmountIn(e.target.value)}
              />
              <TokenSelector
                token={swapState.tokenIn}
                onChange={updateTokenIn}
                error={validation.tokenInError}
              />
            </InputRow>
            
            {/* ✅ FIXED: Balance display - now properly showing when balance exists */}
            {swapState.tokenIn && tokenInBalance && parseFloat(tokenInBalance) > 0 && (
              <TokenBalance>
                Balance: <BalanceAmount>{tokenInBalance} {swapState.tokenIn.symbol}</BalanceAmount>
              </TokenBalance>
            )}
          </InputContainer>
          
          {/* Swap direction button */}
          <SwapButtonContainer>
            <IconBackground onClick={swapTokens}>
              <ArrowDown width={16} height={16} />
            </IconBackground>
          </SwapButtonContainer>
          
          {/* Output (To) section */}
          <InputContainer>
            <InputHeader>
              {activeTab === 'swap' ? (sellMode ? 'You buy' : 'You receive') : 
               activeTab === 'limit' ? 'To' :
               activeTab === 'buy' ? 'You receive' : 'You buy'}
            </InputHeader>
            
            <InputRow>
              <AmountInput
                placeholder="0"
                value={quote || ''}
                readOnly
              />
              <TokenSelector
                token={swapState.tokenOut}
                onChange={updateTokenOut}
                error={validation.tokenOutError}
              />
            </InputRow>
            
            {/* Quote status */}
            {quoteLoading && (
              <USDValue>Loading quote...</USDValue>
            )}
            {quoteError && !quoteLoading && (
              <USDValue style={{ color: 'orange' }}>{quoteError}</USDValue>
            )}
            {quote && !quoteLoading && !quoteError && (
              <USDValue>
                Estimated: {quote} {swapState.tokenOut?.symbol}
              </USDValue>
            )}
            
            {/* ✅ FIXED: Output token balance display */}
            {swapState.tokenOut && tokenOutBalance && parseFloat(tokenOutBalance) > 0 && (
              <TokenBalance>
                Balance: <BalanceAmount>{tokenOutBalance} {swapState.tokenOut.symbol}</BalanceAmount>
              </TokenBalance>
            )}
          </InputContainer>

          {/* Swap Button */}
          {isConnected ? (
            <ActionButton
              onClick={handleSwapButtonClick}
              $disabled={isButtonDisabled()}
              disabled={isButtonDisabled()}
            >
              {getButtonText()}
            </ActionButton>
          ) : (
            <ConnectWalletButton onClick={openConnectModal}>
              Connect Wallet
            </ConnectWalletButton>
          )}
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
        </SwapContainer>
      </MainContent>
      
      {/* Loading Overlay */}
      {isSwapping && (
        <LoadingOverlay>
          <LoadingContainer>
            <LoadingText>Executing V4 Swap</LoadingText>
            <LoadingSubtext>
              Please confirm the transaction in your wallet...
            </LoadingSubtext>
          </LoadingContainer>
        </LoadingOverlay>
      )}
    </Container>
  )
}