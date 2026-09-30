import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // WebGL을 CPU(SwiftShader)로 그리므로 브라우저 여러 개를 동시에 띄우면 서로 CPU를 빼앗아 시간 초과가 난다
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 10_000 },
  use: { baseURL: "http://localhost:4173", trace: "on-first-retry" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // GPU가 없는 CI에서도 WebGL이 동작하도록 SwiftShader(소프트웨어 렌더러)를 쓴다
        launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
      },
    },
  ],
  // dist를 서빙한다. 먼저 npm run build가 필요하다 (npm run e2e가 둘 다 실행)
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
