import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    min-height: 100vh;
    background: linear-gradient(120deg, #f4efff 0%, #ffffff 100%);
    background-attachment: fixed;
  }
`;

export default GlobalStyle; 