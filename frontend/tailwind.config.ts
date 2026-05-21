import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Adicionando a raiz do frontend também, caso a pasta src não exista
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'fifa-green': '#CFF900', // Verde Neon oficial
        'fifa-purple': '#7A00FF', // Roxo profundo/vibrante
        'fifa-blue': '#00F0FF', // Ciano neon
        'fifa-red': '#FF004D', // Vermelho vivo e-sports
        'fifa-orange': '#FF5E00', // Laranja quente intenso
      }
    },
  },
  plugins: [],
};

export default config;