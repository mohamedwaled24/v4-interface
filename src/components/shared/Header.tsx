import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useConnectModal } from '@rainbow-me/rainbowkit';
import paiLight from '../../../public/pai-light.png'
import { Search } from './icons/Search';
import { FaWallet } from 'react-icons/fa';
import { MdWidgets } from 'react-icons/md';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

// Define interface for navigation types
export enum NavType {
  Home = 'home',
  About = 'about',
  Projects = 'projects',
  RoadMap = 'Road Map',
  News = 'News',
  Swap = 'trade',
}

interface HeaderProps {
  activeNav: NavType;
  onNavChange: (nav: NavType) => void;
}

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28px 10px;
  background-color: transparent;
  height: auto;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  gap: 12px;
  left: 0;
  top: 0;
  z-index: 9;

  @media (max-width: 1280px) {
    max-width: 100%;
    padding-left: 16px;
    padding-right: 16px;
  }
  @media (max-width: 600px) {
    padding-left: 8px;
    padding-right: 8px;
  }
`;

const MobileSearchButton = styled.button`
  display: none;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  
  @media (max-width: 600px) {
    display: flex;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  line-height: 1;
`;

const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  width: 180px;
  img {
    width: 100%;
    object-fit: contain;
  }
`;

const MobileMenuButton = styled.button`
  display: flex;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #000;
  cursor: pointer;
  margin-left: 4px;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #f4efff;
    color: #741ff5;
  }
  @media (min-width: 1200px) {
    display: none;
  }
`;

const LogoDropdownMenu = styled.div`
  position: absolute;
  top: 56px;
  left: 12px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 280px;
  padding: 16px 0;
  width: 280px;
`;

const DropdownSection = styled.div`
  padding: 0 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DropdownSectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const DropdownMenuItem = styled.a`
  display: block;
  padding: 8px 0;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    color: rgb(255, 55, 199);
  }
`;

const DownloadWalletButton = styled.button`
  width: 100%;
  background: rgb(255, 55, 199);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin: 16px 0;
  
  &:hover {
    background: rgb(230, 50, 180);
  }
`;

const DropdownFooter = styled.div`
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 16px;
`;

const SocialMediaSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const SocialIcon = styled.a`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  
  &:hover {
    color: rgb(255, 55, 199);
  }
`;

const LegacyPolicySection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
`;

const LegacyPolicyDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const LegacyPolicyButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    color: rgb(255, 55, 199);
  }
`;

const LegacyPolicyMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  bottom: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 8px 0;
  min-width: 120px;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
`;

const LegacyPolicyMenuItem = styled.a`
  display: block;
  padding: 6px 12px;
  color: #333;
  text-decoration: none;
  font-size: 12px;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 32px;
  /* Removed left margin for right alignment */
  margin-right: 32px; /* add space between nav and social icons */
  @media (max-width: 1200px) {
    display: none;
  }
`;

const NavLink = styled.a<{ $active?: boolean }>`
  color: ${({ theme, $active }) =>
    $active ? `#741ff5` : `#0f051d`};
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.4s ease; // Always apply smooth color transition
  &:hover {
    color: #741ff5;
  }
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`
const ChevronIcon = styled.span<{ $isOpen: boolean }>`
  margin-left: 4px;
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.2s ease;
`
const SocialIconsWrapper = styled.div`
  display: flex;
  gap: 18px;
  margin-right: 24px; /* add space between social icons and connect button */
  @media (max-width: 1200px) {
    display: none;
  }
`;

const SocialIconInline = styled.a`
  width: 18px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  text-decoration: none;
  transition: color 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  &:hover {
    color: #741ff5;
  }
`;

const CustomConnectButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  padding: 12px 40px; /* wider */
  border-radius: 999px; /* extra pill shape */
  border: 2px solid rgba(0,0,0,.15);
  color: var(--tg-heading-color, #0f051d);
  background: transparent;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.77, 0, 0.175, 1); /* even smoother */
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,.10);

  &:hover, &:focus {
    background-image: linear-gradient(25deg, #741ff5, #e348ff);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 1rem 3rem rgba(116,31,245,0.15);
  }

  @media (max-width: 1200px) {
    display: none;
  }
`;

const WalletIconButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #000;
  font-size: 28px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #f4efff;
    color: #741ff5;
  }
  @media (max-width: 1200px) {
    display: flex;
  }
