import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useNetworkQuery } from './useNetworkQuery';
import { GRAPHQL_ENDPOINTS } from '../config/graphql';

// GraphQL query for BSC pools (for reference)
const BSC_POOLS_QUERY = gql`
  query PoolManager_Initialize {
    PoolManager_Initialize {
      currency0
      currency1
      db_write_timestamp
      event_id
      fee
      hooks
      id
      sqrtPriceX96
      tick
      tickSpacing
    }
  }
`;

// Types for the pool data
export interface BSCPool {
  currency0: string;
  currency1: string;
  fee: string | number;
  hooks: string;
  sqrtPriceX96: string;
  tickSpacing: string | number;
  // Optional fields that might not be present in the response
  db_write_timestamp?: string;
  event_id?: string;
  id?: string;
  tick?: number;
  chainId?: number; // Add chainId for filtering
}

interface BSCPoolsData {
  Pool: BSCPool[];
}

interface BSCPoolsResult {
  pools: BSCPool[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook to fetch BSC pools using the local server endpoint
 */
export function useBSCPools(): BSCPoolsResult {
  const [pools, setPools] = useState<BSCPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchPools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(GRAPHQL_ENDPOINTS[56], {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // Handle the nested PoolManager_Initialize structure
      const poolsData = result.PoolManager_Initialize || [];
      setPools(poolsData);
    } catch (err) {
      console.error('Error fetching BSC pools:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const refetch = () => {
    fetchPools();
  };

  return {
    pools,
    loading,
    error,
    refetch,
  };
}

/**
 * Alternative function to fetch BSC pools without using the hook
 * Useful for one-time fetches or server-side operations
 */
export async function fetchBSCPools(): Promise<BSCPool[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINTS[56], {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Handle the nested PoolManager_Initialize structure
    return result.PoolManager_Initialize || [];
  } catch (error) {
    console.error('Error fetching BSC pools:', error);
    throw error;
  }
}

/**
 * Utility function to format pool data for display
 */
export function formatPoolData(pool: BSCPool) {
  // Generate a unique ID if not provided
  const poolId = pool.id || `${pool.currency0}-${pool.currency1}-${pool.fee}`;
  
  return {
    id: poolId,
    token0: pool.currency0 || 'N/A',
    token1: pool.currency1 || 'N/A',
    fee: typeof pool.fee === 'string' ? parseInt(pool.fee) : (pool.fee || 0),
    tickSpacing: typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : (pool.tickSpacing || 0),
    currentTick: pool.tick || 0,
    sqrtPriceX96: pool.sqrtPriceX96 || '0',
    hooks: pool.hooks || '0x0000000000000000000000000000000000000000',
    timestamp: pool.db_write_timestamp ? new Date(pool.db_write_timestamp).toLocaleString() : 'N/A',
    eventId: pool.event_id || 'N/A',
  };
} 