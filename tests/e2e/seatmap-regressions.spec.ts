import { expect, Page, test } from "@playwright/test";

const createMatrix = async (page: Page, rows: number, columns: number) => {
  await expect(page.getByText("已同步到最新版本")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) && typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
    undefined,
    { timeout: 30_000 }
  );
  await page.waitForFunction(() => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0, undefined, {
    timeout: 30_000,
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
    { timeout: 30_000 }
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

  const itemMetrics = await page.evaluate(() => {
    const menu = document.querySelector(".menu-dialog");
    if (!(menu instanceof HTMLElement)) {
      return null;
    }

    const menuRect = menu.getBoundingClientRect();
    const items = Array.from(menu.querySelectorAll("div"))
      .map((node) => {
        if (!(node instanceof HTMLElement)) {
          return null;
        }

        const text = (node.textContent || "").trim();
        if (!text) {
          return null;
        }

        const rect = node.getBoundingClientRect();
        return {
          text,
          fullyVisible:
            rect.top >= menuRect.top &&
            rect.left >= menuRect.left &&
            rect.right <= menuRect.right &&
            rect.bottom <= menuRect.bottom,
        };
      })
      .filter(Boolean);

    return items;
  });

  expect(itemMetrics?.length).toBeGreaterThanOrEqual(4);
  expect(itemMetrics?.every((item: any) => item.fullyVisible)).toBe(true);

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
    { timeout: 30_000 }
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

  test("supports seat multi-selection without runtime errors", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Seat selection regression is validated in Chromium.");

    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");
    const selectionState = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const selection = graph?.getPlugin?.("selection");
      const chairs = (graph?.getNodes?.() ?? [])
        .filter((node: any) => node?.data?.nodeType === "matrixChair")
        .sort((a: any, b: any) => String(a.data?.idt).localeCompare(String(b.data?.idt)))
        .slice(0, 3);

      const allowRubberbandWithoutEvent = selection?.allowRubberband?.(undefined, true);
      selection?.clean?.();
      selection?.select?.(chairs);

      return {
        allowRubberbandWithoutEvent,
        selectedCells: selection?.getSelectedCells?.().length ?? 0,
      };
    });

    expect(selectionState.allowRubberbandWithoutEvent).toBe(false);
    expect(selectionState.selectedCells).toBeGreaterThanOrEqual(2);
    await expect(page.locator(".x6-widget-selection-box")).toHaveCount(3);

    expect(pageErrors).toEqual([]);
  });
});
