import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { GRAPHQL_ENDPOINTS } from '../config/graphql';

// Default client (currently Unichain Sepolia)
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINTS[1301],
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// Function to create a client for a specific network
export const createNetworkClient = (networkId: number): ApolloClient<any> => {
  const endpoint = GRAPHQL_ENDPOINTS[networkId as keyof typeof GRAPHQL_ENDPOINTS];
  
  if (!endpoint) {
    console.warn(`No GraphQL endpoint configured for network ${networkId}, using default`);
    return client;
  }

  const networkHttpLink = createHttpLink({
    uri: endpoint,
  });

  return new ApolloClient({
    link: networkHttpLink,
    cache: new InMemoryCache(),
  });
};

// Export the endpoints for reference
export { GRAPHQL_ENDPOINTS }; 