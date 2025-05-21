import { CONTRACTS } from '../constants/contracts'
import { createPublicClient, http, encodeAbiParameters, parseAbiParameters } from 'viem'
import { unichainSepolia } from 'viem/chains'

// Action types from v4-periphery
const Actions = {
  MINT_POSITION: 0,
  SETTLE_PAIR: 1,
  SWEEP: 2
}

// Helper function to encode pool key
function encodePoolKey(
  currency0: `0x${string}`,
  currency1: `0x${string}`,
  fee: number,
  tickSpacing: number,
  hooks: `0x${string}`
) {
  return encodeAbiParameters(
    parseAbiParameters('(address,address,uint24,int24,address)'),
    [[currency0, currency1, fee, tickSpacing, hooks]]
  )
}

// Helper function to encode mint position parameters
function encodeMintPositionParams(
  poolKey: `0x${string}`,
  tickLower: number,
  tickUpper: number,
  liquidity: bigint,
  amount0Max: bigint,
  amount1Max: bigint,
  recipient: `0x${string}`,
  hookData: `0x${string}` = '0x'
) {
  return encodeAbiParameters(
    parseAbiParameters('(bytes,int24,int24,uint256,uint128,uint128,address,bytes)'),
    [[poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData]]
  )
}

// Helper function to encode settle pair parameters
function encodeSettlePairParams(currency0: `0x${string}`, currency1: `0x${string}`) {
  return encodeAbiParameters(
    parseAbiParameters('(address,address)'),
    [[currency0, currency1]]
  )
}

// Helper function to encode sweep parameters
function encodeSweepParams(currency: `0x${string}`, recipient: `0x${string}`) {
  return encodeAbiParameters(
    parseAbiParameters('(address,address)'),
    [[currency, recipient]]
  )
}

export async function provideLiquidity(
  signer: any,
  {
    currency0,
    currency1,
    fee,
    tickSpacing,
    hooks,
    tickLower,
    tickUpper,
    liquidity,
    amount0Max,
    amount1Max,
    recipient,
    hookData = '0x'
  }: {
    currency0: `0x${string}`
    currency1: `0x${string}`
    fee: number
    tickSpacing: number
    hooks: `0x${string}`
    tickLower: number
    tickUpper: number
    liquidity: bigint
    amount0Max: bigint
    amount1Max: bigint
    recipient: `0x${string}`
    hookData?: `0x${string}`
  }
) {
  const publicClient = createPublicClient({
    chain: unichainSepolia,
    transport: http()
  })

  // 1. Encode pool key
  const poolKey = encodePoolKey(currency0, currency1, fee, tickSpacing, hooks)

  // 2. Encode actions
  const actions = encodeAbiParameters(
    parseAbiParameters('uint8[]'),
    [[Actions.MINT_POSITION, Actions.SETTLE_PAIR, Actions.SWEEP]]
  )

  // 3. Encode parameters for each action
  const params = [
    encodeMintPositionParams(
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      amount0Max,
      amount1Max,
      recipient,
      hookData
    ),
    encodeSettlePairParams(currency0, currency1),
    encodeSweepParams(currency0, recipient) // Sweep any excess ETH
  ]

  // 4. Call modifyLiquidities
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // 20 minutes from now

  // If providing ETH liquidity, we need to send the value
  const value = currency0 === '0x0000000000000000000000000000000000000000' ? amount0Max : 0n

  const { request } = await publicClient.simulateContract({
    address: CONTRACTS[1301].PositionManager as `0x${string}`,
    abi: [{
      name: 'modifyLiquidities',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'unlockData', type: 'bytes' },
        { name: 'deadline', type: 'uint256' }
      ],
      outputs: []
    }],
    functionName: 'modifyLiquidities',
    args: [
      encodeAbiParameters(
        parseAbiParameters('(bytes,bytes[])'),
        [[actions, params]]
      ),
      deadline
    ],
    value
  })

  return signer.writeContract(request)
} 