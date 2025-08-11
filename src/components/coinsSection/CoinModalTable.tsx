import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  Skeleton
} from '@mui/material';
import { TrendingUp, TrendingDown, Star } from '@mui/icons-material';

const CoinModalTable = ({ coinData, cardType, loading }) => {
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (!coinData || !coinData.coins || coinData.coins.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
        No data available
      </Typography>
    );
  }

  // Format price change with appropriate color and icon
  const formatPriceChange = (change) => {
    if (change === undefined || change === null) return null;
    const isPositive = change >= 0;
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {isPositive ? (
          <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />
        ) : (
          <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />
        )}
        <Typography
          variant="body2"
          sx={{ 
            color: isPositive ? '#4caf50' : '#f44336',
            fontWeight: 600
          }}
        >
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </Typography>
      </Box>
    );
  };

  // Get gradient based on card type
  const getGradient = (type) => {
    switch (type) {
      case 'gainers':
        return 'linear-gradient(135deg, #f1b1caff, #f389c3ff)';
      case 'losers':
        return 'linear-gradient(135deg, #ff9a9e, #fecfef)';
      case 'trends':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  // For single coin view (detailed view)
  if (coinData.coins.length === 1) {
    const coin = coinData.coins[0].item;
    const data = coin.data;

    // Major currencies to display
    const majorCurrencies = ['usd', 'eur', 'btc', 'eth'];
    const priceChanges = majorCurrencies
      .filter(currency => data?.price_change_percentage_24h?.[currency] !== undefined)
      .map(currency => ({
        currency: currency.toUpperCase(),
        change: data.price_change_percentage_24h[currency]
      }));

    return (
      <Box sx={{ p: 2 }}>
        {/* Header Section */}
        <Card sx={{ mb: 3, background: getGradient(cardType) }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                src={coin.large || coin.small || coin.thumb}
                alt={coin.name}
                sx={{ width: 60, height: 60 }}
              />
              <Box>
                <Typography variant="h4" color="white" fontWeight={700}>
                  {coin.name}
                </Typography>
                <Typography variant="h6" color="rgba(255,255,255,0.8)">
                  {coin.symbol}
                </Typography>
              </Box>
              <Box ml="auto">
                {coin.market_cap_rank && (
                  <Chip
                    label={`Rank #${coin.market_cap_rank}`}
                    sx={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
                {coin.score !== undefined && (
                  <Chip
                    icon={<Star sx={{ color: 'white !important' }} />}
                    label={`Score: ${coin.score}`}
                    sx={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      ml: 1
                    }}
                  />
                )}
              </Box>
            </Box>
            
            {data && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Current Price
                  </Typography>
                  <Typography variant="h5" color="white" fontWeight={600}>
                    ${data.price?.toFixed(6) || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Price in BTC
                  </Typography>
                  <Typography variant="h6" color="white" fontWeight={600}>
                    ₿{data.price_btc ? parseFloat(data.price_btc).toFixed(8) : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Market Data */}
        {data && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {data.market_cap && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Market Cap
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight={600}>
                        {data.market_cap}
                      </Typography>
                      {data.market_cap_btc && (
                        <Typography variant="body2" color="text.secondary">
                          ₿{data.market_cap_btc}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {data.total_volume && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        24h Volume
                      </Typography>
                      <Typography variant="h4" color="secondary" fontWeight={600}>
                        {data.total_volume}
                      </Typography>
                      {data.total_volume_btc && (
                        <Typography variant="body2" color="text.secondary">
                          ₿{data.total_volume_btc}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Price Changes */}
            {priceChanges.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    24h Price Changes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    {priceChanges.map((item, index) => (
                      <Grid item xs={6} sm={3} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {item.currency}
                          </Typography>
                          {formatPriceChange(item.change)}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    );
  }

  // For multiple coins view (list view)
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {cardType === 'gainers' ? 'Top Gainers' : 
         cardType === 'losers' ? 'Top Losers' : 
         cardType === 'trends' ? 'Trending Coins' : 'Coins'}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Coin</TableCell>
              <TableCell align="center">Rank</TableCell>
              {cardType === 'trends' && <TableCell align="center">Score</TableCell>}
              <TableCell align="right">Price (USD)</TableCell>
              <TableCell align="right">Price (BTC)</TableCell>
              <TableCell align="right">24h Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coinData.coins.map((coinItem, index) => {
              const coin = coinItem.item;
              const data = coin.data;
              
              return (
                <TableRow key={coin.id || index} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={coin.thumb || coin.small}
                        alt={coin.name}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {coin.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {coin.symbol}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {coin.market_cap_rank && (
                      <Chip
                        label={`#${coin.market_cap_rank}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  {cardType === 'trends' && (
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <Star sx={{ fontSize: 16, color: '#ffd700' }} />
                        <Typography variant="body2">
                          {coin.score || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {data?.price ? `$${data.price.toFixed(6)}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {data?.price_btc ? `₿${parseFloat(data.price_btc).toFixed(8)}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {data?.price_change_percentage_24h?.usd ? 
                      formatPriceChange(data.price_change_percentage_24h.usd) : 
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    }
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CoinModalTable;