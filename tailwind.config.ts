import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        card: "var(--bg-card)",
        "card-hover": "var(--bg-card-hover)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        studio: {
          purple: "var(--purple)",
          "purple-light": "var(--purple-light)",
          "purple-bg": "var(--purple-bg)",
          gold: "var(--gold)",
          "gold-light": "var(--gold-light)",
          "gold-bg": "var(--gold-bg)",
          "gold-border": "var(--gold-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
