import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
    background: #0a0b0e;
    color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #111318;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #2a2d35;
    border-radius: 4px;
    &:hover {
      background: #3a3d45;
    }
  }

  a {
    color: #00ff88;
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      color: #33ff9f;
    }
  }

  button {
    cursor: pointer;
  }

  input, textarea {
    font-family: inherit;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Utility Classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .slide-up {
    animation: slideUp 0.4s ease-out;
  }

  .text-gradient {
    background: linear-gradient(45deg, #00ff88, #2962ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .glass-effect {
    background: rgba(26, 29, 36, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

export default GlobalStyles;
