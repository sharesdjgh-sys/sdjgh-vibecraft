import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f3ea",
        ink: "#24231f",
        line: "#d8d1c2",
        pine: "#1f6f5b",
        mint: "#d8eee6",
        amber: "#b7791f",
        blush: "#b14b62",
      },
      boxShadow: {
        panel: "0 16px 48px rgba(36, 35, 31, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
