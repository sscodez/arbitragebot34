/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'

const config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        foreground: '#FFFFFF',
        card: '#141414',
        'card-foreground': '#FFFFFF',
        primary: '#00F7BF',
        'primary-foreground': '#000000',
        secondary: '#1C1C1C',
        'secondary-foreground': '#FFFFFF',
        muted: '#262626',
        'muted-foreground': '#A3A3A3',
        accent: '#00F7BF',
        'accent-foreground': '#000000',
        destructive: '#FF5757',
        'destructive-foreground': '#FFFFFF',
        border: '#262626',
        input: '#1C1C1C',
        ring: '#00F7BF',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 247, 191, 0.15)',
      },
    },
  },
  plugins: [forms],
}

export default config
