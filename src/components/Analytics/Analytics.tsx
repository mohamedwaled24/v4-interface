import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { Box, Typography, Grid, Paper, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useWalletContext } from '../../contexts/WalletContext';
import { GRAPHQL_ENDPOINTS, getNetworkName, isNetworkSupported } from '../../config/graphql';
import { useNetworkQuery } from '../../hooks/useNetworkQuery';

// GraphQL Queries
const POOLS_QUERY = gql`
  query {
    Pool{
      id
      token0
      token1
      feeTier
      hooks
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

const POOL_MANAGER_STATS = gql`
  query PoolManagerStats {
    PoolManager {
      numberOfSwaps
      hookedPools
      hookedSwaps
    }
    Token {
      id
    }
  }
`;

const HOOK_STATS_QUERY = gql`
  query HookStats {
    HookStats {
      numberOfPools
      numberOfSwaps
    }
  }
`;

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
  
  const { network: walletNetwork } = useWalletContext();
  
  // Auto-sync with wallet network if it's supported
  useEffect(() => {
    if (walletNetwork && isNetworkSupported(walletNetwork.id)) {
      setSelectedNetwork(walletNetwork.id);
    }
  }, [walletNetwork]);

  const handleCopy = (text: string) => {
    // Remove the network ID prefix (1301_, 1_, etc.) if it exists
    const addressToCopy = text.includes('_') ? text.substring(text.indexOf('_') + 1) : text;
    navigator.clipboard.writeText(addressToCopy);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Fetch data using network-specific queries
  const { loading: poolsLoading, error: poolsError, data: poolsData } = useNetworkQuery(POOLS_QUERY, {
    networkId: selectedNetwork,
  });
  const { loading: managerLoading, error: managerError, data: managerData } = useNetworkQuery(POOL_MANAGER_STATS, {
    networkId: selectedNetwork,
  });
  const { loading: hookStatsLoading, error: hookStatsError, data: hookStatsData } = useNetworkQuery(HOOK_STATS_QUERY, {
    networkId: selectedNetwork,
  });

  // Filter pools based on vanilla filter and sort by creation date
  const filteredPools = poolsData?.Pool?.filter((pool: Pool) => 
    !showVanillaPools || pool.hooks === '0x0000000000000000000000000000000000000000'
  ) || [];

  // Loading state
  if (poolsLoading || managerLoading || hookStatsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (poolsError || managerError || hookStatsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading data: {poolsError?.message || managerError?.message || hookStatsError?.message}
        </Typography>
      </Box>
    );
  }

  // Get the first PoolManager stats (since it's an array)
  const poolManagerStats: PoolManagerStats = managerData?.PoolManager?.[0] || {};

  // Sum up all hook stats
  const hookStats: HookStats = hookStatsData?.HookStats?.reduce((acc: HookStats, curr: HookStats) => ({
    numberOfPools: String(Number(acc.numberOfPools || '0') + Number(curr.numberOfPools || '0')),
    numberOfSwaps: String(Number(acc.numberOfSwaps || '0') + Number(curr.numberOfSwaps || '0'))
  }), { numberOfPools: '0', numberOfSwaps: '0' }) || { numberOfPools: '0', numberOfSwaps: '0' };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>
      
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
                    {poolManagerStats?.numberOfSwaps || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hooked Pools
                  </Typography>
                  <Typography variant="h6">
                    {poolManagerStats?.hookedPools || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hooked Swaps
                  </Typography>
                  <Typography variant="h6">
                    {poolManagerStats?.hookedSwaps || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Unique Tokens
                  </Typography>
                  <Typography variant="h6">
                    {managerData?.Token?.length || '0'}
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
                    {hookStats?.numberOfPools || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of Swaps
                  </Typography>
                  <Typography variant="h6">
                    {hookStats?.numberOfSwaps || '0'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Pools List */}
        <Grid item xs={12}>
          <Typography variant="h6">Pools</Typography>
          {filteredPools.length === 0 ? (
            <Typography>No pools found</Typography>
          ) : (
            filteredPools.map((pool: Pool) => (
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