import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/360degreefeedback/",
  server: {
    host: "0.0.0.0",
    port: 9008,
    allowedHosts: ["adityauniversity.in"]
  }
});