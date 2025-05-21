import styled from 'styled-components'
import { useState } from 'react'

export interface FeeOption {
  fee: number
  tickSpacing: number
  label: string
  description: string
}

// Standard fee tiers from Uniswap V4
export const FEE_OPTIONS: FeeOption[] = [
  {
    fee: 100,
    tickSpacing: 1,
    label: '0.0100%',
    description: 'Best for very stable pairs',
  },
  {
    fee: 500,
    tickSpacing: 10,
    label: '0.0500%',
    description: 'Best for stable pairs',
  },
  {
    fee: 3000,
    tickSpacing: 60,
    label: '0.3000%',
    description: 'Best for most pairs',
  },
  {
    fee: 10000,
    tickSpacing: 200,
    label: '1.0000%',
    description: 'Best for exotic pairs',
  },
  {
    fee: 20000,
    tickSpacing: 400,
    label: '2.0000%',
    description: 'Best for highly volatile pairs',
  },
]

// Calculate tick spacing based on fee
const calculateTickSpacing = (fee: number): number => {
  // Base tick spacing on fee magnitude
  if (fee <= 100) return 1
  if (fee <= 500) return 10
  if (fee <= 3000) return 60
  if (fee <= 10000) return 200
  return 400
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral1};
  margin-bottom: 4px;
`

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`

const FeeButton = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.medium};
  border: 1px solid ${({ theme, $selected }) =>
    $selected ? theme.colors.accentAction : theme.colors.backgroundOutline};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.backgroundInteractive : theme.colors.backgroundModule};
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    border-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.accentAction : theme.colors.backgroundOutline};
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FeeText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const Description = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  margin-top: 4px;
  text-align: center;
`

const CustomFeeInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: ${({ theme }) => theme.radii.medium};
  background: ${({ theme }) => theme.colors.backgroundModule};
`

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: ${({ theme }) => theme.radii.small};
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentAction};
  }
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.critical};
  font-size: 14px;
  margin-top: 4px;
`

interface FeeSelectorProps {
  feeAmount?: FeeOption
  onChange: (fee: FeeOption) => void
  disabled?: boolean
  error?: string
}

export function FeeSelector({ feeAmount, onChange, disabled, error }: FeeSelectorProps) {
  const [showCustomFee, setShowCustomFee] = useState(false)
  const [customFee, setCustomFee] = useState('')

  const handleCustomFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomFee(value)
    
    // Only update if it's a valid number
    const fee = parseFloat(value)
    if (!isNaN(fee) && fee > 0) {
      const tickSpacing = calculateTickSpacing(fee)
      onChange({
        fee: Math.floor(fee),
        tickSpacing,
        label: `${(fee / 10000).toFixed(4)}%`,
        description: 'Custom fee tier'
      })
    }
  }

  const handleFeeSelect = (option: FeeOption) => {
    onChange(option)
    setShowCustomFee(false)
  }

  return (
    <Container>
      <Label>Fee Tier</Label>
      <OptionsGrid>
        {FEE_OPTIONS.map((option) => (
          <FeeButton
            key={option.fee}
            type="button"
            $selected={feeAmount?.fee === option.fee}
            onClick={() => handleFeeSelect(option)}
            disabled={disabled}
          >
            <FeeText>{option.label}</FeeText>
            <Description>{option.description}</Description>
          </FeeButton>
        ))}
        <FeeButton
          type="button"
          $selected={showCustomFee}
          onClick={() => setShowCustomFee(true)}
          disabled={disabled}
        >
          <FeeText>Custom</FeeText>
          <Description>Set your own fee tier</Description>
        </FeeButton>
      </OptionsGrid>

      {showCustomFee && (
        <CustomFeeInput>
          <Input
            type="number"
            value={customFee}
            onChange={handleCustomFeeChange}
            placeholder="Enter fee (e.g., 500 for 0.05%)"
            disabled={disabled}
          />
          {customFee && (
            <Description>
              Tick spacing: {calculateTickSpacing(parseFloat(customFee) || 0)}
            </Description>
          )}
        </CustomFeeInput>
      )}

      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  )
}