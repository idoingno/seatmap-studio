import { expect, Page, test } from "@playwright/test";

test.describe("Seatmap Studio", () => {
  test.describe.configure({ mode: "serial" });

  const createMatrix = async (page: Page, rows: string, columns: string) => {
    const matrix = page.locator("#Matrix");
    const graph = page.locator(".x6-graph");
    await matrix.dragTo(graph, { targetPosition: { x: 500, y: 250 } });

    const modal = page.locator(".ant-modal").filter({ hasText: "矩阵配置" });
    await modal.locator("input").nth(0).fill(rows);
    await modal.locator("input").nth(1).fill(columns);
    await modal.locator(".ant-btn-primary").click();
  };

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

  test("guards template save until a layout exists", async ({ page }) => {
    await page.goto("/");

    await page.getByText("另存为模板").click();

    await expect(page.getByText("请先创建一个布局，再另存为模板")).toBeVisible();
    await expect(page.getByText("模板配置")).not.toBeVisible();
  });

  test("exports a seat map without runtime errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");

    await createMatrix(page, "2", "3");

    await expect(page.getByText("第1排")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByText("导出座位图").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("Seatmap Studio Demo-场地座位图.png");
    expect(pageErrors).toEqual([]);
  });

  test("creates and interacts with a large matrix without rendering every node", async ({ page }) => {
    test.setTimeout(45_000);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await expect(page.getByText("已加载最新版本")).toBeVisible();
    await page.waitForTimeout(750);

    const start = Date.now();
    await page.evaluate(() => (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(50, 50));
    await page.waitForFunction(() => (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes().length >= 2_500, undefined, {
      timeout: 30_000,
    });
    const createDuration = Date.now() - start;

    const visibleNodes = await page.locator(".x6-node").count();
    const modelNodes = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes().length ?? 0);
    const heapSize = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);

    const clickStart = Date.now();
    await page.locator(".x6-graph").click({ position: { x: 500, y: 250 } });
    const clickDuration = Date.now() - clickStart;

    expect(modelNodes).toBeGreaterThanOrEqual(2_500);
    expect(createDuration).toBeLessThan(30_000);
    expect(clickDuration).toBeLessThan(1_000);
    expect(visibleNodes).toBeLessThan(1_000);
    expect(heapSize).toBeLessThan(200 * 1024 * 1024);
    expect(pageErrors).toEqual([]);
  });
});
