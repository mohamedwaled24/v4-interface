import { Token } from '../types'

export const UNICHAIN_SEPOLIA_TOKENS: Token[] = [
  {
    chainId: 130,
    name: 'USDCoin',
    address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  {
    chainId: 130,
    name: 'Ether',
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  }
] 