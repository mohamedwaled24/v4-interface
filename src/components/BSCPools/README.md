# BSC Pools Component

This component provides functionality to fetch and display BSC (Binance Smart Chain) pools using the GraphQL endpoint `https://bsc.hypersync.xyz`.

## Features

- **Real-time Data**: Fetches pool data from BSC using GraphQL
- **Multiple Views**: Table and card view options
- **Search Functionality**: Filter pools by token addresses, pool ID, or fee
- **Statistics**: Shows total pools, pools with hooks, and average fees
- **Copy Functionality**: Easy copying of addresses and pool IDs
- **Responsive Design**: Works on desktop and mobile devices

## Components

### `BSCPoolsDemo`
The main demo component that includes:
- Statistics dashboard
- Search functionality
- Tabbed interface (Table/Card views)
- Query information display

### `BSCPoolsList`
Table view component displaying pools in a structured format.

### `BSCPoolsCards`
Card view component displaying pools in a grid layout.

## Usage

### Basic Usage
```tsx
import { BSCPoolsDemo } from './components/BSCPools';

function App() {
  return (
    <div>
      <BSCPoolsDemo />
    </div>
  );
}
```

### Using the Hook
```tsx
import { useBSCPools } from './hooks/useBSCPools';

function MyComponent() {
  const { pools, loading, error, refetch } = useBSCPools();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {pools.map(pool => (
        <div key={pool.id}>
          Pool ID: {pool.id}
          Token 0: {pool.currency0}
          Token 1: {pool.currency1}
          Fee: {pool.fee / 10000}%
        </div>
      ))}
    </div>
  );
}
```

### Direct API Call
```tsx
import { fetchBSCPools } from './hooks/useBSCPools';

async function fetchPools() {
  try {
    const pools = await fetchBSCPools();
    console.log('BSC Pools:', pools);
  } catch (error) {
    console.error('Error fetching pools:', error);
  }
}
```

## GraphQL Query

The component uses the following GraphQL query:

```graphql
query PoolManager_Initialize {
  PoolManager_Initialize {
    currency0
    currency1
    db_write_timestamp
    event_id
    fee
    hooks
    id
    sqrtPriceX96
    tick
    tickSpacing
  }
}
```

## Data Structure

Each pool object contains:

```typescript
interface BSCPool {
  currency0: string;        // Token 0 address
  currency1: string;        // Token 1 address
  db_write_timestamp: string; // Creation timestamp
  event_id: string;         // Event ID
  fee: number;              // Fee in basis points
  hooks: string;            // Hooks contract address
  id: string;               // Pool ID
  sqrtPriceX96: string;     // Current sqrt price
  tick: number;             // Current tick
  tickSpacing: number;      // Tick spacing
}
```

## Configuration

The component uses the existing GraphQL configuration from `src/config/graphql.ts`:

```typescript
export const GRAPHQL_ENDPOINTS = {
  56: 'https://bsc.hypersync.xyz', // BNB Smart Chain
} as const;
```

## Integration

The component is integrated into the main navigation as "BSC Pools" and can be accessed through the header navigation.

## Dependencies

- `@apollo/client`: For GraphQL queries
- `@mui/material`: For UI components
- `@mui/icons-material`: For icons
- React hooks for state management

## Error Handling

The component includes comprehensive error handling:
- Network errors
- GraphQL errors
- Loading states
- Empty state handling

## Performance

- Uses Apollo Client caching for efficient data fetching
- Implements debounced search for better performance
- Lazy loading of components
- Optimized re-renders with React hooks 