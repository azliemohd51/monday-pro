import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
        },
        status: {
          done: "#00C875",
          working: "#FDAB3D",
          stuck: "#E2445C",
          review: "#A25DDC",
          idle: "#C4C4C4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
