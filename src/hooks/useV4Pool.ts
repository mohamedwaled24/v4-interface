import { useState } from 'react'
import { Token } from '../components/CreatePool/TokenSelector'
import { FeeOption } from '../components/CreatePool/FeeSelector'
import { isAddress } from 'viem'
import { useWallet } from './useWallet'

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
  poolAddress?: string
}

export function useV4Pool() {
  const { publicClient, walletClient, network } = useWallet()
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

  const createPool = async (): Promise<CreatePoolResult> => {
    if (!network?.v4FactoryAddress || !walletClient || !publicClient) {
      return { success: false, error: 'Network not configured properly' }
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

      // Get the wallet's address
      const [address] = await walletClient.getAddresses()

      // Prepare the transaction
      const { request } = await publicClient.simulateContract({
        address: network.v4FactoryAddress as `0x${string}`,
        abi: V4_FACTORY_ABI,
        functionName: 'createPool',
        args: [
          token0.address as `0x${string}`,
          token1.address as `0x${string}`,
          poolState.hookAddress as `0x${string}`,
          BigInt(poolState.fee.fee),
          BigInt(poolState.fee.tickSpacing),
        ],
        account: address,
      })

      // Send the transaction
      const hash = await walletClient.writeContract(request)

      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Get the pool address from the logs (you'll need to implement this based on the actual event structure)
      const poolAddress = '' // TODO: Extract from logs

      return {
        success: true,
        poolAddress,
      }
    } catch (error: any) {
      console.error('Error creating pool:', error)
      return {
        success: false,
        error: error.message || 'Failed to create pool',
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