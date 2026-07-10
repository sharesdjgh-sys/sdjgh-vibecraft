import type { Config } from "tailwindcss";

const withAlpha = (variable: string) =>
  `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: withAlpha("--color-canvas"),
        surface: withAlpha("--color-surface"),
        ink: withAlpha("--color-ink"),
        muted: withAlpha("--color-muted"),
        line: withAlpha("--color-line"),
        signal: withAlpha("--color-signal"),
        "signal-ink": withAlpha("--color-signal-ink"),
        "signal-soft": withAlpha("--color-signal-soft"),
        success: withAlpha("--color-success"),
        warning: withAlpha("--color-warning"),
        danger: withAlpha("--color-danger"),

        /* Temporary aliases keep the v2 surface coherent while it migrates. */
        teal: withAlpha("--color-signal"),
        blue: withAlpha("--color-signal"),
        coral: withAlpha("--color-signal"),
        lemon: withAlpha("--color-warning"),
        leaf: withAlpha("--color-success"),
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
        ],
        mono: [
          "var(--font-mono)",
        ],
      },
      boxShadow: {
        soft: "none",
        strong: "0 24px 64px rgba(25, 24, 21, 0.18)",
        drawer: "0 24px 64px rgba(25, 24, 21, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
