import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useWalletContext } from '../../contexts/WalletContext'
import { toast } from 'react-toastify'

const Container = styled.div`
  position: relative;
  z-index: 100;
  margin-right: 8px;
`

const NetworkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  border: none;
  border-radius: 16px;
  padding: 6px 12px; // Slightly smaller padding
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  
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

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
  margin-left: 4px;
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.2s ease;
`

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.colors.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
  width: 200px;
  z-index: 100;
  overflow: hidden;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
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
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const ActiveIndicator = styled.div`
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentSuccess};
`

interface NetworkDropdownProps {
  className?: string;
}

export const NetworkDropdown: React.FC<NetworkDropdownProps> = ({ className }) => {
  const { chainId, network, switchNetwork, isConnected } = useWalletContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isChangingNetwork, setIsChangingNetwork] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Only show the connected network
  if (!isConnected || !network) return null

  return (
    <Container className={className} ref={dropdownRef}>
      <NetworkButton onClick={() => setIsOpen(!isOpen)} disabled={isChangingNetwork}>
        <NetworkDot />
        {network.name || `Chain ${network.chainId}`}
        <ChevronIcon $isOpen={isOpen}>▾</ChevronIcon>
      </NetworkButton>
      {/* No dropdown list, only show current network */}
    </Container>
  )
}
