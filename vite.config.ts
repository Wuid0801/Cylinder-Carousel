import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./", // GitHub Pages 하위 경로에서도 동작하도록 상대 경로로 빌드
});
