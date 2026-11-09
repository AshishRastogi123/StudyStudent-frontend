/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#17212f",
        muted: "#687386",
        brand: {
          50: "#eff7ff",
          100: "#dceeff",
          500: "#3987ea",
          600: "#2673d5",
          700: "#205eae",
        },
        surface: "#f6f8fb",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(24, 42, 70, .07)",
      },
    },
  },
  plugins: [forms],
};
