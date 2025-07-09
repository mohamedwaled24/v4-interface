import { useQuery, gql } from '@apollo/client';

export const ALL_POOLS_QUERY = gql`
  query Pool {
  Pool {
    id
    chainId
    token0
    token1
    feeTier
    tickSpacing
    hooks
    liquidity
    tick
    sqrtPrice
    name
    createdAtTimestamp
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