> [!WARNING]
This is a test interface to provide a playground for testing Uniswap V4 contracts and is not meant for production use.

# Uniswap V4 Interface

A frontend application for interacting with Uniswap V4 pools. This interface allows users to create pools, manage liquidity (add/remove), and perform token swaps using the V4 architecture. It features multi-wallet support and integrates Permit2 for efficient token approvals.

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/)
*   [Yarn](https://yarnpkg.com/)

## Getting Started

### 1. Clone the Repository

Clone the project to your local machine:
```bash
git clone https://github.com/aravind33b/interface
cd interface
```

### 2. Install Dependencies

Install the project dependencies using Yarn:
```bash
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example file 

```bash
cp .env.example .env
```

### 4. Run the Application

Start the development server:
```bash
yarn start
```

## Files to modify

### Adding different chains:
 - You can modify the chain details in the src/constants/networks.ts

   For example:
   ```TypeScript
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
    }
   ```
   And add the relevant RPC URL in your .env file (like VITE_MAINNET_RPC_URL).

### Adding different tokens:
 - You can modify the token list in src/constants/tokens.ts

   For example:
   ```TypeScript
    {
    chainId: 130,
    name: 'Ether',
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
   }
   ```

### Adding list of contracts as per netowork:
 - You can modify the contracts list in src/constants/contracts.ts

   For example:
   ```TypeScript
   11155111: {
    PoolManager: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    PositionManager: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
    StateView: '0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c',
    UniversalRouter: '0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b',
   }
   ```
  > [!NOTE]
  Refer and use the tokens in the default token: https://ipfs.io/ipns/tokens.uniswap.org

## Key Features

*   **Uniswap V4 Pool Interaction:**
    *   Create new V4 pools.
    *   Add liquidity to V4 pools.
*   **V4 Swaps:** Execute single hop token swaps through the Universal Router, utilizing V4 pool architecture.
*   **PoolKey Management:** Utilizes full `PoolKey` objects for identifying and interacting with pools, rather than just `poolId` strings.
*   **Permit2 Integration:** Leverages Permit2 for gas-efficient token approvals and batch operations.
*   **Multi-Wallet Support:** Connect using various wallets like MetaMask, WalletConnect-compatible wallets, and Coinbase Wallet.

## Tech Stack

*   **Framework:** React
*   **Language:** TypeScript
*   **Wallet Integration:** Wagmi, Web3Modal
*   **Ethereum Interaction:** Viem
*   **Uniswap SDKs:**
    *   `@uniswap/v4-sdk`
    *   `@uniswap/sdk-core`

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow. Ensure your code adheres to the project's linting and formatting standards.

(Further details on contribution guidelines can be added here.)

## License

This project is distributed under the GNU General Public License (GPL 2.0)
