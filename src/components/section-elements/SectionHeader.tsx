
import React from 'react'
import { Box, Typography } from '@mui/material'

export const SectionHeader = ({ 
  title = "Default Title", 
  subtitle = "Default subtitle description goes here",
  sx = {},
  titleSx = {},
  subtitleSx = {}
}) => {
  return (
    <Box 
      sx={{
        textAlign: 'center',
        marginBottom: 6,
        ...sx
      }}
    >
      {/* Title with gradient and professional styling */}
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '2rem', md: '3rem', lg: '3.75rem' },
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #60a5fa, #a855f7, #22d3ee)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          marginBottom: 2,
          ...titleSx
        }}
      >
        {title}
      </Typography>
      
      {/* Subtitle with elegant styling */}
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: '1.125rem', md: '1.25rem' },
          color: '#d1d5db',
          maxWidth: '48rem',
          margin: '0 auto',
          lineHeight: 1.6,
          fontWeight: 300,
          marginBottom: 3,
          ...subtitleSx
        }}
      >
        {subtitle}
      </Typography>
      
      {/* Decorative accent line */}
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          marginTop: 3
        }}
      >
        <Box
          sx={{
            width: '3rem',
            height: '2px',
            background: 'linear-gradient(to right, transparent, #60a5fa)'
          }}
        />
        <Box
          sx={{
            width: '8px',
            height: '8px',
            backgroundColor: '#22d3ee',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
          }}
        />
        <Box
          sx={{
            width: '3rem',
            height: '2px',
            background: 'linear-gradient(to left, transparent, #a855f7)'
          }}
        />
      </Box>
    </Box>
  )
}