`;

const SidebarOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.2);
  z-index: 2000;
`;

const SidebarDrawer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 80vw;
  max-width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: 2px 0 16px rgba(0,0,0,0.08);
  z-index: 2000;
  transform: translateX(${({ isOpen }) => (isOpen ? '0' : '100%')});
  transition: transform 0.3s cubic-bezier(0.77, 0, 0.175, 1);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 24px 24px;
`;

const SidebarNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 32px;
`;

const SidebarNavLink = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  text-align: left;
  width: 100%;
  font-size: 18px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? '#741ff5' : '#0f051d')};
  padding: 18px 24px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: color 0.3s;
  &:hover {
    color: #741ff5;
    background: #f8f9fa;
  }
`;

const SidebarSocials = styled.div`
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 24px;
`;

const SidebarConnectButton = styled(CustomConnectButton)`
  width: 80%;
  margin: 32px auto 0 auto;
  display: block;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  color: #741ff5;
  cursor: pointer;
  padding: 0 0 0 16px;
`;

// Custom hook to detect if screen is large (>=1200px)
function useIsLargeScreen() {
  const [isLarge, setIsLarge] = React.useState(() => window.innerWidth >= 1200);
  React.useEffect(() => {
    const onResize = () => setIsLarge(window.innerWidth >= 1200);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isLarge;
}
export const Header: React.FC<HeaderProps> = ({ activeNav, onNavChange }) => {
  // Remove navigate and any router logic
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // Dropdown open state for mobile logo
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const { openConnectModal } = useConnectModal();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
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
  
  const isLargeScreen = useIsLargeScreen();
  const {address, isConnected} = useAccount();
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoIcon>
          <img src={paiLight} alt="Uniswap Logo" />
        </LogoIcon>
      </LogoContainer>
      <RightSection>
        <NavLinks>
          {/* nav links here */}
          <NavLink
            $active={activeNav === NavType.Home}
            onClick={() => onNavChange(NavType.Home)}
          >
            Home
          </NavLink>
          <NavLink
            $active={activeNav === NavType.About}
            onClick={() => onNavChange(NavType.About)}
          >
            About
          </NavLink>
          <NavLink
            $active={activeNav === NavType.Projects}
            onClick={() => onNavChange(NavType.Projects)}
          >
            Projects
          </NavLink>
          <NavLink 
            $active={activeNav === NavType.RoadMap}
            onClick={() => onNavChange(NavType.RoadMap)}
          >
            Road Map
          </NavLink>
          <NavLink 
            $active={activeNav === NavType.News}
            onClick={() => onNavChange(NavType.News)}
          >
            News
          </NavLink>
          <NavLink 
            $active={activeNav === NavType.Swap}
            onClick={() => onNavChange(NavType.Swap)}
          >
            Swap
          </NavLink>
        </NavLinks>
        <SocialIconsWrapper>
          <SocialIconInline href="#" title="Twitter" target="_blank" rel="noopener noreferrer">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.46 5.924c-.793.352-1.646.59-2.542.698a4.48 4.48 0 0 0 1.965-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 11.08 9.03c0 .352.04.695.116 1.022C7.728 9.89 4.1 8.1 1.671 5.149a4.48 4.48 0 0 0-.606 2.254c0 1.555.792 2.927 2.002 3.732a4.48 4.48 0 0 1-2.03-.561v.057a4.48 4.48 0 0 0 3.594 4.393c-.193.052-.397.08-.607.08-.148 0-.292-.014-.432-.04a4.48 4.48 0 0 0 4.184 3.116A8.98 8.98 0 0 1 2 19.54a12.68 12.68 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.94 8.94 0 0 1-2.54.697z"/>
            </svg>
          </SocialIconInline>
          <SocialIconInline href="#" title="Telegram" target="_blank" rel="noopener noreferrer">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.036 16.569l-.398 4.013c.57 0 .816-.244 1.113-.54l2.668-2.56 5.528 4.04c1.012.558 1.73.264 1.984-.936l3.6-16.8c.328-1.52-.552-2.12-1.536-1.76L2.22 9.23c-1.48.592-1.464 1.44-.256 1.824l4.32 1.35 10.02-6.32c.472-.296.9-.132.548.164"/>
            </svg>
          </SocialIconInline>
          <SocialIconInline href="#" title="Instagram" target="_blank" rel="noopener noreferrer">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm6.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </SocialIconInline>
        </SocialIconsWrapper>
        {
          !isConnected ? (
            <CustomConnectButton onClick={openConnectModal}>
              Connect Wallet
            </CustomConnectButton>
          ) : (
            <ConnectButton showBalance={false} accountStatus="avatar" />
          )
        }
        {
          !isConnected && (
            <WalletIconButton onClick={openConnectModal}>
              <FaWallet />
            </WalletIconButton>
          )
        }
        {!isLargeScreen && (
          <MobileMenuButton style={{ display: 'flex' }} onClick={() => setSidebarOpen(true)}>
            <MdWidgets />
          </MobileMenuButton>
        )}
      </RightSection>
      {/* Sidebar for mobile */}
      <SidebarOverlay isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />
      <SidebarDrawer isOpen={isSidebarOpen}>
        <SidebarHeader>
          <LogoIcon>
            <img src={paiLight} alt="Uniswap Logo" />
          </LogoIcon>
          <CloseButton onClick={() => setSidebarOpen(false)}>✕</CloseButton>
        </SidebarHeader>
        <SidebarNavLinks>
          <SidebarNavLink $active={activeNav === NavType.Home} onClick={() => { onNavChange(NavType.Home); setSidebarOpen(false); }}>Home</SidebarNavLink>
          <SidebarNavLink $active={activeNav === NavType.About} onClick={() => { onNavChange(NavType.About); setSidebarOpen(false); }}>About</SidebarNavLink>
          <SidebarNavLink $active={activeNav === NavType.Projects} onClick={() => { onNavChange(NavType.Projects); setSidebarOpen(false); }}>Projects</SidebarNavLink>
          <SidebarNavLink $active={activeNav === NavType.RoadMap} onClick={() => { onNavChange(NavType.RoadMap); setSidebarOpen(false); }}>Road Map</SidebarNavLink>
          <SidebarNavLink $active={activeNav === NavType.News} onClick={() => { onNavChange(NavType.News); setSidebarOpen(false); }}>News</SidebarNavLink>
          <SidebarNavLink $active={activeNav === NavType.Swap} onClick={() => { onNavChange(NavType.Swap); setSidebarOpen(false); }}>Swap</SidebarNavLink>
        </SidebarNavLinks>
        <SidebarSocials>
          <SocialIconInline href="#" title="Twitter" target="_blank" rel="noopener noreferrer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.46 5.924c-.793.352-1.646.59-2.542.698a4.48 4.48 0 0 0 1.965-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 11.08 9.03c0 .352.04.695.116 1.022C7.728 9.89 4.1 8.1 1.671 5.149a4.48 4.48 0 0 0-.606 2.254c0 1.555.792 2.927 2.002 3.732a4.48 4.48 0 0 1-2.03-.561v.057a4.48 4.48 0 0 0 3.594 4.393c-.193.052-.397.08-.607.08-.148 0-.292-.014-.432-.04a4.48 4.48 0 0 0 4.184 3.116A8.98 8.98 0 0 1 2 19.54a12.68 12.68 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.94 8.94 0 0 1-2.54.697z"/>
            </svg>
          </SocialIconInline>
          <SocialIconInline href="#" title="Instagram" target="_blank" rel="noopener noreferrer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm6.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </SocialIconInline>
          <SocialIconInline href="#" title="Telegram" target="_blank" rel="noopener noreferrer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.036 16.569l-.398 4.013c.57 0 .816-.244 1.113-.54l2.668-2.56 5.528 4.04c1.012.558 1.73.264 1.984-.936l3.6-16.8c.328-1.52-.552-2.12-1.536-1.76L2.22 9.23c-1.48.592-1.464 1.44-.256 1.824l4.32 1.35 10.02-6.32c.472-.296.9-.132.548.164"/>
            </svg>
          </SocialIconInline>
        </SidebarSocials>
          {
            (!isConnected
              ? <SidebarConnectButton onClick={() => { if (openConnectModal) openConnectModal(); setSidebarOpen(false); }}>
                  Connect Wallet
                </SidebarConnectButton>
              : <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                  <ConnectButton showBalance={false} />
                </div>
            )
          }
      </SidebarDrawer>
    </HeaderContainer>
  )
}
