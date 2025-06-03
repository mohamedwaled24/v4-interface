import { useState, useCallback } from 'react'
import { useWallet } from './useWallet'
import { parseUnits, keccak256, encodePacked, encodeAbiParameters } from 'viem'
import { CONTRACTS } from '../constants/contracts'
import { Actions } from '@uniswap/v4-sdk'

// Import the ABI properly - it might be the default export or have a different structure
let universalRouterAbi: any;
try {
  universalRouterAbi = require('../../contracts/universalRouter.json');
} catch (error) {
  console.error('Failed to load Universal Router ABI:', error);
  universalRouterAbi = { abi: [] };
}

// Fallback ABI for Universal Router if the JSON file isn't working
const UNIVERSAL_ROUTER_ABI = [
  {
    "inputs": [
      {"name": "commands", "type": "bytes"},
      {"name": "inputs", "type": "bytes[]"}
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "commands", "type": "bytes"},
      {"name": "inputs", "type": "bytes[]"},
      {"name": "deadline", "type": "uint256"}
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface PoolKey {
  currency0: string
  currency1: string
  fee: number
  tickSpacing: number
  hooks: string
}

interface SwapState {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  poolKey: PoolKey | null
  slippageTolerance: number
  deadline: number
}

interface SwapValidation {
  tokenInError?: string
  tokenOutError?: string
  amountInError?: string
  poolIdError?: string
}

interface PoolInfo {
  token0Symbol: string
  token1Symbol: string
  fee: number
  liquidity: string
  tick: number
}

interface SwapResult {
  success: boolean
  error?: string
  txHash?: string
}

// V4 Universal Router Commands
const Commands = {
  V4_SWAP: 0x00
} as const

// Generate pool ID from pool key (V4 style)
const generatePoolIdFromKey = (poolKey: PoolKey): string => {
  const encoded = encodePacked(
    ['address', 'address', 'uint24', 'int24', 'address'],
    [
      poolKey.currency0 as `0x${string}`,
      poolKey.currency1 as `0x${string}`,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks as `0x${string}`
    ]
  );
  return keccak256(encoded);
}

export function useV4Swap() {
  const { publicClient, walletClient, address, chainId } = useWallet()
  const [isSwapping, setIsSwapping] = useState(false)
  const [isValidatingPool, setIsValidatingPool] = useState(false)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    poolKey: null,
    slippageTolerance: 0.5,
    deadline: 20,
  })
  
  const [validation, setValidation] = useState<SwapValidation>({})

  const validateSwap = useCallback((): boolean => {
    const errors: SwapValidation = {}

    if (!swapState.tokenIn) {
      errors.tokenInError = 'Select input token'
    }
    if (!swapState.tokenOut) {
      errors.tokenOutError = 'Select output token'
    }
    if (swapState.tokenIn && swapState.tokenOut && 
        swapState.tokenIn.address.toLowerCase() === swapState.tokenOut.address.toLowerCase()) {
      errors.tokenInError = 'Tokens must be different'
      errors.tokenOutError = 'Tokens must be different'
    }
    if (!swapState.amountIn || parseFloat(swapState.amountIn) <= 0) {
      errors.amountInError = 'Enter amount'
    }
    if (!swapState.poolKey) {
      errors.poolIdError = 'Select pool'
    }

    setValidation(errors)
    return Object.keys(errors).length === 0
  }, [swapState])

  // Basic quote calculation - replace with actual V4 SDK or price oracle in production
  const calculateAmountOut = useCallback(async (
    amountIn: string,
    tokenIn: Token,
    tokenOut: Token,
    poolKey: PoolKey
  ): Promise<string> => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      return '0'
    }
    try {
      // Simple fee-based calculation - NOT for production use
      let amountInFloat = parseFloat(amountIn)
      let amountOut = amountInFloat
      const feeRate = poolKey.fee / 1_000_000
      amountOut = amountOut * (1 - feeRate)
      return amountOut.toFixed(Math.min(tokenOut.decimals, 8))
    } catch (error) {
      console.error('Error calculating amount out:', error)
      return '0'
    }
  }, [])

  const executeSwap = useCallback(async (): Promise<SwapResult> => {
    if (!validateSwap()) {
      return { success: false, error: 'Invalid swap parameters' }
    }
    const { tokenIn, tokenOut, amountIn, poolKey, slippageTolerance, deadline } = swapState;
    if (!tokenIn || !tokenOut || !poolKey || !walletClient || !publicClient || !address || !chainId) {
      return { success: false, error: 'Missing requirements' }
    }
    const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS];
    if (!contracts?.UniversalRouter) {
      return { success: false, error: `UniversalRouter not available for chain ${chainId}` };
    }
    setIsSwapping(true);
    try {
      // Parse input amount
      const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);

      // Calculate minimum output amount (for slippage protection)
      const calculatedAmountOut = await calculateAmountOut(amountIn, tokenIn, tokenOut, poolKey);
      const minAmountOut = parseUnits(
        (parseFloat(calculatedAmountOut) * (1 - slippageTolerance / 100)).toString(),
        tokenOut.decimals
      );

      // Check if input token needs approval (skip for native ETH)
      const isNativeInput = tokenIn.address === '0x0000000000000000000000000000000000000000';
      if (!isNativeInput) {
        const ERC20_ABI = [
          {
            inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }
        ] as const;

        const allowance = await publicClient.readContract({
          address: tokenIn.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, contracts.UniversalRouter as `0x${string}`]
        });

        if (allowance < parsedAmountIn) {
          return { 
            success: false, 
            error: `Insufficient allowance. Please approve ${tokenIn.symbol} for UniversalRouter first.` 
          };
        }
      }

      // Prepare Universal Router call with proper V4 structure
      const swapDeadline = BigInt(Math.floor(Date.now() / 1000) + (deadline * 60));
      
      // Determine swap direction
      const zeroForOne = tokenIn.address.toLowerCase() === poolKey.currency0.toLowerCase();

      // Debug Actions to see actual values
      console.log('Available Actions:', Actions);
      console.log('SWAP_EXACT_IN_SINGLE:', Actions.SWAP_EXACT_IN_SINGLE);
      console.log('SETTLE_ALL:', Actions.SETTLE_ALL);
      console.log('TAKE_ALL:', Actions.TAKE_ALL);

      // Check if Actions are properly imported
      if (Actions.SWAP_EXACT_IN_SINGLE === undefined || Actions.SETTLE_ALL === undefined || Actions.TAKE_ALL === undefined) {
        throw new Error('Actions constants not properly imported from @uniswap/v4-sdk');
      }

      const commandBytes = `0x${Commands.V4_SWAP.toString(16).padStart(2, '0')}` as `0x${string}`;
      
      // V4Router Actions sequence for exact input single swap
      const actions = new Uint8Array([
        Actions.SWAP_EXACT_IN_SINGLE,
        Actions.SETTLE_ALL,
        Actions.TAKE_ALL
      ]);

      // Parameters for each action
      const params: `0x${string}`[] = [];

      // Action 0: SWAP_EXACT_IN_SINGLE - the actual swap parameters
      params[0] = encodeAbiParameters(
        [
          {
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' }
            ],
            name: 'poolKey',
            type: 'tuple'
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'amountIn', type: 'uint128' },
          { name: 'amountOutMinimum', type: 'uint128' },
          { name: 'hookData', type: 'bytes' }
        ],
        [
          {
            currency0: poolKey.currency0 as `0x${string}`,
            currency1: poolKey.currency1 as `0x${string}`,
            fee: poolKey.fee,
            tickSpacing: poolKey.tickSpacing,
            hooks: poolKey.hooks as `0x${string}`
          },
          zeroForOne,
          BigInt(parsedAmountIn.toString()),
          BigInt(minAmountOut.toString()),
          '0x' as `0x${string}`
        ]
      );

      // Action 1: SETTLE_ALL - settle the input currency (simplified parameters)
      params[1] = encodeAbiParameters(
        [{ name: 'currency', type: 'address' }],
        [zeroForOne ? poolKey.currency0 as `0x${string}` : poolKey.currency1 as `0x${string}`]
      );

      // Action 2: TAKE_ALL - take the output currency (simplified parameters)
      params[2] = encodeAbiParameters(
        [{ name: 'currency', type: 'address' }],
        [zeroForOne ? poolKey.currency1 as `0x${string}` : poolKey.currency0 as `0x${string}`]
      );

      // Encode actions as bytes
      const actionsBytes = `0x${Array.from(actions).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

      // Create the input for Universal Router
      const routerInput = encodeAbiParameters(
        [
          { name: 'actions', type: 'bytes' },
          { name: 'params', type: 'bytes[]' }
        ],
        [actionsBytes, params]
      );

      const inputs = [routerInput];

      console.log('V4 Swap parameters:', {
        commandBytes,
        actionsBytes,
        actions: Array.from(actions),
        zeroForOne,
        parsedAmountIn: parsedAmountIn.toString(),
        minAmountOut: minAmountOut.toString(),
        deadline: swapDeadline.toString(),
        poolKey,
        inputsLength: inputs.length,
        routerInput
      });

      console.log('Attempting to call Universal Router execute function...');
      console.log('Contract address:', contracts.UniversalRouter);
      console.log('Command bytes:', commandBytes);
      console.log('Inputs array length:', inputs.length);
      console.log('Deadline:', swapDeadline.toString());
      console.log('Is native input:', isNativeInput);
      console.log('Value to send:', isNativeInput ? parsedAmountIn.toString() : '0');

      // Debug each parameter individually
      console.log('Parameter debugging:');
      console.log('- commandBytes type:', typeof commandBytes, 'value:', commandBytes);
      console.log('- inputs type:', typeof inputs, 'array?', Array.isArray(inputs), 'length:', inputs?.length);
      console.log('- inputs[0] type:', typeof inputs[0], 'value length:', inputs[0]?.length);
      console.log('- swapDeadline type:', typeof swapDeadline, 'value:', swapDeadline.toString());
      console.log('- address type:', typeof address, 'value:', address);
      console.log('- abi exists:', !!universalRouterAbi.abi);
      console.log('- abi length:', universalRouterAbi.abi?.length);

      // Try to find the execute function in the ABI
      const executeFunctions = universalRouterAbi.abi.filter((item: any) => 
        item.type === 'function' && item.name === 'execute'
      );
      console.log('Execute functions found in ABI:', executeFunctions.length);
      executeFunctions.forEach((func: any, index: number) => {
        console.log(`Execute function ${index}:`, {
          inputs: func.inputs?.length,
          inputTypes: func.inputs?.map((input: any) => input.type)
        });
      });

      // Simple parameter validation
      if (!commandBytes || typeof commandBytes !== 'string' || !commandBytes.startsWith('0x')) {
        throw new Error(`Invalid commandBytes: ${commandBytes}`);
      }
      if (!Array.isArray(inputs) || inputs.length === 0) {
        throw new Error(`Invalid inputs array: ${inputs}`);
      }
      if (!inputs[0] || typeof inputs[0] !== 'string' || !inputs[0].startsWith('0x')) {
        throw new Error(`Invalid inputs[0]: ${inputs[0]}`);
      }

      // Try a very simple test call first
      try {
        console.log('Testing simple contract call...');
        const testCall = await publicClient.simulateContract({
          address: contracts.UniversalRouter as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"name": "commands", "type": "bytes"},
                {"name": "inputs", "type": "bytes[]"}
              ],
              "name": "execute",
              "outputs": [],
              "stateMutability": "payable",
              "type": "function"
            }
          ],
          functionName: 'execute',
          args: [
            commandBytes,
            inputs
          ],
          account: address as `0x${string}`,
          value: isNativeInput ? parsedAmountIn : BigInt(0)
        });
        console.log('Simple test call succeeded');
      } catch (testError: any) {
        console.log('Simple test call failed:', testError.message);
        throw new Error(`Contract call failed with simplified ABI: ${testError.message}`);
      }

      // Execute the swap through Universal Router
      // Try the 2-parameter version first
      let request;
      try {
        ({ request } = await publicClient.simulateContract({
          address: contracts.UniversalRouter as `0x${string}`,
          abi: universalRouterAbi.abi,
          functionName: 'execute',
          args: [
            commandBytes,
            inputs
          ],
          account: address as `0x${string}`,
          value: isNativeInput ? parsedAmountIn : BigInt(0)
        }));
        console.log('2-parameter execute succeeded');
      } catch (error: any) {
        console.log('2-parameter execute failed:', error.message);
        // Try the 3-parameter version
        ({ request } = await publicClient.simulateContract({
          address: contracts.UniversalRouter as `0x${string}`,
          abi: universalRouterAbi.abi,
          functionName: 'execute',
          args: [
            commandBytes,
            inputs,
            swapDeadline
          ],
          account: address as `0x${string}`,
          value: isNativeInput ? parsedAmountIn : BigInt(0)
        }));
        console.log('3-parameter execute succeeded');
      }

      // Execute the transaction
      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60_000
      });

      if (receipt.status === 'success') {
        setSwapState(prev => ({ ...prev, amountOut: calculatedAmountOut }));
        return { success: true, txHash: hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (error: any) {
      console.error('V4 Swap error:', error);
      return {
        success: false,
        error: error.message || 'Swap failed'
      };
    } finally {
      setIsSwapping(false);
    }
  }, [walletClient, publicClient, address, chainId, swapState, validateSwap, calculateAmountOut])

  const updateTokenIn = useCallback((token: Token | null) => {
    setSwapState(prev => ({ ...prev, tokenIn: token }));
    setValidation(prev => ({ ...prev, tokenInError: undefined }));
  }, [])

  const updateTokenOut = useCallback((token: Token | null) => {
    setSwapState(prev => ({ ...prev, tokenOut: token }));
    setValidation(prev => ({ ...prev, tokenOutError: undefined }));
  }, [])

  const updateAmountIn = useCallback(async (amount: string) => {
    setSwapState(prev => ({ ...prev, amountIn: amount }));
    setValidation(prev => ({ ...prev, amountInError: undefined }));
    // Calculate output amount
    if (swapState.tokenIn && swapState.tokenOut && swapState.poolKey && amount) {
      const amountOut = await calculateAmountOut(
        amount,
        swapState.tokenIn,
        swapState.tokenOut,
        swapState.poolKey
      );
      setSwapState(prev => ({ ...prev, amountOut }));
    } else {
      setSwapState(prev => ({ ...prev, amountOut: '' }));
    }
  }, [swapState.tokenIn, swapState.tokenOut, swapState.poolKey, calculateAmountOut])

  const updatePoolKey = useCallback(async (poolKey: PoolKey) => {
    setSwapState(prev => ({ ...prev, poolKey }));
    setValidation(prev => ({ ...prev, poolIdError: undefined }));
    setIsValidatingPool(true);
    // Create pool info from poolKey - no need to fetch from blockchain
    const basicPoolInfo: PoolInfo = {
      token0Symbol: poolKey.currency0 === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'TOKEN0',
      token1Symbol: 'TOKEN1',
      fee: poolKey.fee,
      liquidity: 'Unknown',
      tick: 0
    };
    setPoolInfo(basicPoolInfo);
    setIsValidatingPool(false);
    // Recalculate amount out
    if (swapState.amountIn && swapState.tokenIn && swapState.tokenOut) {
      const amountOut = await calculateAmountOut(
        swapState.amountIn,
        swapState.tokenIn,
        swapState.tokenOut,
        poolKey
      );
      setSwapState(prev => ({ ...prev, amountOut }));
    }
  }, [swapState.amountIn, swapState.tokenIn, swapState.tokenOut, calculateAmountOut])

  const updatePoolId = useCallback((poolIdOrKey: string) => {
    try {
      const poolKey = JSON.parse(poolIdOrKey) as PoolKey;
      updatePoolKey(poolKey);
    } catch {
      console.warn('Invalid poolKey JSON:', poolIdOrKey);
    }
  }, [updatePoolKey])

  const updateSlippageTolerance = useCallback((slippage: number) => {
    setSwapState(prev => ({ ...prev, slippageTolerance: slippage }));
  }, [])

  const updateDeadline = useCallback((minutes: number) => {
    setSwapState(prev => ({ ...prev, deadline: minutes }));
  }, [])

  const swapTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: ''
    }));
  }, [])

  return {
    swapState,
    validation,
    isSwapping,
    isValidatingPool,
    poolInfo,
    updateTokenIn,
    updateTokenOut,
    updateAmountIn,
    updatePoolKey,
    updatePoolId,
    updateSlippageTolerance,
    updateDeadline,
    swapTokens,
    executeSwap,
    validateSwap
  }
}