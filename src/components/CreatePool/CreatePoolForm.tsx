import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { TokenSelector } from './TokenSelector'
import { FeeSelector, FeeOption } from './FeeSelector'
import { HookInput } from './HookInput'
import { ResetButton } from '../shared/ResetButton'
import { Info } from '../shared/icons'
import { useInitializePool } from '../../hooks/useInitializePool'
import { useWallet } from '../../hooks/useWallet'
import { useV4Position } from '../../hooks/useV4Position'
import PriceRangeSelector from './PriceRangeSelector'
import DepositAmountInputs from './DepositAmountInputs'
import ReviewModal from './ReviewModal'
import { Tooltip } from '../shared/Tooltip'
import { toast } from 'react-toastify'
import { parseUnits, encodeAbiParameters } from 'viem'
import { CONTRACTS } from '../../constants/contracts'
import { calculateTickSpacingFromFeeAmount } from '../Liquidity/utils'
import { NetworkSelector } from '../shared/NetworkSelector'
import { generatePoolId, getPoolInfo, needsPoolCreation, isPoolReady } from '../../utils/stateViewUtils';
import { addDeployedPool } from '../Swap/DeployedPoolsList'

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
  align-items: center;
  gap: 16px;
`

const StyledNetworkSelector = styled(NetworkSelector)`
  margin-right: 8px;
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
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [poolInfo, setPoolInfo] = useState<{
    sqrtPriceX96: string;
    liquidity: string;
    tick: number;
  } | null>(null)
  
  const { isConnected, connectWallet, chainId, network } = useWallet()
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
  
  // Updated hook usage - separate functions for calculation and execution
  const { calculateRequiredAmounts, executeTransaction, isAddingLiquidity } = useV4Position()

  useEffect(() => {
    if (chainId) {
      console.log(`Network changed to: ${chainId}`);
      setCurrentStep(1);
      setPoolId(null);
    }
  }, [chainId]);

  const canProceedToStep2 = poolState.token0 && poolState.token1 && poolState.fee && 
    !validation.token0Error && !validation.token1Error

  const getPoolId = async () => {
    try {
      if (!chainId || !CONTRACTS[chainId as keyof typeof CONTRACTS]) {
        console.error('Unsupported chain ID:', chainId);
        toast.error(`Network ${chainId} is not supported for pool creation`);
        return null;
      }

      console.log(`Getting pool ID for tokens on network ${chainId}:`, {
        token0: poolState.token0?.address,
        token1: poolState.token1?.address,
        fee: poolState.fee.fee,
        tickSpacing: poolState.fee.tickSpacing,
        hookAddress: poolState.hookAddress
      });

      const poolKey = {
        currency0: poolState.token0?.address || '',
        currency1: poolState.token1?.address || '',
        fee: poolState.fee.fee,
        tickSpacing: poolState.fee.tickSpacing,
        hooks: poolState.hookAddress || '0x0000000000000000000000000000000000000000'
      };

      // const encodedPoolKey = encodeAbiParameters(
      //   [
      //     { name: 'currency0', type: 'address' },
      //     { name: 'currency1', type: 'address' },
      //     { name: 'fee', type: 'uint24' },
      //     { name: 'tickSpacing', type: 'int24' },
      //     { name: 'hooks', type: 'address' }
      //   ],
      //   [
      //     poolKey.currency0 as `0x${string}`,
      //     poolKey.currency1 as `0x${string}`,
      //     poolKey.fee,
      //     poolKey.tickSpacing,
      //     poolKey.hooks as `0x${string}`
      //   ]
      // );

      addDeployedPool(JSON.stringify(poolKey));

      const poolId = generatePoolId({
        currency0: poolState.token0?.address || '',
        currency1: poolState.token1?.address || '',
        fee: poolState.fee.fee,
        tickSpacing: poolState.fee.tickSpacing,
        hooks: poolState.hookAddress || '0x0000000000000000000000000000000000000000'
      });

      console.log(`Pool ID generated: ${poolId}`);
      return poolId;
    } catch (error) {
      console.error('Error getting pool ID:', error);
      return null;
    }
  };

  const checkPoolExists = async () => {
    try {
      if (!chainId || !CONTRACTS[chainId as keyof typeof CONTRACTS]) {
        console.error('Unsupported chain ID:', chainId);
        toast.error(`Network ${chainId} is not supported for pool operations`);
        return { exists: false, isInitialized: false, poolId: null };
      }

      const poolId = await getPoolId();
      if (!poolId) {
        console.error('Failed to get pool ID');
        return { exists: false, isInitialized: false, poolId: null };
      }

      const rpcUrl = network?.rpcUrl || 'https://unichain-sepolia-rpc.publicnode.com';
      const poolInfo = await getPoolInfo(chainId, rpcUrl, poolId);
      
      console.log('Pool existence check result:', {
        exists: poolInfo.exists,
        isInitialized: poolInfo.isInitialized,
        poolId
      });
      
      return {
        exists: poolInfo.exists,
        isInitialized: poolInfo.isInitialized,
        poolId
      };
    } catch (error) {
      console.error('Error checking if pool exists:', error);
      return { exists: false, isInitialized: false, poolId: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1 && canProceedToStep2) {
      const calculatedTickSpacing = calculateTickSpacingFromFeeAmount(poolState.fee?.fee || 0);
      
      console.log(`Step 1 Form Values (${new Date().toISOString()}):`, {
        token0: {
          address: poolState.token0?.address,
          symbol: poolState.token0?.symbol,
          decimals: poolState.token0?.decimals
        },
        token1: {
          address: poolState.token1?.address,
          symbol: poolState.token1?.symbol,
          decimals: poolState.token1?.decimals
        },
        fee: {
          fee: poolState.fee?.fee,
          tickSpacing: poolState.fee?.tickSpacing,
          calculatedTickSpacing: calculatedTickSpacing,
          formattedFee: `${((poolState.fee?.fee || 0) / 10000).toFixed(4)}%`
        },
        hookAddress: poolState.hookAddress,
        hookEnabled: showHookInput
      });
      
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Show review modal instead of executing transaction
      setShowReviewModal(true);
    }
  }

  // Function to actually create the position (moved from handleSubmit to modal)
  const handleCreatePosition = async () => {
    if (!poolState.token0 || !poolState.token1) {
      toast.error('Missing token information');
      return;
    }
  
    const calculatedTickSpacing = calculateTickSpacingFromFeeAmount(poolState.fee?.fee || 0);
    
    console.log(`Creating Position (${new Date().toISOString()}):`, {
      tokens: {
        token0: {
          address: poolState.token0?.address,
          symbol: poolState.token0?.symbol,
          decimals: poolState.token0?.decimals,
          amount: token0Amount
        },
        token1: {
          address: poolState.token1?.address,
          symbol: poolState.token1?.symbol,
          decimals: poolState.token1?.decimals,
          amount: token1Amount
        }
      },
      fee: {
        fee: poolState.fee?.fee,
        tickSpacing: poolState.fee?.tickSpacing,
        calculatedTickSpacing: calculatedTickSpacing,
        formattedFee: `${((poolState.fee?.fee || 0) / 10000).toFixed(4)}%`
      },
      priceRange: {
        isFullRange,
        minPrice: isFullRange ? 'Min (-887272)' : minPrice,
        maxPrice: isFullRange ? 'Max (887272)' : maxPrice,
        tickLower: isFullRange ? -887272 : parseInt(minPrice || '0'),
        tickUpper: isFullRange ? 887272 : parseInt(maxPrice || '0')
      },
      hookAddress: poolState.hookAddress,
      hookEnabled: showHookInput,
      poolId
    });
    
    setIsLoading(true);
    try {
      const { exists, isInitialized, poolId: existingPoolId } = await checkPoolExists();
      console.log('Pool existence check result:', { exists, isInitialized, poolId: existingPoolId });
      
      if (exists && isInitialized && existingPoolId) {
        setPoolId(existingPoolId);
        toast.info('Pool exists and is ready. Adding liquidity...');
        
        // Add liquidity to existing pool using the useV4Position hook
        await addLiquidityToPool(existingPoolId);
        
        toast.success('Liquidity added successfully!');
        setShowReviewModal(false); // Close modal on success
      } else if (exists && !isInitialized && existingPoolId) {
        setPoolId(existingPoolId);
        toast.info('Pool exists but needs initialization. Initializing and adding liquidity...');
        
        // Pool exists but not initialized - initialize it with parameters
        const result = await initializePool({
          poolId: existingPoolId,
          token0: {
            address: poolState.token0.address,
            decimals: poolState.token0.decimals,
            amount: token0Amount,
            symbol: poolState.token0.symbol
          },
          token1: {
            address: poolState.token1.address,
            decimals: poolState.token1.decimals,
            amount: token1Amount,
            symbol: poolState.token1.symbol
          },
          fee: poolState.fee.fee,
          tickLower: isFullRange ? -887272 : parseInt(minPrice || '0'),
          tickUpper: isFullRange ? 887272 : parseInt(maxPrice || '0'),
          hookAddress: poolState.hookAddress,
          slippageToleranceBips: 50
        });
        
        console.log('Pool initialization result:', result);
        
        if (result.success && result.poolId) {
          console.log('Pool initialized successfully:', result.poolId);
          toast.success('Pool initialized and liquidity added successfully!');
          setShowReviewModal(false); // Close modal on success
        } else {
          console.error('Failed to initialize pool:', result);
          toast.error('Failed to initialize pool: ' + (result.error || 'Unknown error'));
        }
      } else {
        toast.info('Pool does not exist. Creating pool first...');
        
        // Pool doesn't exist - create it with parameters
        const result = await initializePool({
          poolId: existingPoolId || '', // Use existing or empty
          token0: {
            address: poolState.token0.address,
            decimals: poolState.token0.decimals,
            amount: token0Amount,
            symbol: poolState.token0.symbol
          },
          token1: {
            address: poolState.token1.address,
            decimals: poolState.token1.decimals,
            amount: token1Amount,
            symbol: poolState.token1.symbol
          },
          fee: poolState.fee.fee,
          tickLower: isFullRange ? -887272 : parseInt(minPrice || '0'),
          tickUpper: isFullRange ? 887272 : parseInt(maxPrice || '0'),
          hookAddress: poolState.hookAddress,
          slippageToleranceBips: 50
        });
        
        console.log('Pool creation result:', result);
        
        if (result.success && result.poolId) {
          console.log('Pool created successfully:', result.poolId);
          setPoolId(result.poolId);
          toast.success('Pool created and liquidity added successfully!');
          setShowReviewModal(false); // Close modal on success
        } else {
          console.error('Failed to create pool:', result);
          toast.error('Failed to create pool: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error in liquidity addition process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated function to add liquidity to a pool using the new separated approach
  const addLiquidityToPool = async (poolId: string) => {
    if (!poolState.token0 || !poolState.token1) {
      toast.error('Missing token information');
      return;
    }

    try {
      const tickLower = isFullRange ? -887272 : parseInt(minPrice || '0');
      const tickUpper = isFullRange ? 887272 : parseInt(maxPrice || '0');
      
      console.log('Adding liquidity with params:', {
        poolId,
        token0: poolState.token0,
        token1: poolState.token1,
        fee: poolState.fee.fee,
        tickLower,
        tickUpper,
        token0Amount,
        token1Amount
      });
      
      // Step 1: Calculate the required amounts
      const calculationResult = await calculateRequiredAmounts({
        token0: {
          address: poolState.token0.address,
          decimals: poolState.token0.decimals,
          amount: token0Amount,
          symbol: poolState.token0.symbol
        },
        token1: {
          address: poolState.token1.address,
          decimals: poolState.token1.decimals,
          amount: token1Amount,
          symbol: poolState.token1.symbol
        },
        fee: poolState.fee.fee,
        tickLower,
        tickUpper,
        hookAddress: poolState.hookAddress
      });

      if (!calculationResult.success) {
        throw new Error(calculationResult.error || 'Failed to calculate required amounts');
      }

      // Step 2: Execute the transaction
      const txResult = await executeTransaction(calculationResult);
      
      if (!txResult.success) {
        throw new Error(txResult.error || 'Failed to add liquidity');
      }
      
      console.log('Position created with transaction hash:', txResult.hash);
      return txResult.hash;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  };

  const handleReset = () => {
    setCurrentStep(1)
    setShowHookInput(false)
    setIsFullRange(true)
    setMinPrice('')
    setMaxPrice('')
    setToken0Amount('')
    setToken1Amount('')
    setPoolId(null)
    setShowReviewModal(false)
    setPoolInfo(null)
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
  
  // Token0 onBlur - no calculation, just let user input freely
  const handleToken0AmountBlur = () => {
    // No calculation here - user can input any amount they want
    console.log('Token0 blur - no calculation performed');
  };
  
  // Updated Token1 onBlur - use calculateRequiredAmounts instead of addLiquidity
  const handleToken1AmountBlur = async () => {
    if (!poolState.token0 || !poolState.token1 || !token0Amount || !token1Amount) {
      console.log('Missing required data for calculation:', {
        token0: !!poolState.token0,
        token1: !!poolState.token1,
        token0Amount: !!token0Amount,
        token1Amount: !!token1Amount
      });
      return;
    }
  
    try {
      const tickLower = isFullRange ? -887272 : parseInt(minPrice || '0');
      const tickUpper = isFullRange ? 887272 : parseInt(maxPrice || '0');
  
      console.log('Calculating requirements based on user inputs:', {
        token0Amount,
        token1Amount,
        tickLower,
        tickUpper
      });

      // Use calculateRequiredAmounts for fast calculation (no simulation)
      const result = await calculateRequiredAmounts({
        token0: {
          address: poolState.token0.address,
          decimals: poolState.token0.decimals,
          amount: token0Amount, // Use user's input
          symbol: poolState.token0.symbol
        },
        token1: {
          address: poolState.token1.address,
          decimals: poolState.token1.decimals,
          amount: token1Amount, // Use user's input
          symbol: poolState.token1.symbol
        },
        fee: poolState.fee.fee,
        tickLower,
        tickUpper,
        hookAddress: poolState.hookAddress
      });
  
      if (result.success && result.requiredAmount0 && result.requiredAmount1) {
        console.log('Updating both fields with calculated requirements:', {
          requiredAmount0: result.requiredAmount0,
          requiredAmount1: result.requiredAmount1
        });
        
        // Update BOTH fields with the calculated requirements
        setToken0Amount(result.requiredAmount0);
        setToken1Amount(result.requiredAmount1);
        
        // Store pool info for the modal
        if (result.poolInfo) {
          setPoolInfo(result.poolInfo);
        }
        
        toast.info('Amounts updated to match liquidity requirements');
      } else {
        console.error('Calculation failed:', result.error);
        toast.error('Failed to calculate requirements: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error calculating requirements:', error);
      toast.error('Error calculating requirements');
    }
  };

  // Simple onChange handlers for immediate state updates
  const handleToken0AmountChange = (amount: string) => {
    setToken0Amount(amount);
  };

  const handleToken1AmountChange = (amount: string) => {
    setToken1Amount(amount);
  };

  //1:1
  const currPrice = BigInt(Math.floor(79228162514264337593543950336));

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
          <StyledNetworkSelector />
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
          <Step $active={currentStep === 2}>
            <StepNumber $active={currentStep === 2}>2</StepNumber>
            <StepContent>
              <StepTitle $active={currentStep === 2}>Add liquidity</StepTitle>
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
            ) : (
              <FormSection>
                <SectionHeader>
                  <SectionTitle>Add Liquidity</SectionTitle>
                  <SectionDescription>
                    Set your price range and deposit tokens. Enter both amounts, then tab out of the second token to calculate requirements.
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
                  onToken0AmountBlur={handleToken0AmountBlur}
                  onToken1AmountBlur={handleToken1AmountBlur}
                  tickLower={isFullRange ? -887272 : parseInt(minPrice)}
                  tickUpper={isFullRange ? 887272 : parseInt(maxPrice)}
                  currentPrice={currPrice}
                />
              </FormSection>
            )}

            <ActionButton 
              type="submit" 
              disabled={
                currentStep === 1 ? !canProceedToStep2 : 
                isAddingLiquidity || !token0Amount || !token1Amount
              }
            >
              {isAddingLiquidity ? 'Processing...' : 
               currentStep === 1 ? 'Continue' : 
               'Review'}
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

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onCreatePosition={handleCreatePosition}
        token0={poolState.token0}
        token1={poolState.token1}
        token0Amount={token0Amount}
        token1Amount={token1Amount}
        feeInfo={poolState.fee}
        priceRange={{
          min: minPrice,
          max: maxPrice,
          isFullRange
        }}
        poolInfo={poolInfo}
        isLoading={isLoading}
      />
    </Container>
  )
}