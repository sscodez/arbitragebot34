/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#1a1a1a",
        input: "#1a1a1a",
        ring: "#00E2A4",
        background: "#000000",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#00E2A4",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ff4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1a1a1a",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#00E2A4",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#0D0D0D",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
}
