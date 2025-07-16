import React, { useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { ApolloProvider } from '@apollo/client'
import { CreatePoolForm } from './components/CreatePool/CreatePoolForm'
import { SwapForm } from './components/Swap/SwapForm'
import { Header, NavType } from './components/shared/Header'
import { GlobalStyle } from './theme/GlobalStyle'
import { theme } from './theme/theme'
import Analytics from './components/Analytics/Analytics'
import { BSCPoolsDemo } from './components/BSCPools'
import { client } from './apollo/client'
import { WalletProvider } from './contexts/WalletContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'ab74342164d54cc004931ee7f4be9777',
  chains: [mainnet, polygon, optimism, arbitrum, base , bsc],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();


const AppWrapper = styled.div` 
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 100%;
  background: linear-gradient(135deg, #f3eeff 0%, #fefdfe 100%);
  color: ${({ theme }) => theme.textPrimary};
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
  const [activeNav, setActiveNav] = useState<NavType>(NavType.Swap)
  
  return (
    <WalletProvider>
        <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ToastContainer position="top-right" autoClose={5000} />
          <AppWrapper>
            <Header activeNav={activeNav} onNavChange={setActiveNav} />
            <ContentWrapper>
              {activeNav === NavType.Swap && <SwapForm />}
            </ContentWrapper>
          </AppWrapper>
        </ThemeProvider>
      </ApolloProvider>
      </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </WalletProvider>
  )
}