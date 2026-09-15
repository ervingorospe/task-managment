import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        link: "#0000FF",
        canvas: "#F7F8F7",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0E241C",
          muted: "#5B6B65",
          faint: "#94A39D",
        },
        line: "#DCE3E0",
        accent: {
          DEFAULT: "#32CD32", // was #00FA9A
          hover: "#28A428", // was #00C278
          subtle: "#E9F7E9", // was #E2F8F0
          text: "#1E7B1E", // was #007A4B
        },
        danger: {
          DEFAULT: "#E5484D",
          subtle: "#FCEBEB",
        },
        warning: {
          DEFAULT: "#E2A03F",
          subtle: "#FAEEDA",
        },
        status: {
          todo: "#94A39D",
          progress: "#3B82C4",
          done: "#00C278",
          blocked: "#E5484D",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
