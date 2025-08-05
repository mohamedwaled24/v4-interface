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
  console.log('🔧 FIXED QUOTE CALCULATION:');
  
  const amountIn = parseUnits(amountInRaw, tokenInDecimals);
  const Q96 = BigInt(2) ** BigInt(96);
  const priceX96 = (sqrtPriceX96 ** BigInt(2)) / Q96;

  console.log('Price calculation details:', {
    amountInRaw,
    amountInParsed: amountIn.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceX96: priceX96.toString(),
    tokenInIsToken0,
    tokenInDecimals,
    tokenOutDecimals
  });

  let amountOut;

  if (tokenInIsToken0) {
    // token0 → token1: multiply by price
    // priceX96 represents token1/token0 ratio
    amountOut = (amountIn * priceX96) / Q96;
    console.log('Token0 → Token1: amountOut = (amountIn * priceX96) / Q96');
  } else {
    // token1 → token0: divide by price (invert)
    // To convert token1 to token0, we need the inverse ratio
    amountOut = (amountIn * Q96) / priceX96;
    console.log('Token1 → Token0: amountOut = (amountIn * Q96) / priceX96 (inverse)');
  }

  console.log('Amount calculation:', {
    calculation: tokenInIsToken0 
      ? `(${amountIn.toString()} * ${priceX96.toString()}) / ${Q96.toString()}`
      : `(${amountIn.toString()} * ${Q96.toString()}) / ${priceX96.toString()}`,
    amountOut: amountOut.toString()
  });

  const result = formatUnits(amountOut, tokenOutDecimals);
  console.log('Final result:', result);

  return result;
};