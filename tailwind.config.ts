import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "estudio de tatuaje": tinta profunda, hueso y un acento dorado.
        ink: {
          950: "#0a0a0b",
          900: "#111113",
          800: "#1a1a1d",
          700: "#26262b",
          600: "#3a3a42",
        },
        bone: {
          50: "#faf8f5",
          100: "#f2ede6",
          200: "#e4dace",
          300: "#cdbfad",
        },
        accent: {
          DEFAULT: "#c6a15b", // dorado envejecido
          soft: "#d9bd84",
          deep: "#9c7c3f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
