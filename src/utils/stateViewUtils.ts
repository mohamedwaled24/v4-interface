import { 
  createPublicClient, 
  http, 
  getContract, 
  encodeAbiParameters, 
  keccak256, 
  Hex, 
} from 'viem';
import { CONTRACTS } from '../constants/contracts';
import stateViewABI from '../../contracts/stateView.json';

// Define interfaces for pool and position
interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

interface PositionInfo {
  owner: string;
  tickLower: number;
  tickUpper: number;
  salt: Hex;
}

interface PoolInfoResult {
  exists: boolean;
  isInitialized: boolean;
  sqrtPriceX96: string;
  tick: number;
  protocolFee: number;
  lpFee: number;
  liquidity: string;
}

/**
 * Generate a pool ID from pool parameters
 * @param poolKey Pool parameters
 * @returns Pool ID as a hex string
 */
export const generatePoolId = (poolKey: PoolKey): `0x${string}` => {
  const encodedPoolKey = encodeAbiParameters(
    [
      { name: 'currency0', type: 'address' },
      { name: 'currency1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'hooks', type: 'address' }
    ],
    [
      poolKey.currency0 as `0x${string}`,
      poolKey.currency1 as `0x${string}`,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks as `0x${string}`
    ]
  );

  return keccak256(encodedPoolKey);
};

/**
 * Generate a position ID from position parameters
 * @param poolId Pool ID
 * @param positionInfo Position parameters
 * @returns Position ID as a hex string
 */
export const generatePositionId = (poolId: `0x${string}`, positionInfo: PositionInfo): `0x${string}` => {
  const encodedPositionInfo = encodeAbiParameters(
    [
      { name: 'poolId', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'salt', type: 'bytes32' },
    ],
    [
      poolId,
      positionInfo.owner as `0x${string}`,
      positionInfo.tickLower,
      positionInfo.tickUpper,
      positionInfo.salt,
    ]
  );

  return keccak256(encodedPositionInfo);
};

/**
 * Create a StateView contract instance
 * @param chainId Chain ID
 * @param rpcUrl RPC URL
 * @returns StateView contract instance
 */
export const getStateViewContract = (chainId: number, rpcUrl: string) => {
  if (!CONTRACTS[chainId as keyof typeof CONTRACTS]) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const publicClient = createPublicClient({
    transport: http(rpcUrl)
  });

  return getContract({
    address: CONTRACTS[chainId as keyof typeof CONTRACTS].StateView as `0x${string}`,
    abi: stateViewABI,
    client: publicClient
  });
};

/**
 * Get pool information and existence status using the StateView contract
 * @param chainId Chain ID
 * @param rpcUrl RPC URL
 * @param poolId Pool ID
 * @returns Pool information with existence and initialization status
 */
export const getPoolInfo = async (chainId: number, rpcUrl: string, poolId: `0x${string}`): Promise<PoolInfoResult> => {
  try {
    const stateView = getStateViewContract(chainId, rpcUrl);
    
    console.log(`Checking pool info for ID: ${poolId}`);
    
    // Try to get slot0 data and liquidity
    const [slot0Data, liquidity] = await Promise.all([
      stateView.read.getSlot0([poolId]),
      stateView.read.getLiquidity([poolId])
    ]);
    
    console.log('Pool slot0 data:', slot0Data);
    console.log('Pool liquidity:', liquidity);
    
    // Extract values from slot0Data
    const sqrtPriceX96 = slot0Data[0];
    const tick = Number(slot0Data[1]);
    const protocolFee = Number(slot0Data[2]);
    const lpFee = Number(slot0Data[3]);
    
    // Determine pool status based on actual values
    const isInitialized = sqrtPriceX96 !== 0n || liquidity > 0n;
    
    console.log(`Pool exists: true, isInitialized: ${isInitialized}`);
    
    return {
      exists: true,
      isInitialized,
      sqrtPriceX96: sqrtPriceX96.toString(),
      tick,
      protocolFee,
      lpFee,
      liquidity: liquidity.toString()
    };
    
  } catch (error) {
    console.error('Error getting pool info:', error);
    console.log('Pool does not exist');
    
    // Return default values indicating pool doesn't exist
    return {
      exists: false,
      isInitialized: false,
      sqrtPriceX96: "0",
      tick: 0,
      protocolFee: 0,
      lpFee: 0,
      liquidity: "0"
    };
  }
};

/**
 * Check if a pool needs to be created
 * @param poolInfo Pool information from getPoolInfo
 * @returns True if pool needs to be created
 */
export const needsPoolCreation = (poolInfo: PoolInfoResult): boolean => {
  return !poolInfo.exists;
};

/**
 * Check if a pool needs to be initialized
 * @param poolInfo Pool information from getPoolInfo
 * @returns True if pool exists but needs initialization
 */
export const needsPoolInitialization = (poolInfo: PoolInfoResult): boolean => {
  return poolInfo.exists && !poolInfo.isInitialized;
};

/**
 * Check if a pool is ready for liquidity provision
 * @param poolInfo Pool information from getPoolInfo
 * @returns True if pool is ready
 */
export const isPoolReady = (poolInfo: PoolInfoResult): boolean => {
  return poolInfo.exists && poolInfo.isInitialized;
};

/**
 * Get position information using the StateView contract
 * @param chainId Chain ID
 * @param rpcUrl RPC URL
 * @param poolId Pool ID
 * @param positionId Position ID
 * @returns Position information or null if position doesn't exist
 */
export const getPositionInfo = async (
  chainId: number, 
  rpcUrl: string, 
  poolId: `0x${string}`, 
  positionId: `0x${string}`
) => {
  try {
    const stateView = getStateViewContract(chainId, rpcUrl);
    
    const positionInfo = await stateView.read.getPositionInfo([poolId, positionId]);
    
    return {
      liquidity: positionInfo[0],
      feeGrowthInside0LastX128: positionInfo[1],
      feeGrowthInside1LastX128: positionInfo[2]
    };
  } catch (error) {
    console.error('Error getting position info:', error);
    return null;
  }
};