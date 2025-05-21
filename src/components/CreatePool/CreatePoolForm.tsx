import React, { useState } from 'react'
import styled from 'styled-components'
import { TokenSelector } from './TokenSelector'
import { FeeSelector, FeeOption } from './FeeSelector'
import { HookInput } from './HookInput'
import { ResetButton } from '../shared/ResetButton'
import { Info } from '../shared/icons'
import { useInitializePool } from '../../hooks/useInitializePool'
import { useWallet } from '../../hooks/useWallet'
import PriceRangeSelector from './PriceRangeSelector'
import DepositAmountInputs from './DepositAmountInputs'
import { Tooltip } from '../shared/Tooltip'
import { toast } from 'react-toastify'
import { createPublicClient, http } from 'viem'
import { unichainSepolia } from 'viem/chains'
import { CONTRACTS } from '../../constants/contracts'


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

// ResetButton is now imported from shared components

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

const StyledInfoIcon = styled(Info)`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.neutral3};
  cursor: pointer;
  width: 16px;
  height: 16px;
  
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
  fee: FeeOption
  hookAddress: string
}

export function CreatePoolForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showHookInput, setShowHookInput] = useState(false)
  const [isFullRange, setIsFullRange] = useState(true)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [token0Amount, setToken0Amount] = useState('')
  const [token1Amount, setToken1Amount] = useState('')
  const [poolId, setPoolId] = useState<string | null>(null)
  
  const { isConnected, connectWallet } = useWallet()
  const {
    poolState,
    validation,
    isInitializing,
    initializePool,
    updateToken0,
    updateToken1,
    updateFee,
    updateHook,
    updateSqrtPriceX96,
    validatePool
  } = useInitializePool()

  const canProceedToStep2 = poolState.token0 && poolState.token1 && poolState.fee && 
    !validation.token0Error && !validation.token1Error

  const getPoolId = async () => {
    try {
      const publicClient = createPublicClient({
        chain: unichainSepolia,
        transport: http()
      })

      // Get pool ID from the PoolManager contract
      const poolId = await publicClient.readContract({
        address: CONTRACTS[1301].PoolManager as `0x${string}`,
        abi: [{
          name: 'getPoolId',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' }
          ],
          outputs: [{ type: 'bytes32' }]
        }],
        functionName: 'getPoolId',
        args: [
          poolState.token0?.address as `0x${string}`,
          poolState.token1?.address as `0x${string}`,
          poolState.fee.fee,
          poolState.fee.tickSpacing,
          poolState.hookAddress as `0x${string}`
        ]
      })

      return poolId
    } catch (error) {
      console.error('Error getting pool ID:', error)
      return null
    }
  }

  const checkPoolExists = async () => {
    try {
      const result = await initializePool()
      if (result.error?.includes('PoolAlreadyInitialized')) {
        // Pool exists, get the pool ID from the error message or contract
        const poolId = result.poolId || await getPoolId()
        if (poolId) {
          setPoolId(poolId)
          setCurrentStep(3) // Skip to liquidity step
          toast.info('Pool already exists. You can add liquidity to it.')
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error checking pool:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1 && canProceedToStep2) {
      // Simply move to step 2 without checking pool existence
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setIsLoading(true)
      try {
        // Initialize pool
        const result = await initializePool()
        console.log('Pool initialization result:', result)

        if (result.success && result.poolId) {
          console.log('Pool created successfully:', result.poolId)
          setPoolId(result.poolId)
          setCurrentStep(3) // Move to liquidity step
          toast.success('Pool created successfully!')
        } else {
          console.error('Failed to create pool:', result)
          if (result.error?.includes('PoolAlreadyInitialized')) {
            // Pool exists, get the pool ID and skip to liquidity step
            const poolId = result.poolId || await getPoolId()
            setPoolId(poolId)
            setCurrentStep(3)
            toast.info('Pool already exists. You can add liquidity to it.')
          } else {
            toast.error('Failed to create pool: ' + (result.error || 'Unknown error'))
          }
        }
      } catch (error) {
        console.error('Error creating pool:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('PoolAlreadyInitialized')) {
          // Pool exists, get the pool ID and skip to liquidity step
          const poolId = await getPoolId()
          setPoolId(poolId)
          setCurrentStep(3)
          toast.info('Pool already exists. You can add liquidity to it.')
        } else {
          toast.error('Error creating pool: ' + errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setShowHookInput(false)
    setIsFullRange(true)
    setMinPrice('')
    setMaxPrice('')
    setToken0Amount('')
    setToken1Amount('')
    setPoolId(null)
  }

  const handleHookCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowHookInput(e.target.checked)
    if (!e.target.checked) {
      updateHook("0x0000000000000000000000000000000000000000")
    }
  }
  
  const handleRangeChange = (fullRange: boolean, min?: string, max?: string) => {
    setIsFullRange(fullRange)
    if (fullRange) {
      setMinPrice('')
      setMaxPrice('')
    } else {
      setMinPrice(min || '')
      setMaxPrice(max || '')
    }
  }
  
  const handleToken0AmountChange = (amount: string) => {
    setToken0Amount(amount)
  }
  
  const handleToken1AmountChange = (amount: string) => {
    setToken1Amount(amount)
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
          <ResetButton onClickReset={handleReset} isDisabled={false} />
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
            onClick={() => currentStep > 1 && setCurrentStep(1)}
          >
            <StepNumber $active={currentStep === 1}>1</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 1}>Select token pair and fees</StepTitle>
              <StepDescription>Choose the tokens and fee tier</StepDescription>
            </StepContent>
          </Step>
          <Step 
            $active={currentStep === 2}
            onClick={() => currentStep > 2 && setCurrentStep(2)}
          >
            <StepNumber $active={currentStep === 2}>2</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 2}>Initialize pool</StepTitle>
              <StepDescription>Create the pool with initial price</StepDescription>
            </StepContent>
          </Step>
          <Step $active={currentStep === 3}>
            <StepNumber $active={currentStep === 3}>3</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 3}>Add liquidity</StepTitle>
              <StepDescription>Set price range and deposit tokens</StepDescription>
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
                    token={poolState.token0 || null}
                    onChange={updateToken0}
                    error={validation.token0Error}
                  />
                  <TokenSelector
                    label="Token 2"
                    token={poolState.token1 || null}
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
                  <Tooltip content="Hooks allow custom logic to be executed during swaps">
                    <StyledInfoIcon />
                  </Tooltip>
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
                    onChange={(fee) => {
                      updateFee(fee)
                      // Prevent form submission when selecting fee
                      e?.preventDefault()
                    }}
                    error={undefined}
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
            ) : currentStep === 2 ? (
              <FormSection>
                <SectionHeader>
                  <SectionTitle>Initialize Pool</SectionTitle>
                  <SectionDescription>
                    Create a new pool with the selected tokens and fee tier.
                  </SectionDescription>
                </SectionHeader>
                
                <div>
                  <p>Token Pair: {poolState.token0?.symbol} / {poolState.token1?.symbol}</p>
                  <p>Fee Tier: {((poolState.fee?.fee || 0) / 10000).toFixed(4)}%</p>
                  {poolState.hookAddress !== "0x0000000000000000000000000000000000000000" && (
                    <p>Hook: {poolState.hookAddress}</p>
                  )}
                </div>
              </FormSection>
            ) : (
              <FormSection>
                <SectionHeader>
                  <SectionTitle>Add Liquidity</SectionTitle>
                  <SectionDescription>
                    Set your price range and deposit tokens.
                  </SectionDescription>
                </SectionHeader>
                
                <PriceRangeSelector 
                  onRangeChange={handleRangeChange}
                  token0Symbol={poolState.token0?.symbol}
                  token1Symbol={poolState.token1?.symbol}
                />
                
                <DepositAmountInputs 
                  token0={poolState.token0 || null}
                  token1={poolState.token1 || null}
                  token0Amount={token0Amount}
                  token1Amount={token1Amount}
                  onToken0AmountChange={handleToken0AmountChange}
                  onToken1AmountChange={handleToken1AmountChange}
                  tickLower={isFullRange ? -887272 : parseInt(minPrice)}
                  tickUpper={isFullRange ? 887272 : parseInt(maxPrice)}
                  currentPrice={poolState.sqrtPriceX96 || 79228162514264337593543950336n}
                />
              </FormSection>
            )}

            <ActionButton 
              type="submit" 
              disabled={
                currentStep === 1 ? !canProceedToStep2 : 
                currentStep === 2 ? isLoading || isInitializing :
                isLoading // For step 3
              }
            >
              {isLoading || isInitializing ? 'Processing...' : 
               currentStep === 1 ? 'Continue' : 
               currentStep === 2 ? 'Initialize Pool' :
               'Add Liquidity'}
            </ActionButton>
          </Form>
        ) : (
          <ConnectPrompt>
            <p>Please connect your wallet to create a pool</p>
            <ActionButton onClick={async () => {
              try {
                await connectWallet();
              } catch (error) {
                console.error('Failed to connect wallet:', error);
              }
            }}>
              Connect Wallet
            </ActionButton>
          </ConnectPrompt>
        )}
      </MainContent>
    </Container>
  )
}