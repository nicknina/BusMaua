import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, /api e /ws são encaminhados para o backend Spring Boot (porta 8080).
// "host: true" deixa o app acessível pelo celular na mesma rede Wi-Fi.
// allowedHosts libera o túnel HTTPS do ngrok (o GPS do navegador exige HTTPS fora do localhost).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": "http://localhost:8080",
      "/ws": { target: "ws://localhost:8080", ws: true },
    },
  },
});
