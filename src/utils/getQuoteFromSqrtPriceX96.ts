import { parseUnits, formatUnits } from 'viem';

/**
 * Calculates output amount from input amount using sqrtPriceX96.
 * @param amountInRaw User input amount (string, e.g. "1.2")
 * @param sqrtPriceX96 Pool price in sqrt format (BigInt)
 * @param tokenInDecimals Decimals of tokenIn
 * @param tokenOutDecimals Decimals of tokenOut
 * @param tokenInIsToken0 Whether tokenIn is token0 (affects price direction)
 */
export const getQuoteFromSqrtPriceX96 = (
  amountInRaw: string,
  sqrtPriceX96: bigint,
  tokenInDecimals: number,
  tokenOutDecimals: number,
  tokenInIsToken0: boolean
): string => {
  const amountIn = parseUnits(amountInRaw, tokenInDecimals);
  const Q96 = BigInt(2) ** BigInt(96);
  const priceX96 = (sqrtPriceX96 ** BigInt(2)) / Q96;

  let amountOut;

  if (tokenInIsToken0) {
    // token0 → token1: use direct price
    amountOut = (amountIn * Q96) / priceX96;
  } else {
    // token1 → token0: use inverse price
    amountOut = (amountIn * priceX96) / Q96;
  }

  return formatUnits(amountOut, tokenOutDecimals);
};
