import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Token } from '../../types'
import { useBalance } from '../../hooks/useBalance'
import { createPublicClient, http } from 'viem'
import { unichainSepolia } from 'viem/chains'
import { BigNumber } from '@ethersproject/bignumber'

// Constants
const Q96 = BigNumber.from(2).pow(96)
const Q192 = BigNumber.from(2).pow(192)

// Helper function to get sqrt price at tick
function getSqrtPriceAtTick(tick: number): BigNumber {
  const absTick = Math.abs(tick)
  let ratio = BigNumber.from(1)
  
  if (absTick & 0x1) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x10) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x20) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x40) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x80) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x100) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x200) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x400) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x800) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x1000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x10000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x20000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x40000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x80000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x100000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x200000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x400000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x800000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x1000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x10000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x20000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x40000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x80000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x100000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x200000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x400000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x800000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x1000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x10000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x20000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x40000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x80000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x100000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x200000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x400000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x800000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x1000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x10000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x20000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x40000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x80000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x100000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x200000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x400000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x800000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x1000000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x2000000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x4000000000000000) ratio = ratio.mul('79228162514264337593543950336')
  if (absTick & 0x8000000000000000) ratio = ratio.mul('79228162514264337593543950336')
  
  if (tick < 0) ratio = BigNumber.from(1).mul(Q192).div(ratio)
  
  return ratio
}

// Helper function to get liquidity for amount0
function getLiquidityForAmount0(
  sqrtPriceAX96: BigNumber,
  sqrtPriceBX96: BigNumber,
  amount0: BigNumber
): BigNumber {
  return amount0.mul(sqrtPriceAX96.mul(sqrtPriceBX96).div(Q96)).div(sqrtPriceBX96.sub(sqrtPriceAX96))
}

// Helper function to get liquidity for amount1
function getLiquidityForAmount1(
  sqrtPriceAX96: BigNumber,
  sqrtPriceBX96: BigNumber,
  amount1: BigNumber
): BigNumber {
  return amount1.mul(Q96).div(sqrtPriceBX96.sub(sqrtPriceAX96))
}

// Helper function to get amount0 for liquidity
function getAmount0ForLiquidity(
  sqrtPriceX96: BigNumber,
  sqrtPriceAX96: BigNumber,
  sqrtPriceBX96: BigNumber,
  liquidity: BigNumber
): BigNumber {
  return liquidity.mul(sqrtPriceBX96.sub(sqrtPriceAX96)).div(sqrtPriceAX96.mul(sqrtPriceBX96).div(Q96))
}

// Helper function to get amount1 for liquidity
function getAmount1ForLiquidity(
  sqrtPriceX96: BigNumber,
  sqrtPriceAX96: BigNumber,
  sqrtPriceBX96: BigNumber,
  liquidity: BigNumber
): BigNumber {
  return liquidity.mul(sqrtPriceBX96.sub(sqrtPriceAX96)).div(Q96)
}

