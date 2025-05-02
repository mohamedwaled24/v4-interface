import { useState, useEffect } from 'react'
import { useWallet } from './useWallet'
import { formatUnits } from 'viem'

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const

export function useBalance(tokenAddress?: string) {
  const [balance, setBalance] = useState<string>('')
  const { publicClient, address } = useWallet()

  useEffect(() => {
    if (!publicClient || !address || !tokenAddress) {
      setBalance('')
      return
    }

    const fetchBalance = async () => {
      try {
        const [balanceResult, decimalsResult] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }),
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }),
        ])

        const formattedBalance = formatUnits(
          balanceResult as bigint,
          decimalsResult as number
        )
        setBalance(formattedBalance)
      } catch (err) {
        console.error('Error fetching balance:', err)
        setBalance('')
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 15000) // Refresh every 15 seconds

    return () => clearInterval(interval)
  }, [publicClient, address, tokenAddress])

  return { balance }
}
