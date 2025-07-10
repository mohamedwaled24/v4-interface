import { useQuery, gql } from '@apollo/client';

export const ALL_POOLS_QUERY = gql`
  query Pool {
    Pool {
      id
      chainId
      name
      createdAtTimestamp
      createdAtBlockNumber
      token0
      token1
      feeTier
      liquidity
      sqrtPrice
      token0Price
      token1Price
      tick
      tickSpacing
      observationIndex
      volumeToken0
      volumeToken1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      feesUSDUntracked
      txCount
      collectedFeesToken0
      collectedFeesToken1
      collectedFeesUSD
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedETH
      totalValueLockedUSD
      totalValueLockedUSDUntracked
      liquidityProviderCount
      hooks
      db_write_timestamp
    }
  }
`;

export function useAllPools() {
  const { data, loading, error } = useQuery(ALL_POOLS_QUERY);

  return {
    pools: data?.Pool || [],
    loading,
    error,
  };
} 