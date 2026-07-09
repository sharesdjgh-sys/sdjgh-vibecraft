import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f6f2",
        surface: "#ffffff",
        ink: "#171a1f",
        muted: "#667085",
        line: "#d9ded6",
        teal: "#0f8b8d",
        blue: "#276ef1",
        coral: "#d65a31",
        lemon: "#f2c94c",
        leaf: "#2f7d32",
      },
      boxShadow: {
        soft: "0 12px 34px rgba(23, 26, 31, 0.08)",
        strong: "0 18px 48px rgba(23, 26, 31, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
