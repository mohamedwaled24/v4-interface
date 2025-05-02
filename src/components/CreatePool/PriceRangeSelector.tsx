import React, { useState } from 'react'
import styled from 'styled-components'

interface PriceRangeSelectorProps {
  onRangeChange: (isFullRange: boolean, minPrice?: string, maxPrice?: string) => void
  token0Symbol?: string
  token1Symbol?: string
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const RangeOptions = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 4px;
`

const RangeOption = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: ${({ $active, theme }) => 
    $active ? theme.colors.backgroundSurface : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.neutral1 : theme.colors.neutral2};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const PriceInputsContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`

const PriceInputWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PriceInputLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  margin-bottom: 4px;
`

const PriceInput = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 12px;
  padding: 16px;
`

const Input = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 24px;
  outline: none;
  padding: 0;
  margin-bottom: 8px;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral3};
  }
`

const TokenRatio = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral3};
`

const PriceRangeSelector: React.FC<PriceRangeSelectorProps> = ({ 
  onRangeChange, 
  token0Symbol = 'ETH', 
  token1Symbol = 'USDC' 
}) => {
  const [isFullRange, setIsFullRange] = useState(true)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const handleRangeOptionClick = (fullRange: boolean) => {
    setIsFullRange(fullRange)
    if (fullRange) {
      setMinPrice('')
      setMaxPrice('')
      onRangeChange(true)
    } else {
      onRangeChange(false, minPrice || '0', maxPrice || '∞')
    }
  }

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMinPrice(value)
    onRangeChange(false, value, maxPrice)
  }

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMaxPrice(value)
    onRangeChange(false, minPrice, value)
  }

  return (
    <Container>
      <RangeOptions>
        <RangeOption 
          $active={isFullRange} 
          onClick={() => handleRangeOptionClick(true)}
        >
          Full range
        </RangeOption>
        <RangeOption 
          $active={!isFullRange} 
          onClick={() => handleRangeOptionClick(false)}
        >
          Custom range
        </RangeOption>
      </RangeOptions>

      {!isFullRange && (
        <PriceInputsContainer>
          <PriceInputWrapper>
            <PriceInputLabel>Min price</PriceInputLabel>
            <PriceInput>
              <Input 
                type="text" 
                placeholder="0" 
                value={minPrice}
                onChange={handleMinPriceChange}
              />
              <TokenRatio>{token1Symbol} = 1 {token0Symbol}</TokenRatio>
            </PriceInput>
          </PriceInputWrapper>
          
          <PriceInputWrapper>
            <PriceInputLabel>Max price</PriceInputLabel>
            <PriceInput>
              <Input 
                type="text" 
                placeholder="∞" 
                value={maxPrice}
                onChange={handleMaxPriceChange}
              />
              <TokenRatio>{token1Symbol} = 1 {token0Symbol}</TokenRatio>
            </PriceInput>
          </PriceInputWrapper>
        </PriceInputsContainer>
      )}
    </Container>
  )
}

export default PriceRangeSelector
