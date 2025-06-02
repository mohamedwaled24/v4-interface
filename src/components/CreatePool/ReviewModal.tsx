import React from 'react'
import styled from 'styled-components'

interface Token {
  address: string
  symbol: string
  decimals: number
  logoURI?: string
}

interface FeeOption {
  fee: number
  tickSpacing: number
}

interface PoolInfo {
  sqrtPriceX96: string
  liquidity: string
  tick: number
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePosition: () => Promise<void>
  token0: Token | null
  token1: Token | null
  token0Amount: string
  token1Amount: string
  feeInfo: FeeOption
  priceRange: { min: string, max: string, isFullRange: boolean }
  poolInfo?: PoolInfo | null
  isLoading: boolean
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContainer = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 20px;
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  color: white;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #333;
`

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: white;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: white;
  }
`

const ModalBody = styled.div`
  padding: 0 24px 20px;
`

const TokenPairSection = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const TokenPair = styled.h3`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
`

const FeeInfo = styled.div`
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

const Section = styled.div`
  margin-bottom: 24px;
`

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: white;
`

const PriceRangeInfo = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 12px;
`

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const PriceLabel = styled.span`
  color: #999;
`

const PriceValue = styled.span`
  color: white;
  font-weight: 500;
`

const TokenAmountContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const TokenAmount = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #2a2a2a;
  border-radius: 12px;
`

const TokenLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const TokenIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: white;
  font-size: 14px;
`

const TokenAmountText = styled.div`
  display: flex;
  flex-direction: column;
`

const AmountValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: white;
`

const CreateButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  border: none;
  background: #ff007a;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
  margin-top: 20px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.8;
  }
`

const ReviewModal = ({
  isOpen,
  onClose,
  onCreatePosition,
  token0,
  token1,
  token0Amount,
  token1Amount,
  feeInfo,
  priceRange,
  poolInfo,
  isLoading
}: ReviewModalProps) => {
  // Calculate real current price from sqrtPriceX96 if available
  const getRealCurrentPrice = (): string => {
    if (poolInfo?.sqrtPriceX96) {
      try {
        // Convert sqrtPriceX96 to human readable price
        const sqrtPriceX96 = BigInt(poolInfo.sqrtPriceX96);
        const Q96 = BigInt(2) ** BigInt(96);
        const priceSquared = sqrtPriceX96 * sqrtPriceX96;
        const price = priceSquared / (Q96 * Q96);
        
        // Adjust for token decimals
        const token0Decimals = token0?.decimals || 18;
        const token1Decimals = token1?.decimals || 18;
        const decimalAdjustment = BigInt(10) ** BigInt(token1Decimals - token0Decimals);
        
        const adjustedPrice = price * decimalAdjustment;
        const priceAsNumber = Number(adjustedPrice) / 1e18;
        
        return priceAsNumber.toFixed(4);
      } catch (error) {
        console.error('Error calculating price from sqrtPriceX96:', error);
        return '0';
      }
    }
    
    return '0';
  };

  const handleCreateClick = async () => {
    try {
      await onCreatePosition();
    } catch (error) {
      console.error('Error creating position:', error);
    }
  };

  if (!isOpen) return null;

  const realCurrentPrice = getRealCurrentPrice();

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Creating position</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          <TokenPairSection>
            <TokenPair>
              {token0?.symbol || '?'} / {token1?.symbol || '?'}
            </TokenPair>
            <FeeInfo>
              <span>v4</span>
              <span>•</span>
              <span>{feeInfo ? ((feeInfo.fee / 10000) * 100).toFixed(2) : '0.00'}%</span>
            </FeeInfo>
          </TokenPairSection>

          <Section>
            <SectionTitle>Selected Range</SectionTitle>
            <PriceRangeInfo>
              <PriceRow>
                <PriceLabel>Min price</PriceLabel>
                <PriceValue>
                  {priceRange.isFullRange ? '0' : priceRange.min} {token1?.symbol || 'TOKEN1'}/{token0?.symbol || 'TOKEN0'}
                </PriceValue>
              </PriceRow>
              <PriceRow>
                <PriceLabel>Max price</PriceLabel>
                <PriceValue>
                  {priceRange.isFullRange ? '∞' : priceRange.max} {token1?.symbol || 'TOKEN1'}/{token0?.symbol || 'TOKEN0'}
                </PriceValue>
              </PriceRow>
              {realCurrentPrice !== '0' && (
                <PriceRow>
                  <PriceLabel>Current price</PriceLabel>
                  <PriceValue>{realCurrentPrice} {token1?.symbol || 'TOKEN1'}/{token0?.symbol || 'TOKEN0'}</PriceValue>
                </PriceRow>
              )}
            </PriceRangeInfo>
          </Section>

          <Section>
            <SectionTitle>Depositing</SectionTitle>
            <TokenAmountContainer>
              <TokenAmount>
                <TokenLeft>
                  {token0?.logoURI ? (
                    <img 
                      src={token0.logoURI} 
                      alt={token0.symbol || 'Token'} 
                      style={{ width: '32px', height: '32px', borderRadius: '16px' }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <TokenIcon>{token0?.symbol?.[0] || '?'}</TokenIcon>
                  )}
                  <TokenAmountText>
                    <AmountValue>{token0Amount || '0'} {token0?.symbol || 'TOKEN0'}</AmountValue>
                  </TokenAmountText>
                </TokenLeft>
              </TokenAmount>

              <TokenAmount>
                <TokenLeft>
                  {token1?.logoURI ? (
                    <img 
                      src={token1.logoURI} 
                      alt={token1.symbol || 'Token'} 
                      style={{ width: '32px', height: '32px', borderRadius: '16px' }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <TokenIcon>{token1?.symbol?.[0] || '?'}</TokenIcon>
                  )}
                  <TokenAmountText>
                    <AmountValue>{token1Amount || '0'} {token1?.symbol || 'TOKEN1'}</AmountValue>
                  </TokenAmountText>
                </TokenLeft>
              </TokenAmount>
            </TokenAmountContainer>
          </Section>

          <CreateButton 
            onClick={handleCreateClick} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </CreateButton>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ReviewModal;
