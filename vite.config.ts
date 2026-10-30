import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: { target: "es2022", sourcemap: false, chunkSizeWarningLimit: 700 },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
