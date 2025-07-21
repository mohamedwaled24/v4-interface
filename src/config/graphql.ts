// GraphQL endpoints configuration
export const GRAPHQL_ENDPOINTS = {
  1: 'https://indexer.dev.hyperindex.xyz/ethereum/v1/graphql', // Ethereum mainnet
  11155111: 'https://indexer.dev.hyperindex.xyz/sepolia/v1/graphql', // Ethereum Sepolia
  1301: 'https://indexer.dev.hyperindex.xyz/771be56/v1/graphql', // Unichain Sepolia
  56: 'http://localhost:8080/api/rest/PoolManager_Initialize', // BNB Smart Chain
  all: 'https://indexer.dev.hyperindex.xyz/39d5de7/v1/graphql', // All pools, all networks
} as const;

// Network names for display
export const NETWORK_NAMES: { [key: number]: string } = {
  1: 'Ethereum',
  11155111: 'Ethereum Sepolia',
  1301: 'Unichain Sepolia',
  56: 'BNB Smart Chain',
};

// Helper function to get network name
export const getNetworkName = (networkId: number): string => {
  return NETWORK_NAMES[networkId] || `Network ${networkId}`;
};

// Helper function to check if a network is supported
export const isNetworkSupported = (networkId: number): boolean => {
  return networkId in GRAPHQL_ENDPOINTS;
}; 