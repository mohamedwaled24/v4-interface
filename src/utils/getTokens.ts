import { Token } from '../types'

interface OneInchToken {
    symbol: string
    name: string
    address: string
    decimals: number
    logoURI: string
    tags: string[]
}

const getTokens = async (chainId?: number): Promise<Token[] | undefined> => {
  // Default to Ethereum mainnet if chainId is not provided or is 0
  if (!chainId || chainId === 0) chainId = 1;
 try {
     // Use 1inch Token List API which has native chain support
     const response = await fetch(`https://tokens.1inch.io/v1.1/${chainId}`);
     const data: Record<string, OneInchToken> = await response.json();
     
     // Transform 1inch data to match our Token interface
     const transformedTokens: Token[] = Object.values(data).map(token => ({
         address: token.address,
         symbol: token.symbol,
         name: token.name,
         decimals: token.decimals,
         logoURI: token.logoURI,
         chainId: chainId,
         balance: BigInt(0)
     }));
     
     // Sort by symbol for better UX
     return transformedTokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
 } catch (error) {
    console.log(error);
 }
}

export default getTokens