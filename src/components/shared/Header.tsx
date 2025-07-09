import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useWallet } from '../../hooks/useWallet'
import { SUPPORTED_NETWORKS } from '../../constants/networks'
import { NetworkDropdown } from './NetworkDropdown'
import { ConnectButton } from '@rainbow-me/rainbowkit';


// Define interface for navigation types
export enum NavType {
  TRADE = 'trade',
  EXPLORE = 'explore',
  POOL = 'pool',
  BSC_POOLS = 'bsc_pools'
}

interface HeaderProps {
  activeNav: NavType;
  onNavChange: (nav: NavType) => void;
}

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

const NavLink = styled.a<{ $active?: boolean }>`
  color: ${({ theme, $active }) => 
    $active ? theme.colors.neutral1 : theme.colors.neutral2};
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: ${({ theme, $active }) => 
    $active ? theme.fontWeights.semibold : theme.fontWeights.medium};
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

// const ConnectButton = styled.button`
//   background: ${({ theme }) => theme.colors.accentAction};
//   color: ${({ theme }) => theme.colors.neutral1};
//   border: none;
//   border-radius: ${({ theme }) => theme.borderRadius.round};
//   padding: 8px 16px;
//   font-size: ${({ theme }) => theme.fontSizes.medium};
//   font-weight: ${({ theme }) => theme.fontWeights.semibold};
//   cursor: pointer;
//   transition: opacity 0.2s;
  
//   &:hover {
//     opacity: ${({ theme }) => theme.opacities.hover};
//   }
// `

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
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral2};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  padding: 6px 10px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundOutline};
  }
`

const NetworkDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentSuccess};
`

const NetworkOption = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  background: ${({ $active, theme }) => $active ? theme.colors.backgroundModule : 'transparent'};
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }
`

const NetworkName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral1};
`

const ActiveIndicator = styled.div`
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentSuccess};
`

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
  margin-left: 4px;
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.2s ease;
`

const NetworkDropdownComponent = () => {
  const { network, chainId, switchNetwork } = useWallet()
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)
  
  // Handle network switching
  const handleNetworkSwitch = async (networkId: number) => {
    if (networkId === chainId) {
      setIsNetworkDropdownOpen(false)
      return
    }
    
    try {
      await switchNetwork(networkId)
      setIsNetworkDropdownOpen(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        networkDropdownRef.current && 
        !networkDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNetworkDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <div ref={networkDropdownRef}>
      <NetworkIndicator onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}>
        {network && (
          <>
            <NetworkDot />
            {network.name}
            <ChevronIcon $isOpen={isNetworkDropdownOpen}>▾</ChevronIcon>
          </>
        )}
        {!network && (
          <>
            Select Network
            <ChevronIcon $isOpen={isNetworkDropdownOpen}>▾</ChevronIcon>
          </>
        )}
      </NetworkIndicator>
      
      {/* <NetworkDropdown $isOpen={isNetworkDropdownOpen}>
        {SUPPORTED_NETWORKS.map((net) => (
          <NetworkOption 
            key={net.id} 
            $active={chainId === net.id}
            onClick={() => handleNetworkSwitch(net.id)}
          >
            <NetworkName>{net.name}</NetworkName>
            {chainId === net.id && <ActiveIndicator />}
          </NetworkOption>
        ))}
      </NetworkDropdown> */}
    </div>
  )
}

// Add styled dropdown for wallet
const WalletDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: ${({ theme }) => theme.colors.backgroundSurface};
  color: ${({ theme }) => theme.colors.neutral1};
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  min-width: 220px;
  z-index: 1000;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const WalletDropdownTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`

const WalletDropdownRow = styled.div`
  font-size: 14px;
  margin-bottom: 4px;
  word-break: break-all;
`

const WalletDropdownBalance = styled.div`
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
`

const WalletDisconnectButton = styled.button`
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: 8px;
  background: #f44336;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
`

export const Header: React.FC<HeaderProps> = ({ activeNav, onNavChange }) => {
  const { isConnected, address, connectWallet, disconnectWallet, balance, network } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
  return (
    <HeaderContainer>
      <Logo>
        Uniswap v4 Contracts Playground
      </Logo>
      
      <NavLinks>
        <NavLink 
          $active={activeNav === NavType.TRADE} 
          onClick={() => onNavChange(NavType.TRADE)}
        >
          Trade
        </NavLink>
        <NavLink 
          $active={activeNav === NavType.EXPLORE} 
          onClick={() => onNavChange(NavType.EXPLORE)}
        >
          Explore
        </NavLink>
        <NavLink 
          $active={activeNav === NavType.POOL} 
          onClick={() => onNavChange(NavType.POOL)}
        >
          Pool
        </NavLink>
        <NavLink 
          $active={activeNav === NavType.BSC_POOLS} 
          onClick={() => onNavChange(NavType.BSC_POOLS)}
        >
          BSC Pools
        </NavLink>
      </NavLinks>
      
      <RightSection>
        {/* <NetworkDropdown /> */}
        <ConnectButton />
        
        {/* {isConnected && address ? (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <AccountButton onClick={() => setIsDropdownOpen((open) => !open)}>
              <AccountIcon>{address.charAt(2).toUpperCase()}</AccountIcon>
              {formatAddress(address)}
            </AccountButton>
            {isDropdownOpen && (
              <WalletDropdown>
                <WalletDropdownTitle>Wallet</WalletDropdownTitle>
                <WalletDropdownRow>Address: <span style={{ fontFamily: 'monospace' }}>{formatAddress(address)}</span></WalletDropdownRow>
                <WalletDropdownBalance>
                  Balance: {balance !== null && balance !== undefined ? `${balance} ${network?.nativeCurrency?.symbol || ''}` : 'Loading...'}
                </WalletDropdownBalance>
                <WalletDisconnectButton
                  onClick={() => {
                    disconnectWallet()
                    setIsDropdownOpen(false)
                  }}
                >
                  Disconnect
                </WalletDisconnectButton>
              </WalletDropdown>
            )}
          </div>
        ) : (
          <ConnectButton onClick={handleConnectWallet} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </ConnectButton>
        )} */}
      </RightSection>
    </HeaderContainer>
  )
}
