import { useState, useEffect } from 'react';
import { formatUnits, getAddress } from 'viem';
import { ERC20_ABI } from '../../contracts/ERC20_ABI';

// Enhanced native token detection
const isNativeToken = (tokenAddress: string): boolean => {
  if (!tokenAddress) return false;
  const addr = tokenAddress.toLowerCase();
  return addr === '0x0000000000000000000000000000000000000000' ||
         addr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
         addr === 'eth' ||
         addr === '0xeee';
};

// Normalize token address
const normalizeTokenAddress = (tokenAddress: string): string => {
  if (!tokenAddress) return '0x0000000000000000000000000000000000000000';
  
  if (isNativeToken(tokenAddress)) {
    return '0x0000000000000000000000000000000000000000';
  }
  
  try {
    return getAddress(tokenAddress);
  } catch {
    return tokenAddress;
  }
};

/**
 * ✅ FIXED: Hook to get token balance using publicClient for reading and walletClient for account info
 * @param tokenAddress Token contract address (or native token identifier)
 * @param chainId Chain ID
 * @param publicClient Public client for reading contracts
 * @param walletClient Wallet client for account info
 * @returns Token balance formatted as string
 */
export function useBalance(
  tokenAddress: string | undefined,
  chainId: number | undefined,
  publicClient: any, // ✅ Use publicClient for reading
  walletClient: any  // ✅ Use walletClient for account info
) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      // Reset state
      if (!tokenAddress || !chainId || !publicClient || !walletClient?.account) {
        setBalance('0');
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userAddress = walletClient.account.address;
        const normalizedAddress = normalizeTokenAddress(tokenAddress);

        let balanceWei: bigint;
        let decimals: number;

        if (isNativeToken(tokenAddress)) {
          // ✅ Get native token balance using publicClient
          console.log('📊 Fetching native token balance for:', userAddress);
          
          balanceWei = await publicClient.getBalance({
            address: userAddress,
          });
          decimals = 18; // Native token (ETH) has 18 decimals
          
          console.log('💰 Native balance (wei):', balanceWei.toString());
        } else {
          // ✅ Get ERC20 token balance using publicClient
          console.log('📊 Fetching ERC20 balance for:', {
            token: normalizedAddress,
            user: userAddress
          });

          try {
            // Get token decimals using publicClient
            decimals = await publicClient.readContract({
              address: normalizedAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'decimals',
            });

            // Get token balance using publicClient
            balanceWei = await publicClient.readContract({
              address: normalizedAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [userAddress],
            });

            console.log('💰 ERC20 balance:', {
              token: normalizedAddress,
              balanceWei: balanceWei.toString(),
              decimals
            });
          } catch (contractError) {
            console.error('Failed to read ERC20 contract:', contractError);
            throw new Error('Failed to read token contract');
          }
        }

        if (!cancelled) {
          // Format balance to human readable format
          const formattedBalance = formatUnits(balanceWei, decimals);
          
          // Round to 6 decimal places for display
          const roundedBalance = parseFloat(formattedBalance).toFixed(6);
          const finalBalance = parseFloat(roundedBalance).toString(); // Remove trailing zeros
          
          console.log('✅ Final formatted balance:', {
            wei: balanceWei.toString(),
            formatted: formattedBalance,
            rounded: roundedBalance,
            final: finalBalance
          });

          setBalance(finalBalance);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Balance fetch error:', err);
        
        if (!cancelled) {
          setError(err.message || 'Failed to fetch balance');
          setBalance('0');
          setLoading(false);
        }
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, chainId, publicClient, walletClient]);

  return {
    balance,
    loading,
    error,
    refetch: () => {
      // Trigger a re-fetch by changing a dependency
      setLoading(true);
    }
  };
}