import React, { useState } from 'react'
import styled from 'styled-components'
import { useWallet } from '../../hooks/useWallet'

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.h3};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.neutral1};
`

const LogoIcon = styled.div`
  color: ${({ theme }) => theme.colors.accentAction};
  font-size: 24px;
`

const NavLinks = styled.div`
  display: flex;
  gap: 32px;
`

const NavLink = styled.a`
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  
  &:hover, &.active {
    color: ${({ theme }) => theme.colors.neutral1};
  }
  
  &.active {
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ConnectButton = styled.button`
  background: ${({ theme }) => theme.colors.accentAction};
  color: ${({ theme }) => theme.colors.neutral1};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: ${({ theme }) => theme.opacities.hover};
  }
`

const AccountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundOutline};
  }
`

const AccountIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentAction};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral1};
`

const NetworkIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral2};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  padding: 6px 10px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

const NetworkDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentSuccess};
`

export const Header: React.FC = () => {
  const { isConnected, address, network, connectWallet } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  
  const handleConnectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Ethereum wallet to connect')
      return
    }
    
    setIsConnecting(true)
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Format address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  return (
    <HeaderContainer>
      <Logo>
        <LogoIcon>🦄</LogoIcon>
        Uniswap
      </Logo>
      
      <NavLinks>
        <NavLink href="#">Trade</NavLink>
        <NavLink href="#">Explore</NavLink>
        <NavLink href="#" className="active">Pool</NavLink>
      </NavLinks>
      
      <RightSection>
        {network && (
          <NetworkIndicator>
            <NetworkDot />
            {network.name}
          </NetworkIndicator>
        )}
        
        {isConnected && address ? (
          <AccountButton>
            <AccountIcon>{address.charAt(2).toUpperCase()}</AccountIcon>
            {formatAddress(address)}
          </AccountButton>
        ) : (
          <ConnectButton onClick={handleConnectWallet} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </ConnectButton>
        )}
      </RightSection>
    </HeaderContainer>
  )
}
