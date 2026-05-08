import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "subcranial-amira-strengtheningly.ngrok-free.dev",
      "*.ngrok-free.dev",
      "*.ngrok.io",
    ],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
