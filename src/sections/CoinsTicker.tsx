import React from 'react'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import bitcoin from '../../public/bitcoin.png'
import bnb from '../../public/bnb.png'
import chainlink from '../../public/chainlink.png'
import avalanche from '../../public/avalanche.png'
import ethereum from '../../public/ethereum.png'
import tether from '../../public/tether.png'
import xrp from '../../public/xrp.png'

// Create motion-enabled MUI components
const MotionBox = motion(Box)

const CoinsTicker = () => {
  // Updated crypto logos with actual images
  const cryptoLogos = [
    { name: 'Bitcoin', image: bitcoin, color: '#f7931a' },
    { name: 'Ethereum', image: ethereum, color: '#627eea' },
    { name: 'BNB', image: bnb, color: '#f3ba2f' },
    { name: 'XRP', image: xrp, color: '#0033ad' },
    { name: 'Chainlink', image: chainlink, color: '#375bd2' },
    { name: 'Avalanche', image: avalanche, color: '#e74142' },
    { name: 'Tether', image: tether, color: '#28724dff' },
    // Add more duplicates for variety
    { name: 'Bitcoin', image: bitcoin, color: '#f7931a' },
    { name: 'Ethereum', image: ethereum, color: '#627eea' },
  ]

  // Duplicate array for seamless loop
  const duplicatedLogos = [...cryptoLogos, ...cryptoLogos]

  return (
    <Box 
      sx={{ 
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Pause on Hover Marquee */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box 
          sx={{
            position: 'relative',
            overflow: 'hidden',
            paddingY: 4,
            borderRadius: '30px',
            background: 'linear-gradient(to right, rgba(112, 91, 150, 0.1), transparent)',
            '&:hover': {
              '& .marquee-content': {
                animationPlayState: 'paused'
              }
            }
          }}
        >
          {/* Left fade gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '8rem',
              background: 'linear-gradient(to right, rgba(167, 143, 209, 0.1), transparent)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
          
          {/* Right fade gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '8rem',
              background: 'linear-gradient(to left, rgba(167, 143, 209, 0.1), transparent)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
          
          <MotionBox
            className="marquee-content"
            sx={{
              display: 'flex',
              gap: 4,
              width: 'max-content'
            }}
            animate={{ x: '-50%' }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {duplicatedLogos.map((logo, index) => (
              <MotionBox
                key={index}
                sx={{
                  flexShrink: 0,
                  width: '8rem',
                  height: '8rem',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  gap: 1,
                  padding: 2
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Crypto Image */}
                <Box
                  component="img"
                  src={logo.image}
                  alt={logo.name}
                  sx={{
                    width: '3rem',
                    height: '3rem',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
                  }}
                />
                
                {/* Crypto Name */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    color: `${logo.color}`,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {logo.name}
                </Typography>
              </MotionBox>
            ))}
          </MotionBox>
        </Box>
      </Box>
    </Box>
  )
}

export default CoinsTicker