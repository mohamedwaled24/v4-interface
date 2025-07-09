import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useBSCPools, formatPoolData, BSCPool } from '../../hooks/useBSCPools';

/**
 * Component to display BSC pools in a table format
 */
export function BSCPoolsList() {
  const { pools, loading, error, refetch } = useBSCPools();

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') {
      return 'N/A';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatFee = (fee: string | number) => {
    const feeNumber = typeof fee === 'string' ? parseInt(fee) : fee;
    return `${feeNumber / 10000}%`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading BSC pools: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          BSC Pools ({pools.length})
        </Typography>
        <Chip 
          label="BSC Network" 
          color="primary" 
          size="small"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pool ID</TableCell>
              <TableCell>Token 0</TableCell>
              <TableCell>Token 1</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Tick Spacing</TableCell>
              <TableCell>Current Tick</TableCell>
              <TableCell>Hooks</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pools.map((pool) => {
              const formattedPool = formatPoolData(pool);
              return (
                <TableRow key={pool.id || `pool-${Math.random()}`} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatAddress(pool.id)}
                      </Typography>
                      <Tooltip title="Copy Pool ID">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAddress(pool.id || '')}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatAddress(pool.currency0)}
                      </Typography>
                      <Tooltip title="Copy Token 0 Address">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAddress(pool.currency0 || '')}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatAddress(pool.currency1)}
                      </Typography>
                      <Tooltip title="Copy Token 1 Address">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAddress(pool.currency1 || '')}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={formatFee(pool.fee || 0)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{typeof pool.tickSpacing === 'string' ? parseInt(pool.tickSpacing) : (pool.tickSpacing || 'N/A')}</TableCell>
                  <TableCell>{pool.tick || 'N/A'}</TableCell>
                  <TableCell>
                    {!pool.hooks || pool.hooks === '0x0000000000000000000000000000000000000000' ? (
                      <Chip label="No Hooks" size="small" color="default" />
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatAddress(pool.hooks)}
                        </Typography>
                        <Tooltip title="Copy Hooks Address">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyAddress(pool.hooks || '')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formattedPool.timestamp}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {pools.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No pools found on BSC
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Component to display BSC pools in a card format
 */
export function BSCPoolsCards() {
  const { pools, loading, error } = useBSCPools();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading BSC pools: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" mb={2}>
        BSC Pools ({pools.length})
      </Typography>
      
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
        {pools.map((pool) => {
          const formattedPool = formatPoolData(pool);
          return (
            <Paper key={pool.id || `pool-${Math.random()}`} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontFamily="monospace" fontSize="0.9rem">
                  {formattedPool.id !== 'N/A' ? `${formattedPool.id.slice(0, 8)}...` : 'N/A'}
                </Typography>
                <Chip label={formattedPool.fee} size="small" />
              </Box>
              
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Token 0: {formattedPool.token0 !== 'N/A' ? `${formattedPool.token0.slice(0, 6)}...${formattedPool.token0.slice(-4)}` : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Token 1: {formattedPool.token1 !== 'N/A' ? `${formattedPool.token1.slice(0, 6)}...${formattedPool.token1.slice(-4)}` : 'N/A'}
                </Typography>
              </Box>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip label={`Tick: ${formattedPool.currentTick}`} size="small" variant="outlined" />
                <Chip label={`Spacing: ${formattedPool.tickSpacing}`} size="small" variant="outlined" />
                {formattedPool.hooks !== '0x0000000000000000000000000000000000000000' && (
                  <Chip label="Hooks" size="small" color="primary" />
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Created: {formattedPool.timestamp}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {pools.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No pools found on BSC
          </Typography>
        </Box>
      )}
    </Box>
  );
} 