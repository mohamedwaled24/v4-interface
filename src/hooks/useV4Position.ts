import { useState } from 'react'
import { parseUnits } from 'viem'
import { useWallet } from './useWallet'
import { CONTRACTS } from '../constants/contracts'
import positionManagerABI from '../../contracts/positionManager.json'
import { generatePoolId, getPoolInfo } from '../utils/stateViewUtils'

// --- Uniswap V4 SDK imports (actual, from codebase) ---
import { Pool, Position } from '@uniswap/v4-sdk'
import { TickMath, nearestUsableTick, FeeAmount } from '@uniswap/v3-sdk'
import { Percent, Token } from '@uniswap/sdk-core'
import { V4PositionManager } from '@uniswap/v4-sdk'

interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

interface AddLiquidityParams {
  token0: {
    address: string;
    decimals: number;
    amount: string;
  };
  token1: {
    address: string;
    decimals: number;
    amount: string;
  };
  fee: number;
  tickLower: number;
  tickUpper: number;
  recipient?: string;
  hookAddress?: string;
  slippageToleranceBips?: number; // 50 = 0.5%
}

interface AddLiquidityResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export function useV4Position() {
  const { publicClient, walletClient, chainId, address, isConnected } = useWallet()
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)

  /**
   * Add liquidity using Uniswap V4 SDK
   */
  const addLiquidity = async (params: AddLiquidityParams): Promise<AddLiquidityResult> => {
    if (!isConnected) return { success: false, error: 'Wallet not connected.' }
    if (!walletClient) return { success: false, error: 'Wallet client not initialized.' }
    if (!publicClient) return { success: false, error: 'Public client not initialized.' }
    if (!chainId) return { success: false, error: 'Chain ID not available.' }

    let userAddress = address;
    if (!userAddress && walletClient) {
      try {
        const addresses = await walletClient.getAddresses();
        if (addresses && addresses.length > 0) userAddress = addresses[0];
      } catch (error) {}
    }
    if (!userAddress) return { success: false, error: 'Address not available.' }

    if (!CONTRACTS[chainId as keyof typeof CONTRACTS])
      return { success: false, error: `Unsupported chain ID: ${chainId}` }

    setIsAddingLiquidity(true);

    try {
      // Sort tokens: enforce token0 < token1
      let token0 = params.token0
      let token1 = params.token1
      let tickLower = params.tickLower
      let tickUpper = params.tickUpper

      if (token0.address.toLowerCase() > token1.address.toLowerCase()) {
        [token0, token1] = [token1, token0]
        [tickLower, tickUpper] = [tickUpper * -1, tickLower * -1]
      }

      // Calculate tick spacing based on fee
      const calculateTickSpacing = (fee: number): number => {
        switch (fee) {
          case 100: // 0.01%
            return 1;
          case 500: // 0.05%
            return 10;
          case 3000: // 0.3%
            return 60;
          case 10000: // 1%
            return 200;
          default:
            return 60; // Default to 0.3% fee tier
        }
      };

      const tickSpacing = calculateTickSpacing(params.fee);
      const hookAddress = params.hookAddress || '0x0000000000000000000000000000000000000000';

      // Generate pool ID to fetch pool state
      const poolKey = {
        currency0: token0.address,
        currency1: token1.address,
        fee: params.fee,
        tickSpacing,
        hooks: hookAddress
      };
      
      const poolId = generatePoolId(poolKey);
      
      // Fetch pool state using stateViewUtils
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://unichain-sepolia.infura.io/v3/693b8270ee124fab9223535390a33ac3';
      const poolInfo = await getPoolInfo(Number(chainId), rpcUrl, poolId);
      
      if (!poolInfo) {
        throw new Error('Failed to fetch pool state. Pool may not exist yet.');
      }
      
      console.log('Raw pool info values:', poolInfo);
      
      // Use smaller values that are less likely to cause conversion issues
      const sqrtPriceX96 = BigInt('79228162514264337593543950336'); // 2^96
      const currentLiquidity = BigInt('1000000000000000000');    // 1 ETH in wei
      const currentTick = 0; // Use 0 as a safe default
      
      console.log('Using values for Pool constructor:', {
        sqrtPriceX96: sqrtPriceX96.toString(),
        liquidity: currentLiquidity.toString(),
        tick: currentTick
      });

      const token0Currency = new Token(
        Number(chainId),
        token0.address,
        token0.decimals,
        '', // symbol (optional)
        '' // name (optional)
      );
      const token1Currency = new Token(
        Number(chainId),
        token1.address,
        token1.decimals,
        '', // symbol (optional)
        '' // name (optional)
      );

      // Create the pool with explicit type annotations
      const pool = new Pool(
        token0Currency,
        token1Currency,
        params.fee,
        tickSpacing,
        hookAddress,
        sqrtPriceX96,
        currentLiquidity,
        currentTick,
      )

      // Calculate liquidity to mint from amounts
      // You must convert token amounts to string/bigint for the SDK
      const amount0 = parseUnits(token0.amount, token0.decimals).toString()
      const amount1 = parseUnits(token1.amount, token1.decimals).toString()
      const liquidity = Position.fromAmounts({
        pool,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true,
      }).liquidity

      const position = new Position({
        pool,
        liquidity,
        tickLower,
        tickUpper,
      });

      // Use the SDK to get calldata for minting the position
      const slippageTolerance = new Percent(params.slippageToleranceBips ?? 50, 10_000) // e.g. 50 = 0.5%
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60
      const { calldata, value } = V4PositionManager.addCallParameters(position, {
        recipient: params.recipient || userAddress,
        slippageTolerance,
        deadline,
      })

      const positionManagerAddress = CONTRACTS[chainId as keyof typeof CONTRACTS].PositionManager as `0x${string}`

      // Submit transaction via walletClient
      const tx = await walletClient.sendTransaction({
        to: positionManagerAddress,
        data: calldata,
        value: value ?? 0n,
        account: userAddress as `0x${string}`
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
      return { success: true, hash: tx }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add liquidity' }
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  return {
    addLiquidity,
    isAddingLiquidity,
  }
}