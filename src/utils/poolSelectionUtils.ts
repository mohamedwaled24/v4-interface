import { BSCPool } from '../hooks/useBSCPools';
import { PoolKey } from '../hooks/useV4Swap';
import { generatePoolId, getPoolInfo } from './stateViewUtils';

/**
 * Fee tiers in order of preference (lower fees preferred)
 */
export const FEE_TIERS = [
  { fee: 100, tickSpacing: 1, label: '0.01%' },
  { fee: 500, tickSpacing: 10, label: '0.05%' },
  { fee: 3000, tickSpacing: 60, label: '0.3%' },
  { fee: 10000, tickSpacing: 200, label: '1%' },
];

/**
 * Find the best pool for a given token pair based on highest liquidity
 * @param pools Array of pools (generic type)
 * @param token0Address First token address
 * @param token1Address Second token address
 * @param chainId Network chain ID
 * @param rpcUrl RPC URL for the network
 * @returns Best pool or null if no pool found
 */
export async function findBestPoolByLiquidity(
  pools: any[],
  token0Address: string,
  token1Address: string,
  chainId: number,
  rpcUrl: string
): Promise<any | null> {
  const token0 = token0Address.toLowerCase();
  const token1 = token1Address.toLowerCase();

  // Find all pools that match the token pair (in both directions)
  const matchingPools = pools.filter(pool => {
    const poolToken0 = pool.token0.toLowerCase();
    const poolToken1 = pool.token1.toLowerCase();
    return (
      (poolToken0 === token0 && poolToken1 === token1) ||
      (poolToken0 === token1 && poolToken1 === token0)
    );
  });

  if (matchingPools.length === 0) {
    return null;
  }

  // Fetch liquidity for each pool
  const poolsWithLiquidity = await Promise.all(
    matchingPools.map(async (pool) => {
      const poolKey = convertPoolToPoolKey(pool);
      const poolId = generatePoolId(poolKey);
      try {
        const info = await getPoolInfo(chainId, rpcUrl, poolId);
        return { pool, liquidity: BigInt(info.liquidity || '0') };
      } catch {
        return { pool, liquidity: BigInt(0) };
      }
    })
  );

  // Sort by liquidity descending
  poolsWithLiquidity.sort((a, b) => (b.liquidity > a.liquidity ? 1 : b.liquidity < a.liquidity ? -1 : 0));

  // Return the pool with the highest liquidity
  return poolsWithLiquidity[0]?.pool || null;
}

/**
 * Find the best pool for a given token pair based on fee preferences
 * @param pools Array of BSC pools
 * @param token0Address First token address
 * @param token1Address Second token address
 * @returns Best pool or null if no pool found
 */
export function findBestPool(
  pools: BSCPool[],
  token0Address: string,
  token1Address: string
): BSCPool | null {
  // Normalize addresses for comparison
  const token0 = token0Address.toLowerCase();
  const token1 = token1Address.toLowerCase();

  // Find all pools that match the token pair (in both directions)
  const matchingPools = pools.filter(pool => {
    const poolToken0 = pool.currency0.toLowerCase();
    const poolToken1 = pool.currency1.toLowerCase();
    
    return (
      (poolToken0 === token0 && poolToken1 === token1) ||
      (poolToken0 === token1 && poolToken1 === token0)
    );
  });

  if (matchingPools.length === 0) {
    return null;
  }

  // Sort pools by fee preference (lower fees first)
  const sortedPools = matchingPools.sort((a, b) => {
    const feeA = typeof a.fee === 'string' ? parseInt(a.fee) : a.fee;
    const feeB = typeof b.fee === 'string' ? parseInt(b.fee) : b.fee;
    return feeA - feeB;
  });

  // Return the pool with the lowest fee
  return sortedPools[0];
}

/**
 * Convert BSCPool to PoolKey format in canonical order (lowest address first)
 * @param pool BSC pool data
 * @param token0Address First token address (for ordering)
 * @param token1Address Second token address (for ordering)
 * @returns PoolKey object
 */
export function convertBSCPoolToPoolKey(
  pool: BSCPool,
  token0Address: string,
  token1Address: string
): PoolKey {
  // Canonical order: lowest address first
  const addr0 = pool.currency0.toLowerCase();
  const addr1 = pool.currency1.toLowerCase();
  if (addr0 < addr1) {
    return {
      currency0: pool.currency0,
      currency1: pool.currency1,
      fee: typeof pool.fee === 'string' ? parseInt(pool.fee) : pool.fee,
      tickSpacing: typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : pool.tickSpacing,
      hooks: pool.hooks,
    };
  } else {
    return {
      currency0: pool.currency1,
      currency1: pool.currency0,
      fee: typeof pool.fee === 'string' ? parseInt(pool.fee) : pool.fee,
      tickSpacing: typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : pool.tickSpacing,
      hooks: pool.hooks,
    };
  }
}

/**
 * Convert generic Pool to PoolKey format in canonical order (lowest address first)
 * @param pool Pool data from useAllPools
 * @returns PoolKey object
 */
export function convertPoolToPoolKey(pool: any): PoolKey {
  // Canonical order: lowest address first
  const addr0 = pool.token0.split('_')[1]?.toLowerCase();
  const addr1 = pool.token1.split('_')[1]?.toLowerCase();
  const fee = typeof pool.feeTier === 'string' ? parseInt(pool.feeTier) : pool.feeTier;
  const tickSpacing = typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : pool.tickSpacing;
  if (addr0 < addr1) {
    return {
      currency0: pool.token0.split('_')[1],
      currency1: pool.token1.split('_')[1],
      fee,
      tickSpacing,
      hooks: pool.hooks,
    };
  } else {
    return {
      currency0: pool.token1.split('_')[1],
      currency1: pool.token0.split('_')[1],
      fee,
      tickSpacing,
      hooks: pool.hooks,
    };
  }
}

/**
 * Get pool information for display
 * @param pool BSC pool data
 * @returns Formatted pool information
 */
export function getPoolDisplayInfo(pool: BSCPool) {
  const fee = typeof pool.fee === 'string' ? parseInt(pool.fee) : pool.fee;
  const tickSpacing = typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : pool.tickSpacing;
  
  return {
    feePercentage: (fee / 10000).toFixed(2) + '%',
    tickSpacing,
    hooks: pool.hooks,
    currency0: pool.currency0,
    currency1: pool.currency1,
  };
}

/**
 * Check if a pool is a vanilla pool (no hooks)
 * @param pool BSC pool data
 * @returns True if pool is vanilla
 */
export function isVanillaPool(pool: BSCPool): boolean {
  return pool.hooks === '0x0000000000000000000000000000000000000000';
}

/**
 * Get available pools for a token pair with their details
 * @param pools Array of BSC pools
 * @param token0Address First token address
 * @param token1Address Second token address
 * @returns Array of available pools with details
 */
export function getAvailablePools(
  pools: BSCPool[],
  token0Address: string,
  token1Address: string
): Array<BSCPool & { displayInfo: ReturnType<typeof getPoolDisplayInfo> }> {
  const token0 = token0Address.toLowerCase();
  const token1 = token1Address.toLowerCase();

  const matchingPools = pools.filter(pool => {
    const poolToken0 = pool.currency0.toLowerCase();
    const poolToken1 = pool.currency1.toLowerCase();
    
    return (
      (poolToken0 === token0 && poolToken1 === token1) ||
      (poolToken0 === token1 && poolToken1 === token0)
    );
  });

  return matchingPools.map(pool => ({
    ...pool,
    displayInfo: getPoolDisplayInfo(pool),
  }));
} 