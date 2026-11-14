import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"], mono: ["var(--font-geist-mono)", "monospace"] },
      colors: {
        ink: { DEFAULT: "#0b1437", soft: "#4a5578", faint: "#8a93ad" },
        navy: { 50: "#eef1fb", 100: "#dbe1f6", 500: "#1833b2", 600: "#0f269a", 700: "#001c82", 900: "#050f45" },
        paper: "#f5f6fa",
        line: "#e4e7f0",
        up: "#0a7d4f",
        down: "#b3261e",
        warn: "#a15c00",
      },
      boxShadow: { card: "0 1px 2px rgba(11,20,55,.04), 0 4px 16px rgba(11,20,55,.04)" },
    },
  },
  plugins: [],
} satisfies Config;
