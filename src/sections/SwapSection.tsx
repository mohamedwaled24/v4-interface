import React from 'react'
import styled from 'styled-components'
// add framer motion
import {motion} from 'framer-motion'

// componenets
import {SwapForm} from '../components/Swap/SwapForm'
import { SectionHeader } from '../components/section-elements/SectionHeader'
const SwapSectionWrapper = styled(motion.section)`
width:100%;
max-width:1200px;
overflow:hidden;
min-height:100vh;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
`

const SwapContainer = styled(motion.div)`
width:100%;
display:flex;
flex-direction:column;
gap:24px;
height:100vh;
`
//animation variant
const containerVariant = {
    hidden:{
        opacity:0,
        y:50,
    },
    visible:{
        opacity:1,
        y:50,
        transition:{
            duration:0.8,
            ease:'easeOut',
            staggerChildren:0.3
        }
    },

}

const swapContainerVariants = {
 hidden:{
    opacity:0,
    y:40,
 },
 visible:{
    opacity:1,
    y:0,
    transition:{
        duration:0.9,
        ease:'easeIn',
        delay:0.6
    }
 }
}

const SwapSection = () => {
  return (
    <SwapSectionWrapper
    variants={containerVariant}
    initial='hidden'
    whileInView='visible'
    viewport={{ once:true,amount:0.2 }}
    >
        {/* Section Header with title and subtitle */}
      <SectionHeader 
          title="Advanced Trading Tools"
          subtitle="Empower your crypto journey with institutional-grade trading features, real-time analytics, and lightning-fast execution across all major digital assets."
        />
        <SwapContainer 
        variants={swapContainerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once:true,amount:0.3 }}
        >
           <SwapForm/>
        </SwapContainer>
    </SwapSectionWrapper>
  )
}

export default SwapSection
