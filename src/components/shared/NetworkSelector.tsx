import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWalletContext } from '../../contexts/WalletContext'
import { toast } from 'react-toastify'

const Container = styled.div`
  position: relative;
`

const Select = styled.select`
  appearance: none;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 14px;
  cursor: pointer;
  outline: none;
  min-width: 120px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent1};
  }
`

const NetworkOption = styled.option`
  padding: 8px;
`

interface NetworkSelectorProps {
  className?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ className }) => {
  const { chainId, switchNetwork, isConnected, network } = useWalletContext()
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(chainId)
  const [isChangingNetwork, setIsChangingNetwork] = useState(false)

  useEffect(() => {
    if (chainId) {
      setSelectedNetwork(chainId)
    }
  }, [chainId])

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const networkId = Number(e.target.value)
    if (!isConnected) {
      toast.warning('Please connect your wallet first')
      return
    }
    if (networkId === chainId) {
      return // Already on this network
    }
    setIsChangingNetwork(true)
    try {
      await switchNetwork(networkId)
      toast.success(`Switched to network ${networkId}`)
    } catch (error) {
      toast.error('Failed to switch network. Please try again.')
      if (chainId) {
        setSelectedNetwork(chainId)
      }
    } finally {
      setIsChangingNetwork(false)
    }
  }

  // Only show the connected network
  if (!isConnected || !network) return null

  return (
    <Container className={className}>
      <Select
        value={selectedNetwork ?? ''}
        onChange={handleNetworkChange}
        disabled={isChangingNetwork || !isConnected}
      >
        <NetworkOption key={network.chainId} value={network.chainId}>
          {network.name || `Chain ${network.chainId}`}
        </NetworkOption>
      </Select>
    </Container>
  )
}