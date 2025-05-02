import { Chain } from 'viem'

export interface NetworkConfig extends Chain {
  rpcUrl: string
  v4FactoryAddress: string
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
    v4FactoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
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
    v4FactoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  },
]