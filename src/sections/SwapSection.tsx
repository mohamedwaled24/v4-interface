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
margin:0 auto;
overflow:hidden;
min-height:100vh;
display:flex;
flex-direction:column;
`

const SwapContainer = styled(motion.div)`
width:100%;
display:flex;
flex-direction:column;
gap:24px;
height:100vh;
`

const SwapSection = () => {
  return (
    <SwapSectionWrapper>
        {/* Section Header with title and subtitle */}
      <SectionHeader 
          title="Advanced Trading Tools"
          subtitle="Empower your crypto journey with institutional-grade trading features, real-time analytics, and lightning-fast execution across all major digital assets."
        />
        <SwapContainer>
           <SwapForm/>
        </SwapContainer>
    </SwapSectionWrapper>
  )
}

export default SwapSection
