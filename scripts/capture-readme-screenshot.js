// 生成 README 用的编辑器截图（screenshots/screenshot.png）：
// 自起 webpack-dev-server，加载示例模板后截取 1440x900 视口。
// 用法：node ./scripts/capture-readme-screenshot.js（或 pnpm capture:screenshot）

const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");

process.env.NO_PROXY = process.env.NO_PROXY || "127.0.0.1,localhost,::1";
process.env.no_proxy = process.env.no_proxy || "127.0.0.1,localhost,::1";

const cwd = path.resolve(__dirname, "..");
const nodeBinary = process.env.NODE_BINARY || process.execPath;
const port = Number(process.env.SEATMAP_SHOT_PORT || 18090);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const outputPath = path.join(cwd, "screenshots", "screenshot.png");

const waitForServer = () =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const retry = () => {
      if (Date.now() - startedAt > 120000) {
        reject(new Error("示例服务器未在 120 秒内启动"));
        return;
      }
      setTimeout(ping, 500);
    };
    const ping = () => {
      const request = http.get(baseUrl, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      request.on("error", retry);
    };
    ping();
  });

const run = async () => {
  const server = spawn(
    nodeBinary,
    [path.join("node_modules", "webpack-cli", "bin", "cli.js"), "serve", "--host", host, "--port", String(port)],
    { cwd, stdio: "ignore" }
  );

  try {
    await waitForServer();

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`${baseUrl}/`);
    await page.getByRole("button", { name: /所属组织/ }).waitFor({ timeout: 30000 });

    // 载入示例模板，让截图里的画布有真实内容
    await page.getByText("引入模板").click();
    await page.getByText("模板选择").waitFor();
    await page.getByRole("button", { name: /Boardroom Demo/ }).click();
    await page
      .locator(".ant-modal")
      .filter({ hasText: "模板选择" })
      .getByRole("button", { name: /提\s*交/ })
      .click();
    await page.getByText("操作完成~").waitFor();
    await page.waitForTimeout(900);

    await page.screenshot({ path: outputPath });
    await browser.close();
    console.log(`README 截图已更新 -> ${outputPath}`);
  } finally {
    server.kill();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
