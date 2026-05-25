import { expect, test } from "@playwright/test";

test.describe("Seatmap Studio", () => {
  test("loads the editor directly with clean mock data", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      const isToolingNoise =
        text.includes("[webpack-dev-server]") ||
        text.includes("[HMR]") ||
        text.includes("Download the React DevTools") ||
        text.includes("Support for defaultProps will be removed");

      if (!isToolingNoise && message.type() !== "warning") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/Seatmap Studio/);
    await expect(page.getByText("会议室布局")).toBeVisible();
    await expect(page.getByText("已加载最新版本")).toBeVisible();
    await expect(page.getByText("所属组织(4)")).toBeVisible();
    await expect(page.getByText("全球合伙人(2)")).toBeVisible();
    await expect(page.getByText("Product")).toBeVisible();
    await expect(page.getByText("Engineering")).toBeVisible();

    expect(consoleMessages).toEqual([]);
  });

  test("guards Excel export until a layout exists", async ({ page }) => {
    await page.goto("/");

    await page.getByText("下载Excel模板").click();

    await expect(page.getByText("请先创建一个布局，再下载 Excel 模板")).toBeVisible();
  });

  test("opens the mock template chooser", async ({ page }) => {
    await page.goto("/");

    await page.getByText("引入模板").click();

    await expect(page.getByText("模板选择")).toBeVisible();
    await expect(page.getByText("Boardroom Demo")).toBeVisible();
    await expect(page.getByText("Workshop Demo")).toBeVisible();
    await expect(page.getByText("Roundtable Demo")).toBeVisible();
  });
});
