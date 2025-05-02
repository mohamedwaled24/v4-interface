import React, { useState } from 'react'
import styled from 'styled-components'
import { TokenSelector } from './TokenSelector'
import { FeeSelector, FEE_OPTIONS } from './FeeSelector'
import { HookInput } from './HookInput'
import { NetworkSelector } from '../shared/NetworkSelector'
import { useV4Pool } from '../../hooks/useV4Pool'
import { useWallet } from '../../hooks/useWallet'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
  width: 100%;
`

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  margin-bottom: 8px;
`

const BreadcrumbSeparator = styled.span`
  color: ${({ theme }) => theme.colors.neutral3};
`

const BreadcrumbLink = styled.span`
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral1};
`

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const ResetButton = styled.button`
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral2};
  border: none;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundOutline};
  }
`

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Step = styled.div<{ $active?: boolean }>`
  display: flex;
  gap: 12px;
  padding: 12px;
  background: ${({ $active, theme }) => $active ? theme.colors.backgroundModule : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
`

const StepNumber = styled.div<{ $active?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: ${({ $active, theme }) => $active ? theme.colors.accentAction : theme.colors.backgroundInteractive};
  color: ${({ $active, theme }) => $active ? theme.colors.neutral1 : theme.colors.neutral2};
`

const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StepTitle = styled.div<{ $active?: boolean }>`
  font-size: 14px;
  color: ${({ $active, theme }) => $active ? theme.colors.neutral1 : theme.colors.neutral2};
  font-weight: 500;
`

const StepDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
`

const FormSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral1};
`

const SectionDescription = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral2};
  line-height: 1.5;
`

const TokenSelectors = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const HookContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  cursor: pointer;
`

const InfoIcon = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.neutral3};
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral2};
  }
`

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  border: none;
  background: ${({ theme, $variant }) => $variant === 'secondary' ? theme.colors.backgroundInteractive : theme.colors.accentAction};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.8;
  }
`

const ConnectPrompt = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 16px;
  text-align: center;

  p {
    margin: 0;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

interface Token {
  address: string
  symbol: string
  decimals: number
}

interface ValidationErrors {
  token0Error?: string
  token1Error?: string
  hookError?: string
}

interface PoolState {
  token0: Token | null
  token1: Token | null
  fee: number
  hookAddress: string
}

export function CreatePoolForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showHookInput, setShowHookInput] = useState(false)
  const { isConnected } = useWallet()
  const {
    poolState,
    validation,
    isCreating,
    createPool,
    updateToken0,
    updateToken1,
    updateFee,
    updateHook,
    validatePool
  } = useV4Pool()

  const canProceedToStep2 = poolState.token0 && poolState.token1 && poolState.fee && 
    !validation.token0Error && !validation.token1Error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setIsLoading(true)
      try {
        const result = await createPool()
        if (result.success) {
          // Show success message or redirect
          console.log('Pool created successfully:', result.poolAddress)
        } else {
          console.error('Failed to create pool:', result.error)
        }
      } catch (error) {
        console.error('Error creating pool:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setShowHookInput(false)
    // Other state reset would happen in the useV4Pool hook
  }

  const handleHookCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowHookInput(e.target.checked)
    if (!e.target.checked) {
      updateHook('')
    }
  }

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbLink>Your positions</BreadcrumbLink>
        <BreadcrumbSeparator>›</BreadcrumbSeparator>
        <span>New position</span>
      </Breadcrumb>

      <Header>
        <Title>New position</Title>
        <HeaderActions>
          <ResetButton onClick={handleReset}>
            <span>↺</span>
            <span>Reset</span>
          </ResetButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>v4 position</span>
            <span>▾</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>⚙️</button>
        </HeaderActions>
      </Header>

      <MainContent>
        <Steps>
          <Step 
            $active={currentStep === 1}
            onClick={() => currentStep === 2 && setCurrentStep(1)}
          >
            <StepNumber $active={currentStep === 1}>1</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 1}>Select token pair and fees</StepTitle>
              <StepDescription>Choose the tokens and fee tier</StepDescription>
            </StepContent>
          </Step>
          <Step $active={currentStep === 2}>
            <StepNumber $active={currentStep === 2}>2</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 2}>Set price range and deposit amounts</StepTitle>
              <StepDescription>Set your price range and deposit tokens</StepDescription>
            </StepContent>
          </Step>
        </Steps>

        {isConnected ? (
          <Form onSubmit={handleSubmit}>
            {currentStep === 1 ? (
              <FormSection>
                <SectionHeader>
                  <SectionTitle>Select pair</SectionTitle>
                  <SectionDescription>
                    Choose the tokens you want to provide liquidity for. You can select tokens on all supported networks.
                  </SectionDescription>
                </SectionHeader>

                <TokenSelectors>
                  <TokenSelector
                    label="Token 1"
                    token={poolState.token0}
                    onChange={updateToken0}
                    error={validation.token0Error}
                  />
                  <TokenSelector
                    label="Token 2"
                    token={poolState.token1}
                    onChange={updateToken1}
                    error={validation.token1Error}
                  />
                </TokenSelectors>

                <CheckboxRow>
                  <Checkbox
                    type="checkbox"
                    id="addHook"
                    checked={showHookInput}
                    onChange={handleHookCheckboxChange}
                  />
                  <CheckboxLabel htmlFor="addHook">
                    Add a Hook (Advanced)
                  </CheckboxLabel>
                  <InfoIcon title="Hooks allow custom logic to be executed during swaps">ⓘ</InfoIcon>
                </CheckboxRow>

                <div>
                  <SectionHeader>
                    <SectionTitle>Fee tier</SectionTitle>
                    <SectionDescription>
                      The amount earned providing liquidity. Choose an amount that suits your risk tolerance and strategy.
                    </SectionDescription>
                  </SectionHeader>
                  <FeeSelector
                    feeAmount={poolState.fee}
                    onChange={updateFee}
                  />
                </div>

                {showHookInput && (
                  <HookContainer>
                    <HookInput
                      hookAddress={poolState.hookAddress}
                      onChange={updateHook}
                      error={validation.hookError}
                    />
                  </HookContainer>
                )}
              </FormSection>
            ) : (
              <FormSection>
                <SectionHeader>
                  <SectionTitle>Set price range</SectionTitle>
                  <SectionDescription>
                    Select a price range for your position. The narrower the range, the higher the potential returns, but the more likely it is to fall outside the range.
                  </SectionDescription>
                </SectionHeader>
                
                <div style={{ padding: '40px', textAlign: 'center', color: '#8F96AC' }}>
                  Price range selection UI would go here
                </div>
                
                <SectionHeader>
                  <SectionTitle>Deposit amounts</SectionTitle>
                  <SectionDescription>
                    Enter the amounts of tokens you want to deposit into this position.
                  </SectionDescription>
                </SectionHeader>
                
                <div style={{ padding: '40px', textAlign: 'center', color: '#8F96AC' }}>
                  Deposit amount inputs would go here
                </div>
              </FormSection>
            )}

            <ActionButton 
              type="submit" 
              disabled={currentStep === 1 ? !canProceedToStep2 : isLoading}
            >
              {isLoading ? 'Creating...' : currentStep === 1 ? 'Continue' : 'Create Pool'}
            </ActionButton>
          </Form>
        ) : (
          <ConnectPrompt>
            <p>Please connect your wallet to create a pool</p>
          </ConnectPrompt>
        )}
      </MainContent>
    </Container>
  )
}