interface DepositAmountInputsProps {
  token0: Token | null
  token1: Token | null
  token0Amount: string
  token1Amount: string
  onToken0AmountChange: (amount: string) => void
  onToken1AmountChange: (amount: string) => void
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
  tickLower,
  tickUpper,
  currentPrice
}: DepositAmountInputsProps) => {
  const { balance: token0Balance } = useBalance(token0?.address)
  const { balance: token1Balance } = useBalance(token1?.address)
  const isUpdating = useRef(false)

  useEffect(() => {
    const checkDecimals = async () => {
      const publicClient = createPublicClient({
        chain: unichainSepolia,
        transport: http()
      })

      // For token0, if it's native ETH (zero address), use 18 decimals
      if (token0?.address) {
        if (token0.address === '0x0000000000000000000000000000000000000000') {
          console.log('Token0 (ETH) decimals: 18')
        } else {
          try {
            const decimals = await publicClient.readContract({
              address: token0.address as `0x${string}`,
              abi: [{
                name: 'decimals',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'uint8' }]
              }],
              functionName: 'decimals'
            })
            console.log('Token0 decimals:', decimals)
          } catch (error) {
            console.error('Error checking token0 decimals:', error)
          }
        }
      }

      // For token1, check decimals normally
      if (token1?.address && token1.address !== '0x0000000000000000000000000000000000000000') {
        try {
          const decimals = await publicClient.readContract({
            address: token1.address as `0x${string}`,
            abi: [{
              name: 'decimals',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ type: 'uint8' }]
            }],
            functionName: 'decimals'
          })
          console.log('Token1 decimals:', decimals)
        } catch (error) {
          console.error('Error checking token1 decimals:', error)
        }
      }
    }
    checkDecimals()
  }, [token0?.address, token1?.address])

  const calculateLiquidity = (amount0: bigint, amount1: bigint) => {
    try {
      const sqrtPriceX96 = BigNumber.from(currentPrice.toString())
      const sqrtPriceAX96 = getSqrtPriceAtTick(tickLower)
      const sqrtPriceBX96 = getSqrtPriceAtTick(tickUpper)

      let liquidity: BigNumber
      
      if (sqrtPriceX96.lte(sqrtPriceAX96)) {
        // Current price is below range
        liquidity = getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, BigNumber.from(amount0.toString()))
      } else if (sqrtPriceX96.gte(sqrtPriceBX96)) {
        // Current price is above range
        liquidity = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, BigNumber.from(amount1.toString()))
      } else {
        // Current price is in range
        const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, BigNumber.from(amount0.toString()))
        const liquidity1 = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, BigNumber.from(amount1.toString()))
        liquidity = liquidity0.lt(liquidity1) ? liquidity0 : liquidity1
      }
      
      return BigInt(liquidity.toString())
    } catch (error) {
      console.error('Error calculating liquidity:', error)
      return 0n
    }
  }

  const updateToken1FromToken0 = (amount: string) => {
    if (!token0 || !token1 || !amount) return
    try {
      const token0Decimals = token0.address === '0x0000000000000000000000000000000000000000' ? 18 : token0.decimals
      const token1Decimals = token1.decimals
      
      // Convert input to proper decimal format
      const amount0 = BigInt(parseFloat(amount) * 10 ** token0Decimals)
      
      // Calculate liquidity
      const liquidity = calculateLiquidity(amount0, 0n)
      
      // Calculate token1 amount based on liquidity
      const sqrtPriceX96 = BigNumber.from(currentPrice.toString())
      const sqrtPriceAX96 = getSqrtPriceAtTick(tickLower)
      const sqrtPriceBX96 = getSqrtPriceAtTick(tickUpper)
      
      const amount1 = getAmount1ForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        BigNumber.from(liquidity.toString())
      )
      
      // Convert back to human readable format
      const formattedAmount = (Number(amount1) / 10 ** token1Decimals).toFixed(token1Decimals)
      onToken1AmountChange(formattedAmount)
    } catch (error) {
      console.error('Error calculating token1 amount:', error)
    }
  }

  const updateToken0FromToken1 = (amount: string) => {
    if (!token0 || !token1 || !amount) return
    try {
      const token0Decimals = token0.address === '0x0000000000000000000000000000000000000000' ? 18 : token0.decimals
      const token1Decimals = token1.decimals
      
      // Convert input to proper decimal format
      const amount1 = BigInt(parseFloat(amount) * 10 ** token1Decimals)
      
      // Calculate liquidity
      const liquidity = calculateLiquidity(0n, amount1)
      
      // Calculate token0 amount based on liquidity
      const sqrtPriceX96 = BigNumber.from(currentPrice.toString())
      const sqrtPriceAX96 = getSqrtPriceAtTick(tickLower)
      const sqrtPriceBX96 = getSqrtPriceAtTick(tickUpper)
      
      const amount0 = getAmount0ForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        BigNumber.from(liquidity.toString())
      )
      
      // Convert back to human readable format
      const formattedAmount = (Number(amount0) / 10 ** token0Decimals).toFixed(token0Decimals)
      onToken0AmountChange(formattedAmount)
    } catch (error) {
      console.error('Error calculating token0 amount:', error)
    }
  }

  const handleToken0Change = (value: string) => {
    onToken0AmountChange(value)
    if (!isUpdating.current) {
      isUpdating.current = true
      updateToken1FromToken0(value)
      isUpdating.current = false
    }
  }

  const handleToken1Change = (value: string) => {
    onToken1AmountChange(value)
    if (!isUpdating.current) {
      isUpdating.current = true
      updateToken0FromToken1(value)
      isUpdating.current = false
    }
  }

  const handlePercentageClick = (tokenIndex: number, percentage: number) => {
    const balance = tokenIndex === 0 ? token0Balance : token1Balance
    const amount = (parseFloat(balance) * percentage / 100).toString()
    if (tokenIndex === 0) {
      handleToken0Change(amount)
    } else {
      handleToken1Change(amount)
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
          onChange={(e) => handleToken0Change(e.target.value)}
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
          onChange={(e) => handleToken1Change(e.target.value)}
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
