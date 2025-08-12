import React from 'react'
import styled from 'styled-components'
// 🔥 ADD THIS IMPORT
import { motion } from 'framer-motion'

// components
import { SectionHeader } from '../components/section-elements/SectionHeader'
import CoinsSection from '../components/coinsSection/CoinsSection'

// 🔥 UPDATE YOUR STYLED COMPONENTS (add motion)
const CoinsSectionWrapper = styled(motion.section)`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
  min-height: 100%;
  display: flex;
  flex-direction: column;
`

const CoinsContainer = styled(motion.div)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
`

// 🔥 ADD THESE ANIMATION VARIANTS
const containerVariants = {
  hidden: { 
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.3
    }
  }
}

const headerVariants = {
  hidden: { 
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: "easeOut"
    }
  }
}

const coinsContainerVariants = {
  hidden: { 
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.2
    }
  }
}

// 🔥 UPDATE YOUR COMPONENT
const CoinsAnalytics = () => {
  return (
    <CoinsSectionWrapper
      // 🔥 ADD THESE MOTION PROPS
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: true,
        amount: 0.2
      }}
    >
      {/* 🔥 WRAP SECTION HEADER IN MOTION DIV */}
      <motion.div variants={headerVariants}>
        <SectionHeader
          title="Advanced Trading Tools"
          subtitle="Empower your crypto journey with institutional-grade trading features, real-time analytics, and lightning-fast execution across all major digital assets."
        />
      </motion.div>

      {/* 🔥 ADD VARIANTS TO COINS CONTAINER */}
      <CoinsContainer variants={coinsContainerVariants}>
        <CoinsSection />
      </CoinsContainer>
    </CoinsSectionWrapper>
  )
}

export default CoinsAnalytics