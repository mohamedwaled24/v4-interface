import React, { useState } from 'react'
import styled from 'styled-components'
import { useAccount, useWalletClient } from 'wagmi'
import { provideLiquidity } from '../../utils/liquidity'
import { Token } from '../../types'
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

// Calculate liquidity for amounts
function calculateLiquidity(
  amount0: bigint,
  amount1: bigint,
  currentPrice: bigint,
  tickLower: number,
  tickUpper: number
): bigint {
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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const Button = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.colors.accentAction};
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.accentAction};
    opacity: 0.8;
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
    color: ${({ theme }) => theme.colors.neutral3};
    cursor: not-allowed;
  }
`

interface ProvideLiquidityProps {
  token0: Token | null
  token1: Token | null
  token0Amount: string
  token1Amount: string
  tickLower: number
  tickUpper: number
  currentPrice: bigint
  fee: number
  tickSpacing: number
  hooks: string
}

const ProvideLiquidity: React.FC<ProvideLiquidityProps> = ({
  token0,
  token1,
  token0Amount,
  token1Amount,
  tickLower,
  tickUpper,
  currentPrice,
  fee,
  tickSpacing,
  hooks
}) => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleProvideLiquidity = async () => {
    if (!token0 || !token1 || !address || !walletClient) return

    try {
      setIsLoading(true)

      // Convert amounts to proper decimal format
      const token0Decimals = token0.address === '0x0000000000000000000000000000000000000000' ? 18 : token0.decimals
      const token1Decimals = token1.decimals
      
      const amount0Max = BigInt(parseFloat(token0Amount) * 10 ** token0Decimals)
      const amount1Max = BigInt(parseFloat(token1Amount) * 10 ** token1Decimals)

      // Calculate liquidity
      const liquidity = calculateLiquidity(amount0Max, amount1Max, currentPrice, tickLower, tickUpper)

      await provideLiquidity(walletClient, {
        currency0: token0.address as `0x${string}`,
        currency1: token1.address as `0x${string}`,
        fee,
        tickSpacing,
        hooks: hooks as `0x${string}`,
        tickLower,
        tickUpper,
        liquidity,
        amount0Max,
        amount1Max,
        recipient: address as `0x${string}`
      })

      // Handle success
      console.log('Liquidity provided successfully')
    } catch (error) {
      console.error('Error providing liquidity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = !token0 || !token1 || !token0Amount || !token1Amount || isLoading

  return (
    <Container>
      <Button 
        onClick={handleProvideLiquidity}
        disabled={isDisabled}
      >
        {isLoading ? 'Providing Liquidity...' : 'Provide Liquidity'}
      </Button>
    </Container>
  )
}

export default ProvideLiquidity 