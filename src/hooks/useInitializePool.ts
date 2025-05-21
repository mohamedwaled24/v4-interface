import { useState } from 'react'
import { Token } from '../types'
import { FeeOption } from '../components/CreatePool/FeeSelector'
import { decodeEventLog } from 'viem'
import { useWallet } from './useWallet'

// PoolManager ABI (only the initialize function and its event)
const POOL_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'currency0', type: 'address' },
          { internalType: 'address', name: 'currency1', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'int24', name: 'tickSpacing', type: 'int24' },
          { internalType: 'address', name: 'hooks', type: 'address' },
        ],
        internalType: 'struct PoolKey',
        name: 'key',
        type: 'tuple',
      },
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
    ],
    name: 'initialize',
    outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: true, name: 'currency0', type: 'address' },
      { indexed: true, name: 'currency1', type: 'address' },
      { indexed: false, name: 'fee', type: 'uint24' },
      { indexed: false, name: 'tickSpacing', type: 'int24' },
      { indexed: false, name: 'hooks', type: 'address' },
      { indexed: false, name: 'sqrtPriceX96', type: 'uint160' },
      { indexed: false, name: 'tick', type: 'int24' }
    ],
    name: 'Initialize',
    type: 'event'
  }
] as const;

interface InitializePoolState {
  token0?: Token
  token1?: Token
  fee?: FeeOption
  hookAddress: string
  sqrtPriceX96?: bigint
}

interface InitializePoolValidation {
  token0Error?: string
  token1Error?: string
  hookError?: string
  priceError?: string
  feeError?: string
}

interface InitializePoolResult {
  success: boolean
  error?: string
  poolId?: string
}

