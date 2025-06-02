import React from 'react'
import styled from 'styled-components'
import { Token } from '../../types'
import { useBalance } from '../../hooks/useBalance'

interface DepositAmountInputsProps {
  token0: Token | null
  token1: Token | null
  token0Amount: string
  token1Amount: string
  onToken0AmountChange: (amount: string) => void
  onToken1AmountChange: (amount: string) => void
  onToken0AmountBlur: () => void
  onToken1AmountBlur: () => void
  tickLower: number
  tickUpper: number
  currentPrice: bigint
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const AmountInputContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 16px;
`

const AmountInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 28px;
  outline: none;
  padding: 0;
  margin-bottom: 8px;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral3};
  }
`

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`

const TokenBalance = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral3};
`

const TokenDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
`

const TokenLogo = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.backgroundSurface};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const TokenSymbol = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const PercentageButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`

const PercentButton = styled.button`
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const DepositAmountInputs = ({
  token0,
  token1,
  token0Amount,
  token1Amount,
  onToken0AmountChange,
  onToken1AmountChange,
  onToken0AmountBlur,
  onToken1AmountBlur,
  tickLower,
  tickUpper,
  currentPrice
}: DepositAmountInputsProps) => {
  const { balance: token0Balance } = useBalance(token0?.address)
  const { balance: token1Balance } = useBalance(token1?.address)

  const handlePercentageClick = (tokenIndex: number, percentage: number) => {
    const balance = tokenIndex === 0 ? token0Balance : token1Balance
    const amount = (parseFloat(balance) * percentage / 100).toString()
    if (tokenIndex === 0) {
      onToken0AmountChange(amount)
    } else {
      onToken1AmountChange(amount)
    }
  }

  return (
    <Container>
      {/* Token 0 Input */}
      <AmountInputContainer>
        <AmountInput
          type="text"
          placeholder="0"
          value={token0Amount}
          onChange={(e) => onToken0AmountChange(e.target.value)}
          onBlur={onToken0AmountBlur}
        />
        <TokenInfo>
          <TokenBalance>{token0Balance} {token0?.symbol}</TokenBalance>
          <TokenDisplay>
            {token0?.logoURI ? (
              <img 
                src={token0.logoURI} 
                alt={token0.symbol} 
                style={{ width: '24px', height: '24px', borderRadius: '12px' }} 
              />
            ) : (
              <TokenLogo>{token0?.symbol?.[0] || '?'}</TokenLogo>
            )}
            <TokenSymbol>{token0?.symbol || 'Select'}</TokenSymbol>
          </TokenDisplay>
        </TokenInfo>
        <PercentageButtons>
          <PercentButton onClick={() => handlePercentageClick(0, 25)}>25%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(0, 50)}>50%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(0, 75)}>75%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(0, 100)}>Max</PercentButton>
        </PercentageButtons>
      </AmountInputContainer>

      {/* Token 1 Input */}
      <AmountInputContainer>
        <AmountInput
          type="text"
          placeholder="0"
          value={token1Amount}
          onChange={(e) => onToken1AmountChange(e.target.value)}
          onBlur={onToken1AmountBlur}
        />
        <TokenInfo>
          <TokenBalance>{token1Balance} {token1?.symbol}</TokenBalance>
          <TokenDisplay>
            {token1?.logoURI ? (
              <img 
                src={token1.logoURI} 
                alt={token1.symbol} 
                style={{ width: '24px', height: '24px', borderRadius: '12px' }} 
              />
            ) : (
              <TokenLogo>{token1?.symbol?.[0] || '?'}</TokenLogo>
            )}
            <TokenSymbol>{token1?.symbol || 'Select'}</TokenSymbol>
          </TokenDisplay>
        </TokenInfo>
        <PercentageButtons>
          <PercentButton onClick={() => handlePercentageClick(1, 25)}>25%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(1, 50)}>50%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(1, 75)}>75%</PercentButton>
          <PercentButton onClick={() => handlePercentageClick(1, 100)}>Max</PercentButton>
        </PercentageButtons>
      </AmountInputContainer>
    </Container>
  )
}

export default DepositAmountInputs