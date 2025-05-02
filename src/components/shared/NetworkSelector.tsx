import React, { useState } from 'react'
import styled from 'styled-components'
import { SUPPORTED_NETWORKS } from '../../constants/networks'

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

export const NetworkSelector: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<number>(SUPPORTED_NETWORKS[0].id)

  return (
    <Container>
      {SUPPORTED_NETWORKS && (
        <Select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(Number(e.target.value))}
        >
          {SUPPORTED_NETWORKS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </Select>
      )}
    </Container>
  )
}