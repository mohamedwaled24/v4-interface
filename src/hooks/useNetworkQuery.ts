import { useQuery, ApolloQueryResult } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import { createNetworkClient } from '../apollo/client';

interface UseNetworkQueryOptions {
  networkId: number;
  skip?: boolean;
  pollInterval?: number;
}

export function useNetworkQuery<TData = any, TVariables = any>(
  query: DocumentNode,
  options: UseNetworkQueryOptions & {
    variables?: TVariables;
  }
) {
  const { networkId, ...queryOptions } = options;
  
  // Memoize the network-specific client to prevent infinite re-renders
  const networkClient = useMemo(() => {
    return createNetworkClient(networkId);
  }, [networkId]);
  
  // Use the network-specific client for the query
  return useQuery<TData, TVariables>(query, {
    client: networkClient,
    ...queryOptions,
  });
} 