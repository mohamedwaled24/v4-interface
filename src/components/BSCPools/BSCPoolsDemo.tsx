import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Chip,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BSCPoolsList, BSCPoolsCards, useBSCPools, formatPoolData } from './index';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bsc-pools-tabpanel-${index}`}
      aria-labelledby={`bsc-pools-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function BSCPoolsDemo() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { pools, loading, error, refetch } = useBSCPools();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  const filteredPools = pools.filter(pool => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      pool.currency0.toLowerCase().includes(searchLower) ||
      pool.currency1.toLowerCase().includes(searchLower) ||
      pool.id.toLowerCase().includes(searchLower) ||
      pool.fee.toString().includes(searchLower)
    );
  });

  const stats = {
    totalPools: pools.length,
    poolsWithHooks: pools.filter(p => p.hooks !== '0x0000000000000000000000000000000000000000').length,
    averageFee: pools.length > 0 ? pools.reduce((sum, p) => sum + p.fee, 0) / pools.length : 0,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          BSC Pools Explorer
        </Typography>
        <Chip label="BSC Network" color="primary" />
      </Box>

      {/* Stats Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mb={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {stats.totalPools}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Pools
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="secondary">
            {stats.poolsWithHooks}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pools with Hooks
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            {(stats.averageFee / 10000).toFixed(2)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average Fee
          </Typography>
        </Paper>
      </Box>

      {/* Search and Controls */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          placeholder="Search pools by token address, pool ID, or fee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading BSC pools: {error.message}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="BSC pools view tabs">
          <Tab label={`Table View (${filteredPools.length})`} />
          <Tab label={`Card View (${filteredPools.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <BSCPoolsList />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <BSCPoolsCards />
        </TabPanel>
      </Paper>

      {/* Query Information */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Information
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This data is fetched from the BSC REST API endpoint using a GET request:
        </Typography>
        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            fontSize: '0.875rem',
            overflow: 'auto',
          }}
        >
{`GET http://localhost:8080/api/rest/bsc-pools

Response format:
{
  "PoolManager_Initialize": [
    {
      "currency0": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      "currency1": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "fee": "500",
      "hooks": "0x0000000000000000000000000000000000000000",
      "sqrtPriceX96": "2994405156029119016452847920",
      "tickSpacing": "10"
    }
  ]
}`}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Endpoint: <code>http://localhost:8080/api/rest/bsc-pools</code>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Method: <code>GET</code>
        </Typography>
      </Paper>
    </Box>
  );
} 