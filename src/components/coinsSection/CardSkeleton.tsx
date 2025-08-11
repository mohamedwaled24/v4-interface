import React from 'react';
import { Grid, Box, Card, CardContent, Typography, CardActionArea } from '@mui/material';
import { TrendingUp, TrendingDown, CurrencyBitcoin, ShowChart } from '@mui/icons-material';
import CoinsModal from './CoinsModal';

// Updated cards configuration
const cards = [
  {
    id: 1,
    title: 'Top Gainers',
    type: 'gainers',
    description: 'See which coins are pumping right now.',
    icon: <TrendingUp sx={{ fontSize: 40, color: '#00ff9d' }} />,
    gradient: 'linear-gradient(135deg, #f1b1caff, #f389c3ff)',
    endpoint: '/api/gainers', // Replace with your actual gainers API
  },
  {
    id: 2,
    title: 'Top Losers',
    type: 'losers',
    description: 'Track the biggest drops in the market.',
    icon: <TrendingDown sx={{ fontSize: 40, color: '#ff6b6b' }} />,
    gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
    endpoint: '/api/losers', // Replace with your actual losers API
  },
  {
    id: 3,
    title: 'Top Coins',
    type: 'top',
    description: 'Track the most valuable cryptocurrencies.',
    icon: <CurrencyBitcoin sx={{ fontSize: 40, color: '#f7931a' }} />,
    gradient: 'linear-gradient(135deg, #9cd3ecff, #5688f5ff)',
    endpoint: '/api/top-coins', // Replace with your actual top coins API
  },
  {
    id: 4,
    title: 'Market Trends',
    type: 'trends',
    description: 'Get insights into trending cryptocurrencies.',
    icon: <ShowChart sx={{ fontSize: 40, color: '#4facfe' }} />,
    gradient: 'linear-gradient(135deg, #e1baf3ff, #8b5dc0ff)',
    endpoint: 'https://api.coingecko.com/api/v3/search/trending?&x_cg_demo_api_key=CG-14Fmia3obVD1kZxxyRBAu6m1',
  },
];

function CardSkeleton() {
  const [selectedCard, setSelectedCard] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Small delay to ensure smooth animation
    setTimeout(() => setSelectedCard(null), 200);
  };

  return (
    <>
      <Grid container spacing={2} sx={{ width: "100%" }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.id} sx={{ display: "flex" }}>
            <Card
              sx={{
                background: card.gradient,
                color: "white",
                borderRadius: "16px",
                flex: 1,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardActionArea
                onClick={() => handleCardClick(card)}
                sx={{ 
                  height: "100%", 
                  display: "flex", 
                  flexDirection: "column", 
                  p: 2,
                  minHeight: 160 
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 0 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    {card.icon}
                    <Typography variant="h6" fontWeight={700}>
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.4 }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dynamic Modal */}
      <CoinsModal 
        open={open} 
        onClose={handleClose} 
        selectedCard={selectedCard} 
      />
    </>
  );
}

export default CardSkeleton;