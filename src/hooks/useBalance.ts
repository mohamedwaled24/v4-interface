import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { useDebounce } from 'use-debounce'
import { createPublicClient, custom } from 'viem';

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

// Helper to strip chainId prefix from token addresses (e.g., '56_0xabc...' -> '0xabc...')
function cleanAddress(address?: string): string | undefined {
  if (!address) return address;
  if (address.includes('_')) return address.split('_')[1];
  return address;
}

export function useBalance(tokenAddress?: string, chainId?: number, provider?: any) {

  const [debouncedAddress] = useDebounce(tokenAddress, 500);
  const cleanTokenAddress = cleanAddress(debouncedAddress);
  const [balance, setBalance] = useState<string>('')
  const { address } = useAccount()
  // Use the provider if given, otherwise use wagmi's public client
  const publicClient = provider
    ? createPublicClient({ transport: custom(provider) })
    : usePublicClient(chainId ? { chainId } : undefined);

  useEffect(() => {
    if (!publicClient || !address) {
      setBalance('')
      return
    }

    const fetchBalance = async () => {
      try {
        let providerInfo = provider ? provider.constructor?.name : 'undefined';
        let providerChainId = provider && provider.chainId ? provider.chainId : 'n/a';
        console.log('[useBalance] chainId:', chainId, '| provider:', providerInfo, '| provider.chainId:', providerChainId, '| tokenAddress:', cleanTokenAddress, '| userAddress:', address);
        // Handle native ETH
        if (!cleanTokenAddress || cleanTokenAddress === '0x0000000000000000000000000000000000000000') {
          console.log('[useBalance] Fetching native balance for', address, 'on chain', chainId);
          const balance = await publicClient.getBalance({
            address: address as `0x${string}`
          })
          setBalance(formatUnits(balance, 18))
          return
        }

        // Handle ERC20 tokens
        console.log('[useBalance] Fetching ERC20 balance for', cleanTokenAddress, 'for user', address, 'on chain', chainId);
        const [balanceResult, decimalsResult] = await Promise.all([
          publicClient.readContract({
            address: cleanTokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }),
          publicClient.readContract({
            address: cleanTokenAddress as `0x${string}`,
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
  }, [publicClient, debouncedAddress, tokenAddress, address, chainId, provider])

  return { balance }
}
