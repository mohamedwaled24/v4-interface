import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';
import CoinModalTable from './CoinModalTable';

const CoinsModal = ({ open, onClose, selectedCard }) => {
  const [coinData, setCoinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data when modal opens and selectedCard changes
  useEffect(() => {
    if (open && selectedCard?.endpoint) {
      fetchCoinData();
    }
  }, [open, selectedCard]);

  const fetchCoinData = async () => {
    if (!selectedCard?.endpoint) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(selectedCard.endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different API response structures
      let formattedData;
      
      if (selectedCard.type === 'trends') {
        // For trending API, data is already in the right format
        formattedData = data;
      } else if (selectedCard.type === 'gainers' || selectedCard.type === 'losers') {
        // For gainers/losers, you might need to format the response
        // depending on your API structure
        formattedData = data;
      } else {
        // For other types, assume the data is already properly formatted
        formattedData = data;
      }
      
      setCoinData(formattedData);
    } catch (err) {
      console.error('Error fetching coin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExternal = () => {
    if (selectedCard?.type === 'trends') {
      window.open('https://www.coingecko.com/en/coins/trending', '_blank');
    } else if (coinData?.coins?.[0]?.item?.id) {
      window.open(`https://www.coingecko.com/en/coins/${coinData.coins[0].item.id}`, '_blank');
    } else {
      window.open('https://www.coingecko.com', '_blank');
    }
  };

  const getModalTitle = () => {
    if (!selectedCard) return 'Coin Details';
    
    switch (selectedCard.type) {
      case 'gainers':
        return '🚀 Top Gainers';
      case 'losers':
        return '📉 Top Losers';
      case 'trends':
        return '🔥 Trending Coins';
      default:
        return selectedCard.title || 'Coin Details';
    }
  };

  const getModalDescription = () => {
    if (!selectedCard) return '';
    
    switch (selectedCard.type) {
      case 'gainers':
        return 'Coins with the highest price increases in the last 24 hours';
      case 'losers':
        return 'Coins with the biggest price drops in the last 24 hours';
      case 'trends':
        return 'Most searched cryptocurrencies on CoinGecko';
      default:
        return selectedCard.description || '';
    }
  };

  // Reset data when modal closes
  useEffect(() => {
    if (!open) {
      setCoinData(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {getModalTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {getModalDescription()}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load data: {error}
            </Alert>
            <Button 
              variant="outlined" 
              onClick={fetchCoinData}
              disabled={loading}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <CoinModalTable 
            coinData={coinData} 
            cardType={selectedCard?.type}
            loading={loading}
          />
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleViewExternal}
          startIcon={<OpenInNew />}
          disabled={loading}
        >
          View on CoinGecko
        </Button>
        {error && (
          <Button 
            variant="contained" 
            color="secondary"
            onClick={fetchCoinData}
            disabled={loading}
          >
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CoinsModal;