import React from 'react'
import styled from 'styled-components'
import { isAddress } from 'viem'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.textPrimary};
`

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${({ hasError, theme }) => (hasError ? theme.colors.critical : theme.colors.backgroundOutline)};
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  transition: border-color 0.2s ease;
  pointer-events: auto !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;

  &:hover {
    border-color: ${({ hasError, theme }) => (hasError ? theme.colors.critical : theme.colors.backgroundOutline)};
  }

  &:focus {
    outline: none;
    border-color: ${({ hasError, theme }) => (hasError ? theme.colors.critical : theme.colors.accentAction)};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral1};
    opacity: 0.5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.critical};
  font-size: 12px;
  margin-top: 4px;
`

interface HookInputProps {
  hookAddress: string
  onChange: (address: string) => void
  error?: string
}

export const HookInput: React.FC<HookInputProps> = ({ hookAddress, onChange, error }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    onChange(address)
  }

  const isValidAddress = hookAddress ? isAddress(hookAddress) : true

  return (
    <Container>
      <Label>Hook Contract Address</Label>
      <InputWrapper>
        <Input
          type="text"
          value={hookAddress}
          onChange={handleChange}
          placeholder="0x..."
          hasError={!isValidAddress || !!error}
        />
      </InputWrapper>
      {(!isValidAddress || error) && <ErrorMessage>{error || 'Invalid address format'}</ErrorMessage>}
    </Container>
  )
}