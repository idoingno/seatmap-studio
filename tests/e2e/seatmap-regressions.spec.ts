import { expect, Page, test } from "@playwright/test";

const createMatrix = async (page: Page, rows: number, columns: number) => {
  await expect(page.getByText("已同步到最新版本")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) && typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
    undefined,
    { timeout: 15_000 }
  );
  await page.waitForFunction(() => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0, undefined, {
    timeout: 15_000,
  });

  await page.evaluate(
    async ({ expectedRows, expectedColumns }) => {
      await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(expectedRows, expectedColumns, 240, 120);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    },
    { expectedRows: rows, expectedColumns: columns }
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
    { expectedRows: rows, expectedColumns: columns },
    { timeout: 15_000 }
  );
};

const loadTemplate = async (page: Page, templateName: string) => {
  await page.getByText("引入模板").click();
  await expect(page.getByText("模板选择")).toBeVisible();
  await page.getByRole("button", { name: new RegExp(templateName) }).click();
  await page.locator(".ant-modal").filter({ hasText: "模板选择" }).getByRole("button", { name: /提\s*交/ }).click();
  await expect(page.getByText("操作完成~")).toBeVisible();
  await expect(page.getByText("模板选择")).not.toBeVisible();
  await expect(page.getByText("第1排")).toBeVisible();
  await page.waitForTimeout(600);
};

const capturePageErrors = (page: Page) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
};

const openMatrixMenu = async (
  page: Page,
  shape: "add-menu-react-node" | "minus-menu-react-node",
  x = 320,
  y = 160
) => {
  const anchor = await page.evaluate(
    ({ menuShape, localX, localY }) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      graph.addNode({
        shape: menuShape,
        x: localX,
        y: localY,
      });

      const point = graph.localToClient(localX, localY);
      return { x: point.x, y: point.y };
    },
    { menuShape: shape, localX: x, localY: y }
  );

  const menu = page.locator(".menu-dialog");
  await expect(menu).toBeVisible();

  const menuBox = await menu.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(Math.abs(menuBox!.x - anchor.x)).toBeLessThan(140);
  expect(Math.abs(menuBox!.y - anchor.y)).toBeLessThan(140);

  return menu;
};

const readMatrixSnapshot = async (page: Page) => {
  return page.evaluate(() => {
    const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
    const nodes = graph?.getNodes?.() ?? [];
    const parent = nodes.find((node: any) => node?.data?.nodeType === "matrixContainer");
    const chairs = nodes.filter((node: any) => node?.data?.nodeType === "matrixChair");
    const invalidChairIds = chairs
      .filter((node: any) => node?.data?.visible !== true || node?.data?.nodeType !== "matrixChair")
      .map((node: any) => node.id);

    return {
      rows: parent?.data?.rows ?? 0,
      columns: parent?.data?.columns ?? 0,
      chairCount: chairs.length,
      invalidChairIds,
    };
  });
};

const expectMatrixShape = async (page: Page, rows: number, columns: number) => {
  await page.waitForFunction(
    ({ expectedRows, expectedColumns }) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const nodes = graph?.getNodes?.() ?? [];
      const parent = nodes.find((node: any) => node?.data?.nodeType === "matrixContainer");
      const chairs = nodes.filter((node: any) => node?.data?.nodeType === "matrixChair");
      const invalidChairCount = chairs.filter((node: any) => node?.data?.visible !== true).length;

      return (
        parent?.data?.rows === expectedRows &&
        parent?.data?.columns === expectedColumns &&
        chairs.length === expectedRows * expectedColumns &&
        invalidChairCount === 0
      );
    },
    { expectedRows: rows, expectedColumns: columns },
    { timeout: 15_000 }
  );

  const snapshot = await readMatrixSnapshot(page);
  expect(snapshot).toEqual({
    rows,
    columns,
    chairCount: rows * columns,
    invalidChairIds: [],
  });
};

test.describe("Seatmap Studio regressions", () => {
  test.describe.configure({ mode: "serial" });

  test("keeps matrix add/remove menus usable across every direction", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");
    await expectMatrixShape(page, 2, 4);

    let menu = await openMatrixMenu(page, "add-menu-react-node");
    await menu.getByText("插入最上 1 行").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 3, 4);

    menu = await openMatrixMenu(page, "add-menu-react-node");
    await menu.getByText("插入最下 1 行").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 4, 4);

    menu = await openMatrixMenu(page, "add-menu-react-node");
    await menu.getByText("插入最左 1 列").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 4, 5);

    menu = await openMatrixMenu(page, "add-menu-react-node");
    await menu.getByText("插入最右 1 列").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 4, 6);

    menu = await openMatrixMenu(page, "minus-menu-react-node");
    await menu.getByText("删除最右 1 列").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 4, 5);

    menu = await openMatrixMenu(page, "minus-menu-react-node");
    await menu.getByText("删除最左 1 列").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 4, 4);

    menu = await openMatrixMenu(page, "minus-menu-react-node");
    await menu.getByText("删除最上 1 行").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 3, 4);

    menu = await openMatrixMenu(page, "minus-menu-react-node");
    await menu.getByText("删除最下 1 行").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 2, 4);

    expect(pageErrors).toEqual([]);
  });

  test("supports ctrl-drag seat selection without runtime errors", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Seat selection regression is validated in Chromium.");

    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");

    const selectionRegion = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const chairs = (graph?.getNodes?.() ?? [])
        .filter((node: any) => node?.data?.nodeType === "matrixChair")
        .sort((a: any, b: any) => String(a.data?.idt).localeCompare(String(b.data?.idt)))
        .slice(0, 3)
        .map((node: any) => {
          const rect = graph.findViewByCell(node)?.container?.getBoundingClientRect?.();
          return rect
            ? {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
              }
            : null;
        })
        .filter(Boolean);

      if (chairs.length < 2) {
        return null;
      }

      const left = Math.min(...chairs.map((item: any) => item.left));
      const top = Math.min(...chairs.map((item: any) => item.top));
      const right = Math.max(...chairs.map((item: any) => item.right));
      const bottom = Math.max(...chairs.map((item: any) => item.bottom));

      return {
        startX: left - 120,
        startY: top - 120,
        endX: right + 18,
        endY: bottom + 18,
      };
    });

    expect(selectionRegion).not.toBeNull();

    await page.keyboard.down("Control");
    await page.mouse.move(selectionRegion!.startX, selectionRegion!.startY);
    await page.mouse.down();
    await page.mouse.move(selectionRegion!.endX, selectionRegion!.endY, { steps: 24 });
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.keyboard.up("Control");

    await page.waitForFunction(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      return (graph?.getSelectedCells?.().length ?? 0) >= 2;
    }, undefined, { timeout: 15_000 });

    await expect(page.locator(".x6-widget-selection-box")).toHaveCount(3);

    expect(pageErrors).toEqual([]);
  });
});
