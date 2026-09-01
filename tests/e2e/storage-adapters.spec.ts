import { promises as fs } from "node:fs";
import { expect, Page, test } from "@playwright/test";

const createMatrix = async (page: Page, rows = 3, columns = 4) => {
  await expect(page.getByText("已同步到最新版本")).toBeVisible();
  await page.waitForFunction(
    () =>
      Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) &&
      typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
    undefined,
    { timeout: 30_000 }
  );
  await page.evaluate(
    async (args) => {
      await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(args.rows, args.columns, 240, 120);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    },
    { rows, columns }
  );
  await page.waitForFunction(
    () =>
      (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().some((node: any) => node?.data?.nodeType === "matrixContainer"),
    undefined,
    { timeout: 30_000 }
  );
  // 等自动保存写回存储后端（顶栏出现已保存时间戳）
  await expect(page.getByText(/已保存 /)).toBeVisible();
};

const matrixContainerExists = (page: Page) =>
  page.waitForFunction(
    () =>
      (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().some((node: any) => node?.data?.nodeType === "matrixContainer"),
    undefined,
    { timeout: 30_000 }
  );

test.describe("Storage adapters", () => {
  test("persists the layout in IndexedDB across a page reload (default local mode)", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await createMatrix(page);

    await page.reload();
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await matrixContainerExists(page);
    await expect(page.getByText("第1排")).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("round-trips a layout through export and import JSON", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await createMatrix(page, 3, 5);

    // 导出：捕获下载事件并校验文件内容
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-layout-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/seatmap-layout-.*\.json$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const exported = JSON.parse(await fs.readFile(downloadPath as string, "utf8"));
    expect(Array.isArray(exported.schema)).toBe(true);
    expect(exported.schema.length).toBeGreaterThan(0);
    expect(exported.schema.every((item: any) => typeof item.id === "string" && typeof item.type === "string")).toBe(true);

    // 清空画布
    await page.locator("header .middle").getByText("清空画布").click();
    await expect(page.getByText("清空配置")).toBeVisible();
    await page.getByRole("button", { name: "清空布局" }).click();
    await page.locator(".ant-modal").filter({ hasText: "清空配置" }).getByRole("button", { name: /提\s*交/ }).click();
    await page.waitForFunction(() => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0, undefined, {
      timeout: 15_000,
    });

    // 导入刚导出的文件
    await page.getByTestId("import-layout-input").setInputFiles(downloadPath as string);
    await expect(page.getByText("布局已导入")).toBeVisible();
    await matrixContainerExists(page);
    await expect(page.getByText("第1排")).toBeVisible();

    // 导入结果同样持久化：刷新后仍在
    await expect(page.getByText(/已保存 /)).toBeVisible();
    await page.reload();
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await matrixContainerExists(page);

    expect(pageErrors).toEqual([]);
  });

  test("keeps the in-memory mock backend available via seatmap-api-mode=mock", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("seatmap-api-mode", "mock");
    });

    await page.goto("/");
    await createMatrix(page);

    // mock 后端不持久化：刷新后回到空画布（与历史 mockRequest 行为一致）
    await page.reload();
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForFunction(() => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0, undefined, {
      timeout: 30_000,
    });
  });
});
