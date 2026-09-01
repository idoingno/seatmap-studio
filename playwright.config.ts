import { defineConfig, devices } from "@playwright/test";

process.env.NO_PROXY = process.env.NO_PROXY || "127.0.0.1,localhost,::1";
process.env.no_proxy = process.env.no_proxy || "127.0.0.1,localhost,::1";

const nodeBinary = process.env.NODE_BINARY || process.execPath;
const e2ePort = process.env.SEATMAP_E2E_PORT || "18180";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    // NO_PROXY/no_proxy 已在上方 process.env 行内注入，子进程自动继承，避免在命令里使用 unix 风格的赋值前缀（Windows 下无法执行）
    command: `${nodeBinary} ./node_modules/webpack-cli/bin/cli.js serve --host 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
