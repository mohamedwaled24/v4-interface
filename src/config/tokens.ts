export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
}

export const TOKENS: Token[] = [
  {
    address: "0x0000000000000000000000000000000000000000", // Native token (ETH/CFX)
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18
  },
  {
    address: "0x31d0220469e10c4E71834a79b1f276d740d3768F", // Example token
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6
  }
] as const 