import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:false,
  retries:0,
  timeout:45_000,
  expect:{timeout:8_000,toHaveScreenshot:{maxDiffPixelRatio:0.03}},
  reporter:"line",
  use:{...devices["Desktop Chrome"],baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure",screenshot:"only-on-failure"},
  webServer:{command:"npm run dev -- -p 3100",url:"http://127.0.0.1:3100/login",reuseExistingServer:true,timeout:120_000},
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
});
