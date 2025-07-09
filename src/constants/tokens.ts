import { Token } from '../types'

export const TOKENS_LIST: Token[] = [
  {
    chainId: 1,
    name: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  {
    chainId: 1,
    name: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  {
    chainId: 1301,
    name: 'USDCoin',
    address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  {
    chainId: 1301,
    name: 'Ether',
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  {
    chainId: 1301,
    name: 'Mock A',
    address: '0x9d13f44c940146f3fdee00768d373d24eaf9c6e5',
    symbol: 'A',
    decimals: 18,
    logoURI: ''
  },
  {
    chainId: 1301,
    name: 'Mock B',
    address: '0x51ad0d703dfe9db5909303abbcf83f81b777e716',
    symbol: 'B',
    decimals: 18,
    logoURI: ''
  },
  {
    chainId: 11155111,
    name: 'USDCoin',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  {
    chainId: 11155111,
    name: 'WELL',
    address: '0x99f99BDa47Ef3720779958761163FdD008f5826f',
    symbol: 'WE',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  {
    chainId: 11155111,
    name: 'WELX',
    address: '0xF45FF83cD379A9f04134DF0cC5929b5074823fAf',
    symbol: 'WELX',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  {
    chainId: 11155111,
    name: 'SWellz',
    address: '0xd89BE3FF5dcFa6DB168eEAc741aB95e1b457eCf5',
    symbol: 'SWLZ',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  {
    chainId: 11155111,
    name: 'SWol',
    address: '0xC5aA4c82d11281C13c18Fcf172946f7Fc960dFF9',
    symbol: 'SWOL',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
      {
      chainId: 56,
      name: 'USDT (Tether USD)',
      address: '0x55d398326f99059fF775485246999027B3197955', // Placeholder: Replace with actual USDT on your BNB chain
      symbol: 'USDT',
      decimals: 18, // Check actual decimals for USDT on BNB (often 6 or 18)
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' // Example logo
    },
    {
      chainId: 56,
      name: 'USDC (USD Coin)',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // Placeholder: Replace with actual USDC on your BNB chain
      symbol: 'USDC',
      decimals: 18, // Check actual decimals for USDC on BNB (often 6)
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' // Example logo
    },
]

// {"currency0":"0x55d398326f99059fF775485246999027B3197955","currency1":"0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d","fee":3000,"tickSpacing":60,"hooks":"0x0000000000000000000000000000000000000000"}