import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { TokenSelector } from '../CreatePool/TokenSelector'
import { SwapSettings } from './SwapSettings'
import { useV4Swap } from '../../hooks/useV4Swap'
import { useAccount, useWalletClient } from 'wagmi'
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

// Pool Key Input Section
const PoolIdSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`

const PoolIdLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const PoolIdInputContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accentAction};
  }
`

const PoolKeyTextArea = styled.textarea`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 12px;
  outline: none;
  width: 100%;
  min-height: 80px;
  resize: vertical;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral3};
  }
`

const PoolInfoContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
`

const PoolInfoTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
  margin-bottom: 4px;
`

const PoolInfoDetail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral2};
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
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

const ValidatingText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral3};
  margin-top: 4px;
  font-style: italic;
`

interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export function SwapForm() {
  // Restore missing state hooks (must be before any usage)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sellMode, setSellMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap');
  const [selectedPoolKey, setSelectedPoolKey] = useState<PoolKey | null>(null);
  const [poolKeyInput, setPoolKeyInput] = useState<string>('');
  const [autoSelectedPool, setAutoSelectedPool] = useState<any>(null);
  // Add a state to control hover for the input container
  const [inputHover, setInputHover] = useState(false);

  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal()
  const { data: walletClient } = useWalletClient();
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
    validateSwap
  } = useV4Swap()
  
  // Get balances for selected tokens
  const { balance: tokenInBalance } = useBalance(
    swapState.tokenIn?.address,
    walletClient?.chain?.id ?? undefined,
    walletClient?.transport?.provider
  );
  
  const { balance: tokenOutBalance } = useBalance(
    swapState.tokenOut?.address,
    walletClient?.chain?.id ?? undefined,
    walletClient?.transport?.provider
  );
  
  // Restore local allPools and poolsLoading state
  const [allPools, setAllPools] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);

  // Restore useEffect for fetching pools
  useEffect(() => {
    setPoolsLoading(true);
    fetch(GRAPHQL_ENDPOINTS.all)
      .then(res => res.json())
      .then(data => {
        setAllPools(data.Pool || []);
        setPoolsLoading(false);
        console.log('fetched pools' , data)
      })
      .catch(() => setPoolsLoading(false));
  }, []);
  useEffect(() => {
    if (allPools.length > 0) {
      console.log('Fetched all pools:', allPools);
    }
  }, [allPools]);
  // Auto-select best pool when tokens are chosen and user is on any supported network
  useEffect(() => {
    if (!walletClient) {
      console.warn('walletClient not ready yet');
      return;
    }
    const chainId = walletClient.chain?.id;

    console.log('walletClient:', walletClient);
    console.log('chainId:', chainId);

    if (!walletClient || !chainId) {
      setAutoSelectedPool(null);
      setSelectedPoolKey(null);
      setPoolKeyInput('');
      updatePoolId('');
      console.warn('No wallet client or chainId available. Please connect your wallet.');
      return;
    }

    if (
      swapState.tokenIn &&
      swapState.tokenOut &&
      allPools.length > 0 && !poolsLoading
    ) {
      (async () => {
        const tokenInAddress = swapState.tokenIn?.address?.toLowerCase();
        const tokenOutAddress = swapState.tokenOut?.address?.toLowerCase();
        if (!tokenInAddress || !tokenOutAddress) return;

        // Find all pools that match the token pair (parse after _)
        const matchingPools = allPools.filter(pool => {
          const poolToken0 = pool.token0.split('_')[1]?.toLowerCase();
          const poolToken1 = pool.token1.split('_')[1]?.toLowerCase();
          return (
            (poolToken0 === tokenInAddress && poolToken1 === tokenOutAddress) ||
            (poolToken0 === tokenOutAddress && poolToken1 === tokenInAddress)
          );
        });

        if (matchingPools.length === 0) {
          setAutoSelectedPool(null);
          setSelectedPoolKey(null);
          setPoolKeyInput('');
          updatePoolId('');
          return;
        }

        const { generatePoolId, getPoolInfo } = await import('../../utils/stateViewUtils');
        const { convertPoolToPoolKey } = await import('../../utils/poolSelectionUtils');

        // Use walletClient as the viem client
        const client = walletClient;

        const poolsWithLiquidity = await Promise.all(
          matchingPools.map(async (pool) => {
            const poolKey = convertPoolToPoolKey(pool);
            const poolId = generatePoolId(poolKey);
            let liquidity = 0n;
            try {
              const info = await getPoolInfo(chainId, client, poolId);
              liquidity = BigInt(info.liquidity || '0');
            } catch {}
            return { pool, fee: typeof pool.feeTier === 'string' ? parseInt(pool.feeTier) : pool.feeTier, liquidity };
          })
        );

        // Sort by liquidity descending only (BigInt comparison)
        poolsWithLiquidity.sort((a, b) => (b.liquidity > a.liquidity ? 1 : b.liquidity < a.liquidity ? -1 : 0));

        // Only consider pools with non-zero liquidity and both tokens present
        const MIN_TOKEN_AMOUNT = 1;
        const usablePools = poolsWithLiquidity.filter(p => {
          const pool = p.pool;
          return (
            BigInt(p.liquidity) > 0n &&
            Number(pool.totalValueLockedToken0) > MIN_TOKEN_AMOUNT &&
            Number(pool.totalValueLockedToken1) > MIN_TOKEN_AMOUNT
          );
        });

        // Sort usable pools by liquidity descending
        usablePools.sort((a, b) => (b.liquidity > a.liquidity ? 1 : b.liquidity < a.liquidity ? -1 : 0));

        // Pick the most liquid usable pool
        let bestPool = usablePools[0]?.pool;
        console.log('Best pool:', bestPool);
        // If none found, fall back to the most liquid pool overall
        if (!bestPool && poolsWithLiquidity.length > 0) {
          bestPool = poolsWithLiquidity[0].pool;
        }

        if (bestPool) {
          const poolKey = convertPoolToPoolKey(bestPool);
          setAutoSelectedPool(bestPool);
          setSelectedPoolKey(poolKey);
          setPoolKeyInput(JSON.stringify(poolKey, null, 2));
          updatePoolId(JSON.stringify(poolKey));
          console.log('Auto-selected pool:', bestPool);
          console.log('Pool key:', JSON.stringify(poolKey, null, 2));
        } else {
          setAutoSelectedPool(null);
          setSelectedPoolKey(null);
          setPoolKeyInput('');
          updatePoolId('');
        }
      })();
    }
  }, [swapState.tokenIn, swapState.tokenOut, allPools, poolsLoading, walletClient]);
  
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
        console.log(result)
      } else if (result.txHash) {
        const shortHash = `${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`;
        setSuccessMessage(`Swap successful! Tx: ${shortHash}`);
        updateAmountIn('');
        
        // If we have pool info and a successful swap, add to deployed pools
        if (poolInfo && selectedPoolKey) {
          const networkId = walletClient?.chain?.id ?? 1;
          const networkName = walletClient?.chain?.name ?? 'Ethereum';
          const newPool = {
            poolId: JSON.stringify(selectedPoolKey),
            token0Symbol: poolInfo.token0Symbol,
            token1Symbol: poolInfo.token1Symbol,
            fee: poolInfo.fee,
            networkId,
            networkName,
            timestamp: Date.now()
          };
          addDeployedPool(JSON.stringify(newPool));
          console.log(newPool)
        }
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
        setError('User rejected the transaction');
      } else {
        setError(errorMessage || 'Swap failed');
      }
    }
  }
  
  const getButtonText = () => {
    if (!selectedPoolKey) return 'Enter/Select Pool Key';
    if (isValidatingPool) return 'Validating Pool...';
    if (!swapState.tokenIn) return 'Select input token';
    if (!swapState.tokenOut) return 'Select output token';
    if (!swapState.amountIn) return 'Enter an amount';
    if (isSwapping) return 'Swapping...';
    if (autoSelectedPool && isConnected) return 'Swap (Auto-Selected)';
    return 'Swap';
  }
  
  const isButtonDisabled = () => {
    return (
      !isConnected ||
      !selectedPoolKey ||
      isValidatingPool ||
      !swapState.tokenIn ||
      !swapState.tokenOut ||
      !swapState.amountIn ||
      isSwapping
    );
  }

  const handlePoolDeployed = (pool: {
    address: string;
    token0: { address: string; symbol: string; name: string; decimals: number; };
    token1: { address: string; symbol: string; name: string; decimals: number; };
    fee: number;
    hookAddress: string;
  }) => {
    // Generate poolId as needed
    const poolId = JSON.stringify({
      currency0: pool.token0.address,
      currency1: pool.token1.address,
      fee: pool.fee,
      tickSpacing: 60, // Set appropriately if you have this info elsewhere
      hooks: pool.hookAddress,
    });

    // Clear auto-selected pool when deploying new pool
    setAutoSelectedPool(null);
    updatePoolId(poolId);
    updateTokenIn(pool.token0);
    updateTokenOut(pool.token1);

    // Add to deployed pools
    const networkId = walletClient?.chain?.id ?? 1;
    const networkName = walletClient?.chain?.name ?? 'Ethereum';
    const newPool = {
      poolId,
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      fee: pool.fee,
      networkId,
      networkName,
      timestamp: Date.now()
    };
    addDeployedPool(JSON.stringify(newPool));
  }
  
  // Handle pool selection from the deployed pools list
  const handleSelectPool = (poolKey: PoolKey | string) => {
    let parsedPoolKey: PoolKey;
    let poolKeyString: string;
    
    if (typeof poolKey === 'string') {
      try {
        parsedPoolKey = JSON.parse(poolKey);
        poolKeyString = poolKey;
      } catch {
        console.error('Invalid pool key format');
        return;
      }
    } else {
      parsedPoolKey = poolKey;
      poolKeyString = JSON.stringify(poolKey, null, 2);
    }
    
    // Clear auto-selected pool when manually selecting
    setAutoSelectedPool(null);
    setSelectedPoolKey(parsedPoolKey);
    setPoolKeyInput(poolKeyString);
    updatePoolId(poolKeyString);
  };
  
  // Clear messages when inputs change
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn, selectedPoolKey]);
  

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

          {/* Pool Key Input Section (hidden UI, logic preserved) */}
          <div style={{ display: 'none' }}>
            <PoolIdSection>
              <PoolIdLabel>Pool Key</PoolIdLabel>
              <PoolIdInputContainer>
                <PoolKeyTextArea
                  placeholder='Paste pool key JSON here:{"currency0":"0x...","currency1":"0x...","fee":3000,"tickSpacing":60,"hooks":"0x0000..."}'
                  value={poolKeyInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPoolKeyInput(value);
                    setAutoSelectedPool(null);
                    if (value.trim() === '') {
                      setSelectedPoolKey(null);
                      updatePoolId('');
                      return;
                    }
                    try {
                      const parsedPoolKey = JSON.parse(value);
                      if (parsedPoolKey.currency0 && parsedPoolKey.currency1 && typeof parsedPoolKey.fee === 'number' && typeof parsedPoolKey.tickSpacing === 'number') {
                        setSelectedPoolKey(parsedPoolKey);
                        updatePoolId(value);
                        console.log('Valid pool key set:', parsedPoolKey);
                      } else {
                        console.log('Invalid pool key structure:', parsedPoolKey);
                        setSelectedPoolKey(null);
                      }
                    } catch (error) {
                      console.log('JSON parse error:', error);
                      setSelectedPoolKey(null);
                    }
                  }}
                />
              </PoolIdInputContainer>
              {selectedPoolKey && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ✓ Valid Pool: {selectedPoolKey.currency0.slice(0, 6)}...{selectedPoolKey.currency0.slice(-4)} / {selectedPoolKey.currency1.slice(0, 6)}...{selectedPoolKey.currency1.slice(-4)} | Fee: {(selectedPoolKey.fee / 10000).toFixed(2)}%
                </div>
              )}
              {autoSelectedPool && (
                <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '4px', padding: '4px 8px', backgroundColor: '#4CAF5020', borderRadius: '4px', border: '1px solid #4CAF5040' }}>
                  🚀 Auto-selected Pool: {autoSelectedPool.currency0?.slice(0, 6)}.../{autoSelectedPool.currency1?.slice(0, 6)}... | Fee: {((typeof autoSelectedPool.fee === 'string' ? parseInt(autoSelectedPool.fee) : autoSelectedPool.fee) / 10000).toFixed(2)}%
                </div>
              )}
              {isValidatingPool && (
                <ValidatingText>Validating pool...</ValidatingText>
              )}
              {poolInfo && selectedPoolKey && (
                <PoolInfoContainer>
                  <PoolInfoTitle>
                    {poolInfo.token0Symbol}/{poolInfo.token1Symbol} Pool
                  </PoolInfoTitle>
                  <PoolInfoDetail>
                    <span>Fee:</span>
                    <span>{(poolInfo.fee / 10000).toFixed(2)}%</span>
                  </PoolInfoDetail>
                  <PoolInfoDetail>
                    <span>Liquidity:</span>
                    <span>{poolInfo.liquidity}</span>
                  </PoolInfoDetail>
                  <PoolInfoDetail>
                    <span>Current Tick:</span>
                    <span>{poolInfo.tick}</span>
                  </PoolInfoDetail>
                </PoolInfoContainer>
              )}
              {validation.poolIdError && (
                <ErrorMessage>{validation.poolIdError}</ErrorMessage>
              )}
              {poolsLoading && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                  🔄 Loading pools...
                </div>
              )}
            </PoolIdSection>
          </div>
          
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
            {/* Quick-select percentage buttons, right-aligned, only on hover */}
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
            {swapState.tokenIn && tokenInBalance && parseFloat(tokenInBalance) > 0 && (
              <TokenBalance>
                {tokenInBalance} {swapState.tokenIn.symbol}
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
                value={swapState.amountOut}
                readOnly
              />
              <TokenSelector
                token={swapState.tokenOut}
                onChange={updateTokenOut}
                error={validation.tokenOutError}
              />
            </InputRow>
            {swapState.tokenOut && tokenOutBalance && parseFloat(tokenOutBalance) > 0 && (
              <TokenBalance>
                {tokenOutBalance} {swapState.tokenOut.symbol}
              </TokenBalance>
            )}
          </InputContainer>

          {isConnected ? (
            <ActionButton
              onClick={handleSwapButtonClick}
              $disabled={isButtonDisabled()}
              disabled={isButtonDisabled()}
            >
              Swap
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
      
      {/* Deployed Pools List (hidden UI, logic preserved) */}
      <div style={{ display: 'none' }}>
        <DeployedPoolsList onSelectPool={handleSelectPool} />
      </div>
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