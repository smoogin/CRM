import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#328fff",
          600: "#1b6ff5",
          700: "#1458e1",
          800: "#1748b6",
          900: "#194090",
        },
      },
    },
  },
  plugins: [],
};

export default config;
