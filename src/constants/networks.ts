import { Chain } from 'viem'

export interface NetworkConfig extends Chain {
  rpcUrl: string
  poolManagerAddress: string
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  // {
  //   id: 1,
  //   name: 'Ethereum',
  //   nativeCurrency: {
  //     name: 'Ether',
  //     symbol: 'ETH',
  //     decimals: 18,
  //   },
  //   rpcUrls: {
  //     default: {
  //       http: [import.meta.env.VITE_MAINNET_RPC_URL]
  //     },
  //     public: {
  //       http: [import.meta.env.VITE_MAINNET_RPC_URL]
  //     }
  //   },
  //   blockExplorers: {
  //     default: {
  //       name: 'Etherscan',
  //       url: 'https://etherscan.io'
  //     }
  //   },
  //   rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
  //   poolManagerAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  // },
  // {
  //   id: 5,
  //   name: 'Goerli',
  //   nativeCurrency: {
  //     name: 'Goerli Ether',
  //     symbol: 'gETH',
  //     decimals: 18,
  //   },
  //   rpcUrls: {
  //     default: {
  //       http: [import.meta.env.VITE_GOERLI_RPC_URL]
  //     },
  //     public: {
  //       http: [import.meta.env.VITE_GOERLI_RPC_URL]
  //     }
  //   },
  //   blockExplorers: {
  //     default: {
  //       name: 'Etherscan',
  //       url: 'https://goerli.etherscan.io'
  //     }
  //   },
  //   testnet: true,
  //   rpcUrl: import.meta.env.VITE_GOERLI_RPC_URL,
  //   poolManagerAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  // },
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
    rpcUrl: 'https://unichain-sepolia-rpc.publicnode.com',
    poolManagerAddress: '0x00b036b58a818b1bc34d502d3fe730db729e62ac',
  },
]