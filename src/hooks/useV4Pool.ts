import { useState } from 'react'
import { Token } from '../components/CreatePool/TokenSelector'
import { FeeOption } from '../components/CreatePool/FeeSelector'
import { isAddress } from 'viem'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import poolManagerABI from '../../contracts/poolManager.json'

// V4 Factory ABI (only the create pool function)
const V4_FACTORY_ABI = [
  {
    inputs: [
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'hook', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
    ],
    name: 'createPool',
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

interface V4PoolState {
  token0?: Token
  token1?: Token
  fee?: FeeOption
  hookAddress: string
}

interface V4PoolValidation {
  token0Error?: string
  token1Error?: string
  hookError?: string
}

interface CreatePoolResult {
  success: boolean
  error?: string
  poolId?: string
}

export function useV4Pool() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [isCreating, setIsCreating] = useState(false)
  const [poolState, setPoolState] = useState<V4PoolState>({
    hookAddress: '',
  })
  
  const [validation, setValidation] = useState<V4PoolValidation>({})

  const validatePool = (): boolean => {
    const errors: V4PoolValidation = {}

    if (!poolState.token0?.address || !isAddress(poolState.token0.address)) {
      errors.token0Error = 'Invalid token0 address'
    }
    if (!poolState.token1?.address || !isAddress(poolState.token1.address)) {
      errors.token1Error = 'Invalid token1 address'
    }
    if (poolState.token0?.address && poolState.token1?.address && 
        poolState.token0.address.toLowerCase() === poolState.token1.address.toLowerCase()) {
      errors.token0Error = 'Tokens must be different'
      errors.token1Error = 'Tokens must be different'
    }
    if (!poolState.hookAddress || !isAddress(poolState.hookAddress)) {
      errors.hookError = 'Invalid hook address'
    }

    setValidation(errors)
    return Object.keys(errors).length === 0
  }

  const createPool = async (sqrtPriceX96: bigint): Promise<CreatePoolResult> => {
    if (!publicClient || !walletClient || !address) {
      return { success: false, error: 'Network not configured properly' }
    }

    // Validate network
    if (publicClient.chain.id !== 1301) { // Unichain Sepolia
      return { success: false, error: 'Please switch to Unichain Sepolia network' }
    }

    if (!validatePool() || !poolState.fee) {
      return { success: false, error: 'Invalid pool parameters' }
    }

    setIsCreating(true)

    try {
      // Sort tokens to match Uniswap's ordering
      const [token0, token1] = poolState.token0!.address.toLowerCase() < poolState.token1!.address.toLowerCase()
        ? [poolState.token0!, poolState.token1!] 
        : [poolState.token1!, poolState.token0!]

      // Initialize pool
      const { request: initRequest } = await publicClient.simulateContract({
        address: publicClient.chain.contracts.poolManager.address as `0x${string}`,
        abi: poolManagerABI,
        functionName: 'initialize',
        args: [
          {
            currency0: token0.address as `0x${string}`,
            currency1: token1.address as `0x${string}`,
            fee: poolState.fee.fee,
            tickSpacing: poolState.fee.tickSpacing,
            hooks: poolState.hookAddress
          },
          sqrtPriceX96
        ],
        account: address,
      })

      // Send the initialization transaction
      const initHash = await walletClient.writeContract(initRequest)
      const initReceipt = await publicClient.waitForTransactionReceipt({ hash: initHash })

      // Get the pool ID from the Initialize event
      const initEvent = initReceipt.logs.find(
        (log: { topics: string[] }) => log.topics[0] === publicClient.interface.getEvent('Initialize')?.topicHash
      )
      
      if (!initEvent) {
        throw new Error('Failed to get pool ID from initialization event')
      }

      const poolId = initEvent.topics[1]

      return {
        success: true,
        poolId,
      }
    } catch (error: any) {
      console.error('Error creating pool:', error)
      
      // Check if it's a user rejection error
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes('User denied') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('MetaMask Tx Signature: User denied') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('user cancelled')
      ) {
        return {
          success: false,
          error: 'User rejected the transaction',
        }
      } else {
        return {
          success: false,
          error: errorMessage || 'Failed to create pool',
        }
      }
    } finally {
      setIsCreating(false)
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

  return {
    poolState,
    validation,
    isCreating,
    updateToken0,
    updateToken1,
    updateFee,
    updateHook,
    validatePool,
    createPool,
  }
}