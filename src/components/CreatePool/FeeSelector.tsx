import styled from 'styled-components'
import { FeeAmount } from '@uniswap/v3-sdk'

interface FeeOption {
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
    label: '0.01%',
    description: 'Best for very stable pairs',
  },
  {
    fee: 500,
    tickSpacing: 10,
    label: '0.05%',
    description: 'Best for stable pairs',
  },
  {
    fee: 3000,
    tickSpacing: 60,
    label: '0.3%',
    description: 'Best for most pairs',
  },
  {
    fee: 10000,
    tickSpacing: 200,
    label: '1%',
    description: 'Best for exotic pairs',
  },
]

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

interface FeeSelectorProps {
  feeAmount?: FeeAmount
  onChange: (fee: FeeAmount) => void
  disabled?: boolean
}

const FEE_AMOUNT_DETAIL: { [key: number]: { label: string; description: string } } = {
  [100]: {
    label: '0.01%',
    description: 'Best for very stable pairs',
  },
  [500]: {
    label: '0.05%',
    description: 'Best for stable pairs',
  },
  [3000]: {
    label: '0.3%',
    description: 'Best for most pairs',
  },
  [10000]: {
    label: '1%',
    description: 'Best for exotic pairs',
  },
}

export function FeeSelector({ feeAmount, onChange, disabled }: FeeSelectorProps) {
  return (
    <Container>
      <Label>Fee Tier</Label>
      <OptionsGrid>
        {Object.entries(FEE_AMOUNT_DETAIL).map(([fee, { label, description }]) => (
          <FeeButton
            key={fee}
            $selected={feeAmount === Number(fee)}
            onClick={() => onChange(Number(fee) as FeeAmount)}
            disabled={disabled}
          >
            <FeeText>{label}</FeeText>
            <Description>{description}</Description>
          </FeeButton>
        ))}
      </OptionsGrid>
    </Container>
  )
}