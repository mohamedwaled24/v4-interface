import React from 'react'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'

// Create motion-enabled MUI components
const MotionBox = motion(Box)
const MotionTypography = motion(Typography)

export const SectionHeader = ({ 
  title = "Default Title", 
  subtitle = "Default subtitle description goes here",
  sx = {},
  titleSx = {},
  subtitleSx = {},
  // Animation control props
  enableAnimation = true,
  animationDelay = 0
}) => {

  // Animation variants for different elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: animationDelay
      }
    }
  }

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.9 
    },
    visible: {
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const subtitleVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: {
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const decorativeVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8 
    },
    visible: {
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  // Individual line animations for the decorative element
  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { 
      scaleX: 1, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        delay: 0.3
      }
    }
  }

  return (
    <MotionBox 
      variants={enableAnimation ? containerVariants : {}}
      initial={enableAnimation ? "hidden" : false}
      whileInView={enableAnimation ? "visible" : false}
      viewport={{ once: true, amount: 0.3 }}
      sx={{
        textAlign: 'center',
        marginBottom: 6,
        ...sx
      }}
    >
      {/* Title with gradient and professional styling */}
      <MotionTypography
        variant="h1"
        variants={enableAnimation ? titleVariants : {}}
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
      </MotionTypography>
      
      {/* Subtitle with elegant styling */}
      <MotionTypography
        variant="h6"
        variants={enableAnimation ? subtitleVariants : {}}
        sx={{
          fontSize: { xs: '1.125rem', md: '1.25rem' },
          color: '#4c4f53ff',
          maxWidth: '48rem',
          margin: '0 auto',
          lineHeight: 1.6,
          fontWeight: 300,
          marginBottom: 3,
          ...subtitleSx
        }}
      >
        {subtitle}
      </MotionTypography>
      
      {/* Decorative accent line */}
      <MotionBox 
        variants={enableAnimation ? decorativeVariants : {}}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          marginTop: 3
        }}
      >
        <MotionBox
          variants={enableAnimation ? lineVariants : {}}
          sx={{
            width: '3rem',
            height: '2px',
            background: 'linear-gradient(to right, transparent, #60a5fa)',
            transformOrigin: 'right'
          }}
        />
        <MotionBox
          variants={enableAnimation ? dotVariants : {}}
          whileHover={enableAnimation ? { 
            scale: 1.2, 
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.8)' 
          } : {}}
          sx={{
            width: '8px',
            height: '8px',
            backgroundColor: '#22d3ee',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
          }}
        />
        <MotionBox
          variants={enableAnimation ? lineVariants : {}}
          sx={{
            width: '3rem',
            height: '2px',
            background: 'linear-gradient(to left, transparent, #a855f7)',
            transformOrigin: 'left'
          }}
        />
      </MotionBox>
    </MotionBox>
  )
}