import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./", // GitHub Pages 하위 경로에서도 동작하도록 상대 경로로 빌드
  build: {
    // 캐러셀(/)과 카메라 플레이그라운드(/camera/)를 각각의 HTML 진입점으로 빌드한다
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        camera: fileURLToPath(new URL("./camera/index.html", import.meta.url)),
      },
    },
  },
});
