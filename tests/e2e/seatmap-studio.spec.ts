import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import ExcelJs from "exceljs";

test.describe("Seatmap Studio", () => {
  test.describe.configure({ mode: "serial" });

  const createMatrix = async (page: Page, rows: string, columns: string) => {
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForFunction(
      () => Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) && typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
      undefined,
      { timeout: 15_000 }
    );
    await page.evaluate(
      async ({ expectedRows, expectedColumns }) => {
        await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(expectedRows, expectedColumns, 240, 120);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      },
      { expectedRows: Number(rows), expectedColumns: Number(columns) }
    );
    await page.waitForFunction(
      ({ expectedRows, expectedColumns }) => {
        const graphInstance = (window as any).__SEATMAP_STUDIO_GRAPH__;
        if (!graphInstance) {
          return false;
        }

        const nodes = graphInstance.getNodes?.() ?? [];
        const rowLabels = nodes.filter((node: any) => node?.data?.nodeType === "matrixRows");
        const chairs = nodes.filter((node: any) => node?.data?.nodeType === "matrixChair");

        return rowLabels.length >= expectedRows && chairs.length >= expectedRows * expectedColumns;
      },
      { expectedRows: Number(rows), expectedColumns: Number(columns) },
      { timeout: 15_000 }
    );
  };

  const createSeatUploadWorkbook = async () => {
    const workbook = new ExcelJs.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");

    sheet.getCell("A5").value = "排数/座位号";
    sheet.getCell("B5").value = "1";
    sheet.getCell("C5").value = "2";
    sheet.getCell("A6").value = "第1排";
    sheet.getCell("B6").value = "Ada Chen";
    sheet.getCell("C6").value = "Ben Lin";

    const filePath = path.join(os.tmpdir(), `seatmap-upload-${Date.now()}.xlsx`);
    const buffer = await workbook.xlsx.writeBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    return filePath;
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
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await expect(page.getByText("所属组织(4)")).toBeVisible();
    await expect(page.getByText("全球合伙人(2)")).toBeVisible();
    await expect(page.getByText("Product")).toBeVisible();
    await expect(page.getByText("Engineering")).toBeVisible();

    expect(consoleMessages).toEqual([]);
  });

  test("guards Excel export until a layout exists", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /下载 Excel 模板/ }).click();

    await expect(page.getByText("请先创建一个布局，再下载 Excel 模板")).toBeVisible();
  });

  test("guards seat upload until a file is selected", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /上传座位配置/ }).click();
    await expect(page.getByText("上传配置")).toBeVisible();
    await page.locator(".ant-modal").filter({ hasText: "上传配置" }).getByRole("button", { name: /提\s*交/ }).click();

    await expect(page.getByText("请上传文件")).toBeVisible();
  });

  test("imports seat assignments and refreshes arranged people", async ({ page }) => {
    const workbookPath = await createSeatUploadWorkbook();

    await page.goto("/");
    await page.getByText("引入模板").click();
    await expect(page.getByText("模板选择")).toBeVisible();

    await page.getByRole("button", { name: /Boardroom Demo/ }).click();
    await page.locator(".ant-modal").filter({ hasText: "模板选择" }).getByRole("button", { name: /提\s*交/ }).click();
    await expect(page.getByText("操作完成~")).toBeVisible();

    await page.getByText("上传座位配置").click();
    await expect(page.getByText("上传配置")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(workbookPath);
    await page.locator(".ant-modal").filter({ hasText: "上传配置" }).getByRole("button", { name: /提\s*交/ }).click();

    await expect(page.getByText("操作完成~")).toBeVisible();
    await expect(page.getByText("上传配置")).not.toBeVisible();
    await page.waitForFunction(() => {
      const graphInstance = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const nodes = graphInstance?.getNodes?.() ?? [];
      return nodes.filter((node: any) => node?.attrs?.xnode).length >= 2;
    });

    const assignedPeople = await page.evaluate(() => {
      const graphInstance = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const nodes = graphInstance?.getNodes?.() ?? [];
      return nodes
        .filter((node: any) => node?.attrs?.xnode)
        .map((node: any) => node.attrs.xnode.title)
        .sort();
    });

    expect(assignedPeople).toEqual(["Ada Chen", "Ben Lin"]);
    await expect(page.getByText("全部(2)")).toBeVisible();
  });

  test("opens the mock template chooser", async ({ page }) => {
    await page.goto("/");

    await page.getByText("引入模板").click();

    await expect(page.getByText("模板选择")).toBeVisible();
    await expect(page.getByText("Boardroom Demo")).toBeVisible();
    await expect(page.getByText("Workshop Demo")).toBeVisible();
    await expect(page.getByText("Roundtable Demo")).toBeVisible();
  });

  test("applies a mock template selection", async ({ page }) => {
    await page.goto("/");

    await page.getByText("引入模板").click();
    await expect(page.getByText("模板选择")).toBeVisible();

    await page.getByRole("button", { name: /Boardroom Demo/ }).click();
    await page.locator(".ant-modal").filter({ hasText: "模板选择" }).getByRole("button", { name: /提\s*交/ }).click();

    await expect(page.getByText("操作完成~")).toBeVisible();
    await expect(page.getByText("模板选择")).not.toBeVisible();
    await expect(page.getByText("第1排")).toBeVisible();
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
    await page.getByTestId("export-seatmap-button").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("Seatmap Studio Demo-场地座位图.png");
    expect(pageErrors).toEqual([]);
  });

  test("saves a template from the local preview image", async ({ page }) => {
    await page.goto("/");

    await createMatrix(page, "2", "3");
    await expect(page.getByText("第1排")).toBeVisible();

    await page.getByTestId("save-template-button").click();
    const templateModal = page.locator(".ant-modal").filter({ hasText: "模板配置" });
    const templateNameInput = templateModal.locator('input[placeholder="请输入模板名称"]');
    await expect(templateNameInput).toBeVisible();

    await templateNameInput.fill("Local Preview Template");
    await templateModal.locator(".ant-btn-primary").click();

    await expect(page.getByText("操作完成~")).toBeVisible();

    await page.getByText("引入模板").click();
    await expect(page.getByText("Local Preview Template")).toBeVisible();
  });

  test("clears the current layout from the header action", async ({ page }) => {
    await page.goto("/");

    await createMatrix(page, "2", "3");
    await expect(page.getByText("第1排")).toBeVisible();

    await page.locator("header .middle").getByText("清空画布").click();
    await expect(page.getByText("清空配置")).toBeVisible();
    await page.getByRole("button", { name: "清空布局" }).click();
    await page.locator(".ant-modal").filter({ hasText: "清空配置" }).getByRole("button", { name: /提\s*交/ }).click();

    await page.waitForFunction(() => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0, undefined, {
      timeout: 15_000,
    });
    await expect(page.getByText("第1排")).not.toBeVisible();
  });

  test("creates and interacts with a large matrix without rendering every node", async ({ page }) => {
    test.setTimeout(45_000);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForTimeout(750);

    const start = Date.now();
    await page.evaluate(async () => {
      await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(50, 50);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });
    await page.waitForFunction(() => (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes().length >= 2_500, undefined, {
      timeout: 30_000,
    });
    const createDuration = Date.now() - start;

    const visibleNodes = await page.locator(".x6-node").count();
    const modelNodes = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes().length ?? 0);
    const heapSize = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
    const perfState = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_PERF__ ?? null);

    const clickStart = Date.now();
    await page.locator(".x6-graph").click({ position: { x: 760, y: 180 }, force: true });
    const clickDuration = Date.now() - clickStart;

    expect(modelNodes).toBeGreaterThanOrEqual(2_500);
    expect(perfState?.largeGraphMode).toBe(true);
    expect(createDuration).toBeLessThan(30_000);
    expect(clickDuration).toBeLessThan(1_000);
    expect(visibleNodes).toBeLessThan(1_000);
    expect(heapSize).toBeLessThan(200 * 1024 * 1024);
    expect(pageErrors).toEqual([]);
  });

  test("keeps dense matrices responsive after zoom interactions", async ({ page }) => {
    test.setTimeout(45_000);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForTimeout(750);

    await page.evaluate(async () => {
      await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(50, 50);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });

    await page.waitForFunction(() => (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes().length >= 2_500, undefined, {
      timeout: 30_000,
    });

    const wheelStart = Date.now();
    await page.locator(".x6-graph").hover();
    await page.mouse.wheel(0, -600);
    await page.mouse.wheel(0, 600);
    const wheelDuration = Date.now() - wheelStart;

    const perfState = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_PERF__);
    const visibleNodes = await page.locator(".x6-node").count();

    expect(perfState?.cellCount ?? 0).toBeGreaterThanOrEqual(2_500);
    expect(wheelDuration).toBeLessThan(1_500);
    expect(visibleNodes).toBeLessThan(1_200);
  });
});
