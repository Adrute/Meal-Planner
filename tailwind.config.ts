import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Esto conecta la fuente de Google con Tailwind
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        background: "#F2F2F7", // Gris iOS
        foreground: "#1c1c1e",
      },
    },
  },
  plugins: [],
};
export default config;