/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#00E2A4',
          foreground: '#000000',
          hover: '#00c48e',
        },
        secondary: {
          DEFAULT: '#1a1a1a',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ff4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#262626',
          foreground: '#a3a3a3',
        },
        accent: {
          DEFAULT: '#00E2A4',
          foreground: '#000000',
        },
        card: {
          DEFAULT: '#1a1a1a',
          foreground: '#ffffff',
        },
        border: '#262626',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 226, 164, 0.3)',
      },
    },
  },
  plugins: [],
}
