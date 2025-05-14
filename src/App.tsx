import React, { useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { CreatePoolForm } from './components/CreatePool/CreatePoolForm'
import { SwapForm } from './components/Swap/SwapForm'
import { Header, NavType } from './components/shared/Header'
import { GlobalStyle } from './theme/GlobalStyle'
import { darkTheme } from './theme'

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.neutral1};
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
`

// Placeholder for Explore content
const ExplorePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 32px;
  text-align: center;
`

const PlaceholderTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.neutral1};
`

const PlaceholderText = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral2};
  max-width: 600px;
`

export function App() {
  const [activeNav, setActiveNav] = useState<NavType>(NavType.TRADE)
  
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      <AppWrapper>
        <Header activeNav={activeNav} onNavChange={setActiveNav} />
        <ContentWrapper>
          {activeNav === NavType.TRADE && <SwapForm />}
          {activeNav === NavType.POOL && <CreatePoolForm />}
          {activeNav === NavType.EXPLORE && (
            <ExplorePlaceholder>
              <PlaceholderTitle>Explore Coming Soon</PlaceholderTitle>
              <PlaceholderText>
                This feature is currently under development. You will be able to explore
                v4 pools, hooks, and other components from this section.
              </PlaceholderText>
            </ExplorePlaceholder>
          )}
        </ContentWrapper>
      </AppWrapper>
    </ThemeProvider>
  )
}