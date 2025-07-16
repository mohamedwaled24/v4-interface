import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Token } from '../../types'
import { useBalance } from '../../hooks/useBalance'
import { TokenModal } from './TokenModal'
import { useWalletClient } from 'wagmi';
import { ArrowDown } from '../shared/icons';

interface Props {
  label?: string
  token: Token | null
  onChange: (token: Token | null) => void
  error?: string
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  margin-bottom: 4px;
`

const InputContainer = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: stretch;
  flex-basis: auto;
  box-sizing: border-box;
  position: relative;
  min-height: 0px;
  min-width: 0px;
  flex-shrink: 0;
  flex-direction: column;
  cursor: pointer;
  outline-color: rgba(0, 0, 0, 0);
  background-image: linear-gradient(25deg, #741ff5, #e348ff);
  border-radius: 999999px;
  border-color: rgb(242, 242, 242);
  border-width: 1px;
  border-style: solid;
  box-shadow: rgba(34, 34, 34, 0.04) 0px 0px 10px;
  transform: scale(1);
  opacity: 1;
  padding: 3px 8px;
  gap: 4px;
  width: fit-content;
  max-width: 140px;
  transition: all 0.2s cubic-bezier(0.77, 0, 0.175, 1);

  &:hover {
    transform: scale(1.04);
  }
`

const TokenPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  padding: 0px 12px;
  height: 36px;
`

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  color: white;
`

const TokenLogo = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 14px;
  flex-shrink: 0;
`

const TokenDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`

const TokenSymbol = styled.span`
  color: white;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.accentCritical};
  font-size: 14px;
  margin-top: 4px;
`

export const TokenSelector: React.FC<Props> = ({ label, token, onChange, error }) => {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const provider = walletClient?.transport?.provider;
  // Only fetch balance if token address is available
  const { balance } = useBalance(
    token?.address,
    token?.chainId ?? chainId ?? undefined,
    provider
  );
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    onChange(null);
  }, [chainId]);

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSelectToken = (selectedToken: Token) => {
    console.log('Selected token address:', selectedToken.address);
    onChange(selectedToken)
  }

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <InputContainer $error={!!error} onClick={handleOpenModal}>
        {token ? (
          <TokenInfo>
            {token.logoURI ? (
              <img 
                src={token.logoURI} 
                alt={token.symbol} 
                style={{ width: '28px', height: '28px', borderRadius: '14px' }} 
              />
            ) : (
              <TokenLogo>{token.symbol[0]}</TokenLogo>
            )}
            <TokenDetails>
              <TokenSymbol>{token.symbol}</TokenSymbol>
            </TokenDetails>
          </TokenInfo>
        ) : (
          <TokenPlaceholder>
            Select token
            <span style={{ marginLeft: 1, display: 'inline-flex', verticalAlign: 'middle' , fontWeight:'bold' }}>
              <ArrowDown width={14} height={14} />
            </span>
          </TokenPlaceholder>
        )}
      </InputContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <TokenModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSelectToken={handleSelectToken}
        chainId={chainId || 0}
      />
    </Container>
  )
}