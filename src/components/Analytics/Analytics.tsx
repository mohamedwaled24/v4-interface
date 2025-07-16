import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useWalletContext } from '../../contexts/WalletContext';
import { GRAPHQL_ENDPOINTS, getNetworkName, isNetworkSupported } from '../../config/graphql';
// Remove Apollo imports
// import { gql } from '@apollo/client';
// import { useNetworkQuery } from '../../hooks/useNetworkQuery';
// import DetailsCard from './DetailsCard';

// Remove GraphQL queries and types for manager/hook stats
// GraphQL Queries

// Types
interface Pool {
  id: string;
  token0: string;
  token1: string;
  feeTier: number;
  hooks: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
}

interface PoolManagerStats {
  numberOfSwaps: string;
  hookedPools: string;
  hookedSwaps: string;
}

interface HookStats {
  numberOfPools: string;
  numberOfSwaps: string;
}

const Analytics: React.FC = () => {
  const [showVanillaPools, setShowVanillaPools] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<number>(1301); // Default to Unichain Sepolia
  const [allPools, setAllPools] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [fallbackPools, setFallbackPools] = useState<Pool[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('tokens'); // Default to Tokens
  
  const { network: walletNetwork } = useWalletContext();
  
  // Auto-sync with wallet network if it's supported
  useEffect(() => {
    if (walletNetwork && isNetworkSupported(walletNetwork.id)) {
      setSelectedNetwork(walletNetwork.id);
    }
  }, [walletNetwork]);

  // Fetch pools from the selected network's endpoint
  useEffect(() => {
    setPoolsLoading(true);
    fetch(GRAPHQL_ENDPOINTS.all)
      .then(res => res.json())
      .then(data => {
        setAllPools(data.Pool || []);
        setPoolsLoading(false);
      })
      .catch(() => setPoolsLoading(false));
  }, []);

  // Remove DetailsCard

  const handleCopy = (text: string) => {
    // Remove the network ID prefix (1301_, 1_, etc.) if it exists
    const addressToCopy = text.includes('_') ? text.substring(text.indexOf('_') + 1) : text;
    navigator.clipboard.writeText(addressToCopy);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Filter pools based on vanilla filter and sort by creation date
  const filteredPools = (allPools?.filter((pool: any) => 
    !showVanillaPools || pool.hooks === '0x0000000000000000000000000000000000000000'
  ) || []).slice(0, 100);
  const filteredFallbackPools = fallbackPools.filter((pool: Pool) =>
    !showVanillaPools || pool.hooks === '0x0000000000000000000000000000000000000000'
  ).slice(0, 100);

  // Loading state
  if (poolsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state (only show if fallback also fails or not a 404)
  if (poolsLoading && allPools.length === 0) { // Only show fallback error if poolsLoading is true and no pools were fetched
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading data: {fallbackError}
        </Typography>
      </Box>
    );
  }

  // Remove get the first PoolManager stats (since it's an array)
  // Remove Sum up all hook stats

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>

      {/* Top 5 Summary Cards (use allPools for Pools count, others mock for now) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">TVL</Typography>
            <Typography variant="h6">$123,456,789</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">24h Volume</Typography>
            <Typography variant="h6">$12,345,678</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">Tokens</Typography>
            <Typography variant="h6">100</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">Pools</Typography>
            <Typography variant="h6">{allPools.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">Transactions</Typography>
            <Typography variant="h6">100</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for Tokens, Pools, Transactions */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} aria-label="analytics tabs">
          <Tab label="Tokens" value="tokens" />
          <Tab label="Pools" value="pools" />
          <Tab label="Transactions" value="transactions" />
        </Tabs>
      </Box>

      {/* Table for selected tab */}
      {selectedTab === 'tokens' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Top 100 Tokens</Typography>
          {/* Replace with real data fetching */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>1h</TableCell>
                <TableCell>1d</TableCell>
                <TableCell>FDV</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>1d Chart</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Mock rows */}
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>Token {i+1}</TableCell>
                  <TableCell>$1.{i}0</TableCell>
                  <TableCell>{(Math.random()*10-5).toFixed(2)}%</TableCell>
                  <TableCell>{(Math.random()*10-5).toFixed(2)}%</TableCell>
                  <TableCell>${(1000000+i*10000).toLocaleString()}</TableCell>
                  <TableCell>${(10000+i*100).toLocaleString()}</TableCell>
                  <TableCell><Box sx={{ width: 60, height: 24, bgcolor: 'grey.200', borderRadius: 1 }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      {selectedTab === 'pools' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Top 100 Pools</Typography>
          {poolsLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>Loading pools...</Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pool</TableCell>
                  <TableCell>TVL</TableCell>
                  <TableCell>Volume 24h</TableCell>
                  <TableCell>Fee Tier</TableCell>
                  <TableCell>Swaps</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allPools.slice(0, 100).map((pool, i) => (
                  <TableRow key={pool.id || i}>
                    <TableCell>{pool.token0} / {pool.token1}</TableCell>
                    <TableCell>${Number(pool.totalValueLockedUSD || 0).toLocaleString()}</TableCell>
                    <TableCell>${Number(pool.volumeUSD || 0).toLocaleString()}</TableCell>
                    <TableCell>{pool.feeTier}</TableCell>
                    <TableCell>{pool.txCount || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
      {selectedTab === 'transactions' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Latest 100 Transactions</Typography>
          {/* Replace with real data fetching */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Txn Hash</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>0x...{(1000+i).toString(16)}</TableCell>
                  <TableCell>{['Swap','Add','Remove'][i%3]}</TableCell>
                  <TableCell>Token {i+1}</TableCell>
                  <TableCell>{(Math.random()*1000).toFixed(2)}</TableCell>
                  <TableCell>{`${i+1}h ago`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      
      {/* Network Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Network</InputLabel>
          <Select
            value={selectedNetwork}
            label="Select Network"
            onChange={(e) => setSelectedNetwork(e.target.value as number)}
          >
            {Object.keys(GRAPHQL_ENDPOINTS).map((networkId) => (
              <MenuItem key={networkId} value={Number(networkId)}>
                {getNetworkName(Number(networkId))}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {/* Vanilla Pools Filter */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: showVanillaPools ? 'rgba(144, 202, 249, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid',
          borderColor: showVanillaPools ? 'primary.main' : 'divider',
          transition: 'all 0.3s ease'
        }}
      >
        <FormControlLabel
          control={
            <Checkbox 
              checked={showVanillaPools} 
              onChange={(e) => setShowVanillaPools(e.target.checked)}
              color="primary"
              sx={{
                color: showVanillaPools ? 'primary.main' : 'white',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label={
            <Typography variant="subtitle1" color={showVanillaPools ? 'primary' : 'white'}>
              {showVanillaPools ? 'Showing Only Vanilla Pools' : 'Show Only Vanilla Pools'}
            </Typography>
          }
        />
      </Paper>

      <Grid container spacing={3}>
        {/* PoolManager Stats */}
        <Grid item xs={12}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              PoolManager Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of Swaps
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hooked Pools
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hooked Swaps
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Unique Tokens
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Hook Stats */}
        <Grid item xs={12}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Hook Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of Pools
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of Swaps
                  </Typography>
                  <Typography variant="h6">
                    {/* Mock data */}
                    0
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Pools List */}
        <Grid item xs={12}>
          <Typography variant="h6">Pools</Typography>
          {(filteredPools.length === 0 && filteredFallbackPools.length === 0) ? (
            <Typography>No pools found</Typography>
          ) : (
            (filteredPools.length > 0 ? filteredPools : filteredFallbackPools).map((pool: Pool) => (
              <Accordion key={pool.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {pool.token0} / {pool.token1} (Fee: {pool.feeTier})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Pool ID: {pool.id}</Typography>
                    <Tooltip title={copySuccess === pool.id ? "Copied!" : "Copy pool ID"}>
                      <IconButton size="small" onClick={() => handleCopy(pool.id)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography>Hooks: {pool.hooks}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Token0 Address: {pool.token0}</Typography>
                    <Tooltip title={copySuccess === pool.token0 ? "Copied!" : "Copy address"}>
                      <IconButton size="small" onClick={() => handleCopy(pool.token0)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Token1 Address: {pool.token1}</Typography>
                    <Tooltip title={copySuccess === pool.token1 ? "Copied!" : "Copy address"}>
                      <IconButton size="small" onClick={() => handleCopy(pool.token1)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography>Token0 Locked: {Number(pool.totalValueLockedToken0).toLocaleString()}</Typography>
                  <Typography>Token1 Locked: {Number(pool.totalValueLockedToken1).toLocaleString()}</Typography>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics; 