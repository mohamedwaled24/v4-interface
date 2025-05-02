import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { CreatePoolForm } from './components/CreatePool/CreatePoolForm'
import { Header } from './components/shared/Header'
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
  padding: 0 16px;
`

export function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      <AppWrapper>
        <Header />
        <ContentWrapper>
          <CreatePoolForm />
        </ContentWrapper>
      </AppWrapper>
    </ThemeProvider>
  )
}