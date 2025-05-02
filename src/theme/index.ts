// Theme based on Uniswap interface theme
export const darkTheme = {
  colors: {
    background: '#131313',
    backgroundModule: '#191919',
    backgroundInteractive: '#303030',
    backgroundOutline: '#404040',
    accentAction: '#FC72FF', // Uniswap pink
    accentActive: '#9B4CFF',
    accentSuccess: '#27AE60',
    accentWarning: '#F3841E',
    accentFailure: '#FD4040',
    accentCritical: '#FF0000',
    neutral1: '#FFFFFF',
    neutral2: '#C3C5CB',
    neutral3: '#8F96AC',
    textPrimary: '#FFFFFF',
    textSecondary: '#C3C5CB',
    textTertiary: '#8F96AC',
  },
  shadows: {
    elevation: '0px 4px 16px rgba(0, 0, 0, 0.12)',
  },
  opacities: {
    hover: 0.6,
    click: 0.4,
    disabled: 0.5,
    enabled: 1,
  },
  fonts: {
    body: 'Inter, sans-serif',
    heading: 'Inter, sans-serif',
    code: 'monospace',
  },
  fontSizes: {
    micro: '10px',
    small: '12px',
    medium: '14px',
    large: '16px',
    h3: '20px',
    h2: '24px',
    h1: '36px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '999px',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
}

export type Theme = typeof darkTheme