export function useInitializePool() {
  const { publicClient, walletClient, network, address } = useWallet()
  const [isInitializing, setIsInitializing] = useState(false)
  const [poolState, setPoolState] = useState<InitializePoolState>({
    hookAddress: "0x0000000000000000000000000000000000000000",  // Initialize with zero address
    sqrtPriceX96: BigInt("79228162514264337593543950336"), // Default initial price (2^96)
  })
  
  const [validation, setValidation] = useState<InitializePoolValidation>({})

  const validatePool = (state: InitializePoolState): InitializePoolValidation => {
    console.log('validatePool called with poolState:', state)
    const errors: InitializePoolValidation = {}

    // Validate tokens
    if (!state.token0) {
      errors.token0Error = 'Token 0 is required'
    }
    if (!state.token1) {
      errors.token1Error = 'Token 1 is required'
    }

    // Validate hook address if provided
    if (state.hookAddress && state.hookAddress !== "0x0000000000000000000000000000000000000000") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(state.hookAddress)) {
        errors.hookError = 'Invalid hook address'
      }
    }

    // Validate sqrtPriceX96
    if (!state.sqrtPriceX96) {
      errors.priceError = 'Initial price is required'
    } else {
      // Additional validation for sqrtPriceX96 if needed
      const sqrtPriceX96 = state.sqrtPriceX96
      if (sqrtPriceX96 === 0n) {
        errors.priceError = 'Initial price cannot be zero'
      }
    }

    return errors
  }

  const initializePool = async (): Promise<InitializePoolResult> => {
    if (!network?.poolManagerAddress || !walletClient || !publicClient) {
      return { success: false, error: 'Network not configured properly' }
    }

    // Validate pool state
    const validationErrors = validatePool(poolState)
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation errors:', validationErrors)
      return { success: false, error: 'Invalid pool parameters' }
    }

    if (!poolState.token0 || !poolState.token1 || !poolState.fee || !poolState.sqrtPriceX96) {
      return { success: false, error: 'Missing required parameters' }
    }

    setIsInitializing(true)

    try {
      // Sort tokens to match Uniswap's ordering
      const [sortedToken0, sortedToken1] = poolState.token0!.address.toLowerCase() < poolState.token1!.address.toLowerCase()
        ? [poolState.token0!, poolState.token1!] 
        : [poolState.token1!, poolState.token0!]

      // Create the pool key
      const poolKey = {
        currency0: sortedToken0.address as `0x${string}`,
        currency1: sortedToken1.address as `0x${string}`,
        fee: BigInt(poolState.fee.fee),
        tickSpacing: BigInt(poolState.fee.tickSpacing),
        hooks: poolState.hookAddress as `0x${string}`
      }

      // Initialize the pool
      const hash = await walletClient.writeContract({
        address: network.poolManagerAddress as `0x${string}`,
        abi: POOL_MANAGER_ABI,
        functionName: 'initialize',
        args: [poolKey, poolState.sqrtPriceX96],
        account: address as `0x${string}`,
        chain: {
          id: network.id,
          name: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: network.rpcUrls,
          blockExplorers: network.blockExplorers,
        },
      })

      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Get the pool address from the logs using the ABI
      const initializeEvent = receipt.logs.find(
        (log: { topics: string[] }) => {
          // The actual event topic from the logs
          const eventTopic = '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438'
          console.log('Looking for Initialize event:', {
            eventTopic,
            logTopics: log.topics,
            matches: log.topics[0] === eventTopic,
            allLogs: receipt.logs.map((l: { topics: string[], data: string }) => ({
              topic: l.topics[0],
              data: l.data
            }))
          })
          return log.topics[0] === eventTopic
        }
      )

      if (!initializeEvent) {
        console.error('Initialize event not found. Transaction receipt:', receipt)
        throw new Error('Initialize event not found in transaction logs. Transaction may have reverted.')
      }

      // Decode the event data
      try {
        // Get the event definition from the ABI
        const event = POOL_MANAGER_ABI.find(item => item.type === 'event' && item.name === 'Initialize')
        if (!event) {
          throw new Error('Initialize event not found in ABI')
        }

        // Decode the event data using viem's decodeEventLog
        const decodedEvent = decodeEventLog({
          abi: POOL_MANAGER_ABI,
          data: initializeEvent.data,
          topics: initializeEvent.topics,
        })

        console.log('Successfully decoded Initialize event:', decodedEvent)

        // The pool ID is in the event args
        return {
          success: true,
          poolId: decodedEvent.args.id,
        }
      } catch (decodeError) {
        console.error('Error decoding Initialize event:', decodeError)
        throw new Error('Failed to decode Initialize event data')
      }
    } catch (error: any) {
      console.error('Error initializing pool:', error)
      
      // Try to extract the revert reason
      let errorMessage = 'Failed to initialize pool'
      if (error.message) {
        // Check for common revert reasons
        if (error.message.includes('PoolAlreadyInitialized')) {
          errorMessage = 'Pool already initialized'
        } else if (error.message.includes('InvalidPrice')) {
          errorMessage = 'Invalid initial price'
        } else if (error.message.includes('InvalidTokens')) {
          errorMessage = 'Invalid token pair'
        } else if (error.message.includes('InvalidFee')) {
          errorMessage = 'Invalid fee tier'
        } else if (error.message.includes('Initialize event not found')) {
          errorMessage = 'Transaction may have reverted. Please check the transaction status.'
        } else {
          // Try to extract the revert reason from the error message
          const revertMatch = error.message.match(/reason: (.*?)(?:\n|$)/)
          if (revertMatch) {
            errorMessage = revertMatch[1]
          }

          // Try to extract method ID and call data
          const methodIdMatch = error.message.match(/function: (.*?)(?:\n|$)/)
          const argsMatch = error.message.match(/args: (.*?)(?:\n|$)/)
          
          if (methodIdMatch || argsMatch) {
            console.log('Contract Call Details:', {
              methodId: methodIdMatch ? methodIdMatch[1] : 'Unknown',
              args: argsMatch ? argsMatch[1] : 'Unknown'
            })
          }
        }
      }

      return { 
        success: false, 
        error: errorMessage,
      }
    } finally {
      setIsInitializing(false)
    }
  }

  const updateToken0 = (token: Token) => {
    setPoolState(prev => ({ ...prev, token0: token }))
    setValidation(prev => ({ ...prev, token0Error: undefined }))
  }

  const updateToken1 = (token: Token) => {
    setPoolState(prev => ({ ...prev, token1: token }))
    setValidation(prev => ({ ...prev, token1Error: undefined }))
  }

  const updateFee = (fee: FeeOption) => {
    setPoolState(prev => ({ ...prev, fee }))
  }

  const updateHook = (address: string) => {
    setPoolState(prev => ({ ...prev, hookAddress: address }))
    setValidation(prev => ({ ...prev, hookError: undefined }))
  }

  const updateSqrtPriceX96 = async (price: bigint) => {
    console.log('updateSqrtPriceX96 called with price:', price)
    setPoolState(prev => {
      const newState = { ...prev, sqrtPriceX96: price }
      console.log('New poolState after update:', newState)
      return newState
    })
  }

  return {
    poolState,
    validation,
    isInitializing,
    initializePool,
    updateToken0,
    updateToken1,
    updateFee,
    updateHook,
    updateSqrtPriceX96,
    validatePool
  }
} 