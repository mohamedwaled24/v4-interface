import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

// components
import { SectionHeader } from '../components/section-elements/SectionHeader'
import CoinsSection from '../components/coinsSection/CoinsSection'

const CoinsSectionWrapper = styled.section`
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

// Animation for the coins container only
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
      delay: 0.5  // Delay after header animation
    }
  }
}

const CoinsAnalytics = () => {
  return (
    <CoinsSectionWrapper>
      {/* SectionHeader now has its own built-in animations! */}
      <SectionHeader
        title="Advanced Trading Tools"
        subtitle="Empower your crypto journey with institutional-grade trading features, real-time analytics, and lightning-fast execution across all major digital assets."
        enableAnimation={true}
        animationDelay={0}
      />
      
      {/* Only the coins container needs animation here */}
      <CoinsContainer
        variants={coinsContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ 
          once: true,
          amount: 0.2
        }}
      >
        <CoinsSection />
      </CoinsContainer>
    </CoinsSectionWrapper>
  )
}

export default CoinsAnalytics