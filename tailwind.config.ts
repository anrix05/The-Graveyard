import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    screens: {
      xs: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1280px",
        "3xl": "1440px",
        "4xl": "1600px",
      },
    },
    extend: {
      colors: {
        // v2 Surfaces & Lines
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--line)",
        border: "var(--line)",
        fg: "var(--fg)",
        muted: "var(--muted)",

        // Mode Accents
        "neon-green": "#39ff14", // Buy / For Sale
        amber: "#fbbf24",       // Adopt / Free Fork
        "blue-accent": "#3b82f6",// Collab / Seeking Partner
        "brand-red": "#ff2a2a",  // Brand highlight & danger

        // Button Fills (meeting 4.5:1 contrast)
        "btn-buy": "#39ff14",
        "btn-adopt": "#fbbf24",
        "btn-collab": "#2563eb",
        "btn-danger": "#dc2626",

        // Radix / Semantic Mappings
        background: "var(--bg)",
        foreground: "var(--fg)",
        primary: {
          DEFAULT: "#ff2a2a",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--fg)",
        },
      },
      borderRadius: {
        card: "20px",
        modal: "24px",
        input: "12px",
        popover: "16px",
      },
      zIndex: {
        header: "40",
        dropdown: "50",
        modal: "60",
        toast: "70",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        accent: ["var(--font-accent)", "Georgia", "serif"],
        serif: ["var(--font-accent)", "Georgia", "serif"],
      },
      boxShadow: {
        "glow-red": "0 0 28px rgba(255, 42, 42, 0.25)",
        "glow-neon": "0 0 24px rgba(57, 255, 20, 0.25)",
        "glow-amber": "0 0 24px rgba(251, 191, 36, 0.25)",
        "glow-blue": "0 0 24px rgba(59, 130, 246, 0.25)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;