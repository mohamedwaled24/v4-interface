import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { TokenSelector } from '../CreatePool/TokenSelector'
import { SwapSettings } from './SwapSettings'
import { useV4Swap } from '../../hooks/useV4Swap'
import { useWallet } from '../../hooks/useWallet'
import { useAllPools } from '../../hooks/useAllPools';
import { useBSCPools } from '../../hooks/useBSCPools';
import { findBestPoolByLiquidity, findBestPool, convertPoolToPoolKey, convertBSCPoolToPoolKey } from '../../utils/poolSelectionUtils'
import { ArrowDown } from '../shared/icons'
import { TestPoolDeployer } from './TestPoolDeployer'
import { DeployedPoolsList, addDeployedPool } from './DeployedPoolsList'

const Container = styled.div`
  display: flex;
  gap: 24px;
  padding: 16px 0;
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 480px;
  }
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 480px;
`

const SwapContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const SwapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
`

const SwapTabs = styled.div`
  display: flex;
  gap: 8px;
`

const SwapTab = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ theme, $active }) => 
    $active ? theme.colors.neutral1 : theme.colors.neutral3};
  cursor: pointer;
`

const InputContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundInteractive};
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
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 24px;
  font-weight: 500;
  outline: none;
  padding: 0;
  text-align: left;
  width: 100%;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral3};
  }
`

const USDValue = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
`

const SwapButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  margin: 4px 0;
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
  padding: 16px;
  border-radius: 20px;
  border: none;
  background: ${({ theme, $variant, $disabled }) => 
    $disabled ? theme.colors.backgroundInteractive : 
    $variant === 'secondary' ? theme.colors.backgroundInteractive : theme.colors.accentAction};
  color: ${({ theme, $disabled }) => 
    $disabled ? theme.colors.neutral3 : theme.colors.neutral1};
  font-size: 16px;
  font-weight: 500;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: opacity 0.2s ease;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`

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
  const { isConnected, address, connectWallet, network } = useWallet()
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
  const { pools: allPools, loading: poolsLoading } = useAllPools();
  const { pools: bscPools, loading: bscPoolsLoading } = useBSCPools();

  // Flatten pools if it's an array of arrays
  const flatPools = Array.isArray(allPools[0]) ? allPools.flat() : allPools;

  // Log the full pools response for debugging
  useEffect(() => {
    console.log('Raw pools response from useAllPools:', allPools);
    console.log('Raw pools response from useBSCPools:', bscPools);
    console.log('Flattened pools:', flatPools);
  }, [allPools, bscPools]);

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sellMode, setSellMode] = useState<boolean>(true)
  const [selectedPoolKey, setSelectedPoolKey] = useState<PoolKey | null>(null)
  const [poolKeyInput, setPoolKeyInput] = useState<string>('')
  const [autoSelectedPool, setAutoSelectedPool] = useState<any>(null)

  // Auto-select best pool when tokens are chosen and user is on any supported network
  useEffect(() => {
    if (
      network?.id &&
      swapState.tokenIn &&
      swapState.tokenOut &&
      ((network.id === 56 && bscPools.length > 0 && !bscPoolsLoading) || (network.id !== 56 && flatPools.length > 0 && !poolsLoading))
    ) {
      (async () => {
        const tokenInAddress = swapState.tokenIn?.address?.toLowerCase();
        const tokenOutAddress = swapState.tokenOut?.address?.toLowerCase();
        if (!tokenInAddress || !tokenOutAddress) return;

        if (network.id === 56) {
          // BSC: Use bscPools and findBestPool (by lowest fee)
          const bestPool = findBestPool(bscPools, tokenInAddress, tokenOutAddress);
          if (bestPool) {
            const poolKey = convertBSCPoolToPoolKey(bestPool, tokenInAddress, tokenOutAddress);
            setAutoSelectedPool(bestPool);
            setSelectedPoolKey(poolKey);
            setPoolKeyInput(JSON.stringify(poolKey, null, 2));
            updatePoolId(JSON.stringify(poolKey));
          } else {
            setAutoSelectedPool(null);
            setSelectedPoolKey(null);
            setPoolKeyInput('');
            updatePoolId('');
          }
        } else {
          // Other networks: Use allPools and findBestPoolByLiquidity
          const filteredPools = flatPools.filter((pool: any) =>
            Number(pool.chainId) === Number(network.id) &&
            (
              (pool.token0.split('_')[1]?.toLowerCase() === tokenInAddress &&
                pool.token1.split('_')[1]?.toLowerCase() === tokenOutAddress) ||
              (pool.token0.split('_')[1]?.toLowerCase() === tokenOutAddress &&
                pool.token1.split('_')[1]?.toLowerCase() === tokenInAddress)
            )
          );
          if (filteredPools.length === 0) {
            setAutoSelectedPool(null);
            setSelectedPoolKey(null);
            setPoolKeyInput('');
            updatePoolId('');
            return;
          }
          const rpcUrl = import.meta.env[`VITE_RPC_URL_${network.id}`] || '';
          const bestPool = await findBestPoolByLiquidity(
            filteredPools,
            tokenInAddress,
            tokenOutAddress,
            network.id,
            rpcUrl
          );
          if (bestPool) {
            const poolKey = convertPoolToPoolKey(bestPool);
            setAutoSelectedPool(bestPool);
            setSelectedPoolKey(poolKey);
            setPoolKeyInput(JSON.stringify(poolKey, null, 2));
            updatePoolId(JSON.stringify(poolKey));
          } else {
            setAutoSelectedPool(null);
            setSelectedPoolKey(null);
            setPoolKeyInput('');
            updatePoolId('');
          }
        }
      })();
    }
  }, [network?.id, swapState.tokenIn, swapState.tokenOut, flatPools, allPools, poolsLoading, bscPools, bscPoolsLoading]);
  
  const handleSwapButtonClick = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (error: any) {
        setError(error.message || 'Failed to connect wallet');
      }
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
          const newPool = {
            poolId: JSON.stringify(selectedPoolKey),
            token0Symbol: poolInfo.token0Symbol,
            token1Symbol: poolInfo.token1Symbol,
            fee: poolInfo.fee,
            networkId: network?.id || 1,
            networkName: network?.name || 'Ethereum',
            timestamp: Date.now()
          };
          addDeployedPool(JSON.stringify(newPool));
          console.log(newPool)
        }
      }
    } catch (error: any) {
      console.error('Swap execution error:', error);
      setError(error.message || 'Swap failed');
    }
  }
  
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!selectedPoolKey) return 'Enter/Select Pool Key';
    if (isValidatingPool) return 'Validating Pool...';
    if (!swapState.tokenIn) return 'Select input token';
    if (!swapState.tokenOut) return 'Select output token';
    if (!swapState.amountIn) return 'Enter an amount';
    if (isSwapping) return 'Swapping...';
    if (autoSelectedPool && network?.id) return 'Swap (Auto-Selected)';
    return 'Swap';
  }
  
  const isButtonDisabled = () => {
    if (!isConnected) return false;
    return (
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
    const newPool = {
      poolId,
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      fee: pool.fee,
      networkId: network?.id || 1,
      networkName: network?.name || 'Ethereum',
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
  
  // Debug: Display all returned pools
  const debugPools = (
    <div style={{ margin: '16px 0', padding: '8px', background: '#eee', borderRadius: '8px', fontSize: '12px' }}>
      <strong>All Pools (raw):</strong>
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {flatPools.length === 0 ? (
          <div>No pools returned from backend.</div>
        ) : (
          flatPools.map((pool: any, idx: number) => (
            <div key={pool.id || idx} style={{ marginBottom: 4 }}>
              <span>chainId: {pool.chainId} | token0: {pool.token0} | token1: {pool.token1} | feeTier: {pool.feeTier}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Container>
      <MainContent>
        {/* <TestPoolDeployer onPoolDeployed={handlePoolDeployed} />
         */}
        <SwapContainer>
          <SwapHeader>
            <SwapTabs>
              <SwapTab $active={sellMode} onClick={() => setSellMode(true)}>
                Sell
              </SwapTab>
              <SwapTab $active={!sellMode} onClick={() => setSellMode(false)}>
                Buy
              </SwapTab>
            </SwapTabs>
            <SwapSettings
              slippageTolerance={swapState.slippageTolerance}
              deadline={swapState.deadline}
              onSlippageChange={updateSlippageTolerance}
              onDeadlineChange={updateDeadline}
            />
          </SwapHeader>

          {/* Pool Key Input Section */}
          <PoolIdSection>
            <PoolIdLabel>Pool Key</PoolIdLabel>
            <PoolIdInputContainer>
              <PoolKeyTextArea
                placeholder='Paste pool key JSON here:
{"currency0":"0x...","currency1":"0x...","fee":3000,"tickSpacing":60,"hooks":"0x0000..."}'
                value={poolKeyInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setPoolKeyInput(value);
                  
                  // Clear auto-selected pool when user manually changes pool key
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
                    // Invalid JSON, keep the input but don't set selectedPoolKey
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
              <div style={{ 
                fontSize: '12px', 
                color: '#4CAF50', 
                marginTop: '4px',
                padding: '4px 8px',
                backgroundColor: '#4CAF5020',
                borderRadius: '4px',
                border: '1px solid #4CAF5040'
              }}>
                🚀 Auto-selected Pool: {autoSelectedPool.token0.split('_')[1]?.slice(0, 6)}.../{autoSelectedPool.token1.split('_')[1]?.slice(0, 6)}... | Fee: {((typeof autoSelectedPool.feeTier === 'string' ? parseInt(autoSelectedPool.feeTier) : autoSelectedPool.feeTier) / 10000).toFixed(2)}%
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
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                🔄 Loading pools...
              </div>
            )}
          </PoolIdSection>
          
          {/* Input (From) section */}
          <InputContainer>
            <InputHeader>
              {sellMode ? 'You sell' : 'You pay'}
            </InputHeader>
            <InputRow>
              <AmountInput
                placeholder="0"
                value={swapState.amountIn}
                onChange={(e) => updateAmountIn(e.target.value)}
              />
              <TokenSelector
                label="Select token"
                token={swapState.tokenIn}
                onChange={updateTokenIn}
                error={validation.tokenInError}
              />
            </InputRow>
            {swapState.tokenIn && <USDValue>$0.00</USDValue>}
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
              {sellMode ? 'You buy' : 'You receive'}
            </InputHeader>
            <InputRow>
              <AmountInput
                placeholder="0"
                value={swapState.amountOut}
                readOnly
              />
              <TokenSelector
                label="Select token"
                token={swapState.tokenOut}
                onChange={updateTokenOut}
                error={validation.tokenOutError}
              />
            </InputRow>
            {swapState.tokenOut && <USDValue>$0.00</USDValue>}
          </InputContainer>
          
          {/* Swap button */}
          <ActionButton
            onClick={handleSwapButtonClick}
            $disabled={isButtonDisabled()}
            disabled={isButtonDisabled()}
          >
            {getButtonText()}
          </ActionButton>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
        </SwapContainer>
      </MainContent>
      
      {/* Deployed Pools List */}
      <DeployedPoolsList onSelectPool={handleSelectPool} />
      
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
      {debugPools}
    </Container>
  )
}