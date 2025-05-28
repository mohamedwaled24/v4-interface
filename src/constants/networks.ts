import { Chain } from 'viem'

export interface NetworkConfig extends Chain {
  rpcUrl: string
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_MAINNET_RPC_URL]
      },
      public: {
        http: [import.meta.env.VITE_MAINNET_RPC_URL]
      }
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://etherscan.io'
      }
    },
    rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
  },
  {
    id: 5,
    name: 'Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'gETH',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_GOERLI_RPC_URL]
      },
      public: {
        http: [import.meta.env.VITE_GOERLI_RPC_URL]
      }
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://goerli.etherscan.io'
      }
    },
    testnet: true,
    rpcUrl: import.meta.env.VITE_GOERLI_RPC_URL,
  },
  {
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: {
      name: 'Unichain Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://unichain-sepolia-rpc.publicnode.com']
      },
      public: {
        http: ['https://unichain-sepolia-rpc.publicnode.com']
      }
    },
    blockExplorers: {
      default: {
        name: 'UnichainScan',
        url: 'https://sepolia.unichainscan.com'
      }
    },
    testnet: true,
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL,
  },
]