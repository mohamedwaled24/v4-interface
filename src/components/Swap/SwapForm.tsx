import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { TokenSelector } from '../CreatePool/TokenSelector'
import { PoolSelector } from './PoolSelector'
import { SwapSettings } from './SwapSettings'
import { useV4Swap } from '../../hooks/useV4Swap'
import { useWallet } from '../../hooks/useWallet'
import { NetworkSelector } from '../shared/NetworkSelector'
import { ResetButton } from '../shared/ResetButton'
import { ArrowDown } from '../shared/icons'
import { TestPoolDeployer } from './TestPoolDeployer'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
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

const TokenRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const PoolSelectorContainer = styled.div`
  margin-top: 8px;
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.background}80;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  backdrop-filter: blur(2px);
`

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  font-weight: 500;
`

export function SwapForm() {
  const { isConnected, address, connectWallet } = useWallet()
  const {
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
  } = useV4Swap()
  
  const [error, setError] = useState<string | null>(null)
  const [sellMode, setSellMode] = useState<boolean>(true)
  const [showTestPoolDeployer, setShowTestPoolDeployer] = useState<boolean>(true)
  
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
      const result = await executeSwap();
      
      if (!result.success) {
        setError(result.error || 'Swap failed');
      } else if (result.txHash) {
        // Show success message
        setError(null);
        // If in test mode, we can show a success message
        alert(`Swap successful! Transaction: ${result.txHash.slice(0, 10)}...`);
        
        // Reset the input amount but keep the tokens and pool
        updateAmountIn('');
      }
    } catch (error: any) {
      setError(error.message || 'Swap failed');
    }
  }
  
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!swapState.tokenIn) return 'Select a token';
    if (!swapState.tokenOut) return 'Select a token';
    if (!swapState.amountIn) return 'Enter an amount';
    if (!swapState.selectedPool) return 'Select a pool';
    return 'Swap';
  }
  
  const isButtonDisabled = () => {
    if (!isConnected) return false; // Allow connecting wallet
    return (
      !swapState.tokenIn ||
      !swapState.tokenOut ||
      !swapState.amountIn ||
      !swapState.selectedPool ||
      isSwapping
    );
  }
  
  const handleReset = () => {
    // Reset the form
    updateTokenIn({
      address: '',
      symbol: '',
      name: '',
      decimals: 18
    });
    updateTokenOut({
      address: '',
      symbol: '',
      name: '',
      decimals: 18
    });
    updateAmountIn('');
    setError(null);
  }

  const handlePoolDeployed = (pool: {
    address: string;
    token0: any;
    token1: any;
    fee: number;
    hookAddress: string;
  }) => {
    // Update available pools
    setAvailablePools([pool]);
    
    // Auto-select the newly deployed pool
    updateSelectedPool(pool);
    
    // Auto-select tokens
    updateTokenIn(pool.token0);
    updateTokenOut(pool.token1);
    
    // Hide the test pool deployer
    setShowTestPoolDeployer(false);
  }
  
  // Clear error when inputs change
  useEffect(() => {
    setError(null);
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn, swapState.selectedPool]);
  
  return (
    <Container>
      <TestPoolDeployer onPoolDeployed={handlePoolDeployed} />
      
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
        
        {/* Pool selector - only show when both tokens are selected */}
        {swapState.tokenIn && swapState.tokenOut && (
          <PoolSelectorContainer>
            <PoolSelector
              selectedPool={swapState.selectedPool}
              availablePools={availablePools}
              onSelectPool={updateSelectedPool}
              isLoading={isLoadingPools}
              error={validation.poolError}
            />
          </PoolSelectorContainer>
        )}
        
        {/* Swap button */}
        <ActionButton
          onClick={handleSwapButtonClick}
          $disabled={isButtonDisabled()}
          disabled={isButtonDisabled()}
        >
          {getButtonText()}
        </ActionButton>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </SwapContainer>
      
      {isSwapping && (
        <LoadingOverlay>
          <LoadingText>Swapping...</LoadingText>
        </LoadingOverlay>
      )}
    </Container>
  )
} 