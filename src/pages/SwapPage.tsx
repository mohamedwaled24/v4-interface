import React from 'react'
import { Box } from '@mui/material'
import SwapSection from '../sections/SwapSection'
import CoinsSection from '../components/coinsSection/CoinsSection'
import CoinsAnalytics from '../sections/CoinsAnalytics'
import CoinsTicker from '../sections/CoinsTicker'

const SwapPage = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 8, md: 12 }, // Equal spacing between sections (64px on mobile, 96px on desktop)
        paddingY: { xs: 4, md: 6 }, // Top and bottom padding for the page
        minHeight: '100vh'
      }}
    >
      <SwapSection />
      <CoinsTicker />
      <CoinsAnalytics />
    </Box>
  )
}

export default SwapPage