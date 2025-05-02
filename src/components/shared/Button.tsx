import styled from 'styled-components'
import { ThemeColors } from '../../theme/theme'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'critical'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  fullWidth?: boolean
  theme: ThemeColors
}

const getBackgroundColor = (props: ButtonProps) => {
  if (props.disabled) return props.theme.backgroundInteractive
  
  switch (props.variant) {
    case 'primary':
      return props.theme.accentAction
    case 'secondary':
      return props.theme.backgroundInteractive
    case 'outline':
      return 'transparent'
    case 'critical':
      return props.theme.accentCritical
    default:
      return props.theme.accentAction
  }
}

const getColor = (props: ButtonProps) => {
  if (props.disabled) return props.theme.neutral3
  
  switch (props.variant) {
    case 'primary':
      return props.theme.white
    case 'secondary':
      return props.theme.neutral1
    case 'outline':
      return props.theme.neutral1
    case 'critical':
      return props.theme.white
    default:
      return props.theme.white
  }
}

const getBorder = (props: ButtonProps) => {
  switch (props.variant) {
    case 'outline':
      return `1px solid ${props.theme.backgroundOutline}`
    default:
      return 'none'
  }
}

const getPadding = (props: ButtonProps) => {
  switch (props.size) {
    case 'small':
      return '6px 12px'
    case 'large':
      return '12px 20px'
    default:
      return '10px 16px'
  }
}

export const Button = styled.button<ButtonProps>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${getPadding};
  border: ${getBorder};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${getBackgroundColor};
  color: ${getColor};
  font-size: 16px;
  font-weight: 600;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: ${({ theme }) => theme.transition.duration.fast} all ease;
  user-select: none;

  &:hover {
    background: ${props => {
      if (props.disabled) return props.theme.backgroundInteractive
      
      switch (props.variant) {
        case 'primary':
          return props.theme.accentActive
        case 'secondary':
          return props.theme.backgroundModule
        case 'outline':
          return props.theme.backgroundModule
        case 'critical':
          return props.theme.accentFailure
        default:
          return props.theme.accentActive
      }
    }};
  }

  &:active {
    transform: scale(0.99);
  }
`

Button.defaultProps = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  fullWidth: false,
}
