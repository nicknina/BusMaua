/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azul: { DEFAULT: "#0B4EA2", escuro: "#0C2B5B", claro: "#E4EEFB", medio: "#A9C4EA" },
        tinta: "#14213D",
        cinza: { DEFAULT: "#6B7280", claro: "#9CA3AF", linha: "#DCDFE4" },
        fundo: "#EFEFEF",
        verde: { DEFAULT: "#1FA36B", claro: "#DDF3E8" },
        vermelho: { DEFAULT: "#E5484D", claro: "#FDE8E8" },
        ambar: { DEFAULT: "#F2A93B", escuro: "#8A5A00", claro: "#FDF1D8" },
        mapa: { DEFAULT: "#DCE6EF", verde: "#CFE5D3" },
      },
      fontFamily: {
        sans: ["Jost", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        cartao: "0 1px 2px rgba(20, 33, 61, 0.06)",
        botao: "0 6px 16px rgba(11, 78, 162, 0.25)",
      },
    },
  },
  plugins: [],
};
