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
 * Check if a pool exists using the StateView contract
 * @param chainId Chain ID
 * @param rpcUrl RPC URL
 * @param poolId Pool ID
 * @returns Object with exists flag and poolId
 */
export const checkPoolExistsWithStateView = async (
  chainId: number, 
  rpcUrl: string, 
  poolId: `0x${string}`
): Promise<{ exists: boolean; poolId: `0x${string}` | null }> => {
  try {
    if (!CONTRACTS[chainId as keyof typeof CONTRACTS]) {
      console.error('Unsupported chain ID:', chainId);
      return { exists: false, poolId: null };
    }

    console.log(`Checking if pool with ID ${poolId} exists using StateView contract on network ${chainId}`);
    
    const publicClient = createPublicClient({
      transport: http(rpcUrl)
    });
    
    const stateViewAddress = CONTRACTS[chainId as keyof typeof CONTRACTS].StateView as `0x${string}`;
    
    try {
      // Try to get the pool's slot0 data using the StateView contract
      const slot0Data = await publicClient.readContract({
        address: stateViewAddress,
        abi: stateViewABI,
        functionName: 'getSlot0',
        args: [poolId]
      });
      
      console.log('Pool slot0 data:', slot0Data);
      return { exists: true, poolId };
    } catch (error) {
      console.log('StateView getSlot0 check error:', error);
      
      // If getSlot0 fails, try getLiquidity as a fallback
      try {
        const liquidity = await publicClient.readContract({
          address: stateViewAddress,
          abi: stateViewABI,
          functionName: 'getLiquidity',
          args: [poolId]
        });
        
        console.log('Pool liquidity:', liquidity);
        return { exists: true, poolId };
      } catch (error2) {
        console.log('StateView getLiquidity check error:', error2);
        
        // If both methods fail, the pool likely doesn't exist
        if (error2.message && (
          error2.message.includes('PoolNotInitialized') || 
          error2.message.includes('Pool not initialized') ||
          error2.message.includes('execution reverted')
        )) {
          console.log(`Pool with ID ${poolId} does not exist (not initialized)`);
          return { exists: false, poolId };
        }
        
        console.log('Unexpected error checking pool existence, assuming pool does not exist');
        return { exists: false, poolId };
      }
    }
  } catch (error) {
    console.error('Error checking if pool exists:', error);
    return { exists: false, poolId: null };
  }
};

/**
 * Get pool information using the StateView contract
 * @param chainId Chain ID
 * @param rpcUrl RPC URL
 * @param poolId Pool ID
 * @returns Pool information or null if pool doesn't exist
 */
export const getPoolInfo = async (chainId: number, rpcUrl: string, poolId: `0x${string}`) => {
  try {
    const stateView = getStateViewContract(chainId, rpcUrl);
    
    // Get slot0 data
    const slot0Data = await stateView.read.getSlot0([poolId]);
    
    // Get liquidity
    const liquidity = await stateView.read.getLiquidity([poolId]);
    
    return {
      sqrtPriceX96: slot0Data[0].toString(),
      tick: Number(slot0Data[1]),
      protocolFee: Number(slot0Data[2]),
      lpFee: Number(slot0Data[3]),
      liquidity: liquidity.toString()
    };
  } catch (error) {
    console.error('Error getting pool info:', error);
    return null;
  }
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
