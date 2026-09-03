import { expect, Page, test } from "@playwright/test";

const createMatrix = async (page: Page, rows: number, columns: number, x = 240, y = 120) => {
  await expect(page.getByText(/已同步到最新版本|已保存 /)).toBeVisible();
  await page.waitForFunction(
    () =>
      Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) &&
      typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
    undefined,
    { timeout: 30_000 }
  );
  await page.waitForFunction(
    () => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0,
    undefined,
    {
      timeout: 30_000,
    }
  );

  await page.evaluate(
    async ({ expectedRows, expectedColumns, matrixX, matrixY }) => {
      await (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__(expectedRows, expectedColumns, matrixX, matrixY);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    },
    { expectedRows: rows, expectedColumns: columns, matrixX: x, matrixY: y }
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
  await page
    .locator(".ant-modal")
    .filter({ hasText: "模板选择" })
    .getByRole("button", { name: /提\s*交/ })
    .click();
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

const openMatrixMenu = async (page: Page, shape: "add-menu-react-node" | "minus-menu-react-node", x = 320, y = 160) => {
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

  test("opens matrix add and remove menus from the real hover tools", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");
    await expectMatrixShape(page, 2, 4);

    const hoverMatrix = async () => {
      const point = await page.evaluate(() => {
        const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
        const parent = graph.getNodes().find((node: any) => node?.data?.nodeType === "matrixContainer");
        const box = parent.getBBox();
        return graph.localToClient(box.x + 10, box.y + 10);
      });
      await page.mouse.move(point.x, point.y);
    };

    await hoverMatrix();
    const addTool = page.locator(".matrix-add-tool-hitbox");
    await expect(addTool).toBeVisible();
    await addTool.click();
    let menu = page.locator(".menu-dialog");
    await expect(menu).toBeVisible();
    await menu.getByText("插入最上 1 行").click();
    await expect(menu).not.toBeVisible();
    await expectMatrixShape(page, 3, 4);

    await hoverMatrix();
    const minusTool = page.locator(".matrix-minus-tool-hitbox");
    await expect(minusTool).toBeVisible();
    await minusTool.click();
    menu = page.locator(".menu-dialog");
    await expect(menu).toBeVisible();
    await menu.getByText("删除最上 1 行").click();
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
    await expect(page.getByText("已选择 3 个座位")).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("menu from the real add tool appears at the click point", async ({ page }) => {
    // 回归：x6-html-shape 的 htmlContainer 矩阵只在 translate/scale/position 变化时同步，
    // 首个 HTML 节点挂载瞬间图层矩阵过期，菜单会出现在错误位置直到拖动画布。
    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");

    const tool = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getNodes().find((n: any) => n?.data?.nodeType === "matrixContainer");
      parent.prop("position", { x: 220, y: 140 });
      const box = parent.getBBox();
      return graph.localToClient(box.x + box.width - 10, box.y + 6);
    });

    await page.mouse.move(120, 660);
    await page.mouse.move(tool.x, tool.y, { steps: 12 });
    const addTool = page.locator(".matrix-add-tool-hitbox");
    await expect(addTool).toBeVisible();
    await addTool.click();

    const menu = page.locator(".menu-dialog");
    await expect(menu).toBeVisible();
    // 等视图挂载与位置刷新完成（挂载是异步的），再断言最终落点与稳定性
    await page.waitForTimeout(600);

    const settle = await page.evaluate(async () => {
      const before = (document.querySelector(".menu-dialog") as HTMLElement).getBoundingClientRect();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const after = (document.querySelector(".menu-dialog") as HTMLElement).getBoundingClientRect();
      return {
        before: { x: before.x, y: before.y },
        after: { x: after.x, y: after.y },
      };
    });

    // 菜单稳定在点击点附近，且之后不因画布交互“跳位”（就是用户看到的不显示/延迟）。
    expect(Math.abs(settle.after.x - settle.before.x) + Math.abs(settle.after.y - settle.before.y)).toBeLessThanOrEqual(
      4
    );
    expect(Math.abs(settle.after.x - tool.x)).toBeLessThanOrEqual(90);
    expect(Math.abs(settle.after.y - tool.y)).toBeLessThanOrEqual(90);
  });

  test("hides and restores an empty seat with the mouse tool", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");

    const target = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const chair = graph.getNodes().find((node: any) => node?.data?.nodeType === "matrixChair");
      const box = chair.getBBox();
      return {
        id: chair.id,
        point: graph.localToClient(box.x + box.width / 2, box.y + box.height / 2),
      };
    });

    await page.mouse.move(target.point.x, target.point.y);
    const removeTool = page.locator('[data-tool-name="button-remove"]');
    await expect(removeTool).toBeVisible();
    await removeTool.click();
    await page.waitForFunction(
      (id) => (window as any).__SEATMAP_STUDIO_GRAPH__?.getCellById?.(id)?.data?.visible === false,
      target.id
    );

    await page.mouse.click(target.point.x, target.point.y);
    await page.waitForFunction(
      (id) => (window as any).__SEATMAP_STUDIO_GRAPH__?.getCellById?.(id)?.data?.visible === true,
      target.id
    );

    expect(pageErrors).toEqual([]);
  });

  test("moves a loaded matrix as one unit and keeps the persisted position", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");

    const initial = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getNodes().find((node: any) => node?.data?.nodeType === "matrixContainer");
      const children = parent
        .getChildren()
        .filter((node: any) => ["matrixChair", "matrixRows", "matrixColumnTopNum"].includes(node?.data?.nodeType))
        .slice(0, 6);
      const parentPosition = parent.getPosition();
      const parentBox = parent.getBBox();

      return {
        parentId: parent.id,
        parentPosition: { ...parentPosition },
        children: children.map((node: any) => ({ id: node.id, position: { ...node.getPosition() } })),
        dragPoint: graph.localToClient(parentBox.x + 5, parentBox.y + parentBox.height / 2),
      };
    });

    await page.mouse.move(initial.dragPoint.x, initial.dragPoint.y);
    await page.mouse.down();
    await page.mouse.move(initial.dragPoint.x + 120, initial.dragPoint.y + 70, { steps: 12 });
    await page.mouse.up();

    await page.waitForTimeout(1_400);

    const movement = await page.evaluate((snapshot) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getCellById(snapshot.parentId);
      const parentPosition = parent.getPosition();

      return {
        parent: {
          dx: parentPosition.x - snapshot.parentPosition.x,
          dy: parentPosition.y - snapshot.parentPosition.y,
        },
        children: snapshot.children.map((child: any) => {
          const position = graph.getCellById(child.id).getPosition();
          return {
            dx: position.x - child.position.x,
            dy: position.y - child.position.y,
          };
        }),
      };
    }, initial);

    expect(movement.parent.dx).toBeGreaterThan(100);
    expect(movement.parent.dy).toBeGreaterThan(50);
    expect(
      movement.children.every(
        (child: { dx: number; dy: number }) => child.dx === movement.parent.dx && child.dy === movement.parent.dy
      )
    ).toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test("assigns a person by dragging them onto an available seat", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await loadTemplate(page, "Boardroom Demo");

    const productNode = page.locator(".ant-tree-treenode").filter({ hasText: "Product" }).first();
    await productNode.locator(".ant-tree-switcher").click();
    await expect(productNode).toHaveClass(/ant-tree-treenode-switcher-open/);
    await expect(page.getByText("Research", { exact: true })).toBeVisible();
    await expect(page.locator(".ant-tree-treenode-motion")).toHaveCount(0);

    const designNode = page.locator(".ant-tree-treenode:visible").filter({ hasText: "Design" }).first();
    await expect(designNode).toBeVisible();
    await designNode.locator(".ant-tree-switcher").click();
    await expect(designNode).toHaveClass(/ant-tree-treenode-switcher-open/);
    // 等待树展开动画完全结束再拖拽：rc-tree 展开时节点布局仍在移动，
    // 负载较高时在此期间的 HTML5 dragstart 会被中途打断（该用例在套件环境下的偶发失败）。
    await expect(page.locator(".ant-tree-treenode-motion")).toHaveCount(0);

    const adaNode = page.locator(".ant-tree-treenode:visible").filter({
      has: page.locator('[data-name="Ada Chen"]'),
    });
    await expect(adaNode).toBeVisible();

    const target = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const chair = graph
        .getNodes()
        .find((node: any) => node?.data?.nodeType === "matrixChair" && node?.data?.visible && !node?.attrs?.xnode);
      const box = chair.getBBox();
      const point = graph.localToClient(box.x + box.width / 2, box.y + box.height / 2);

      return {
        chairId: chair.id,
        point,
      };
    });

    const graphBox = await page.locator(".x6-graph").boundingBox();
    expect(graphBox).not.toBeNull();
    await adaNode.dragTo(page.locator(".x6-graph"), {
      targetPosition: {
        x: target.point.x - graphBox!.x,
        y: target.point.y - graphBox!.y,
      },
    });

    await page.waitForFunction(
      (chairId) => {
        const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
        return graph?.getCellById?.(chairId)?.attrs?.xnode?.title === "Ada Chen";
      },
      target.chairId,
      { timeout: 15_000 }
    );

    const assignment = await page.evaluate((chairId) => {
      const chair = (window as any).__SEATMAP_STUDIO_GRAPH__.getCellById(chairId);
      return {
        title: chair.attrs.xnode?.title,
        text: chair.attrs.text?.text,
      };
    }, target.chairId);

    expect(assignment).toEqual({
      title: "Ada Chen",
      text: "en",
    });
    await expect(page.getByText("全部(3)")).toBeVisible();

    await page.mouse.click(target.point.x, target.point.y);
    const chairCard = page.locator(".ChairCard");
    await expect(chairCard).toBeVisible();
    await expect(chairCard).toContainText("Ada Chen");
    const cardBox = await chairCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.y).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(1280);
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(720);

    const moveTarget = await page.evaluate((sourceId) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const source = graph.getCellById(sourceId);
      const destination = graph
        .getNodes()
        .find(
          (node: any) =>
            node?.data?.nodeType === "matrixChair" && node.id !== sourceId && node?.data?.visible && !node?.attrs?.xnode
        );
      const sourceBox = source.getBBox();
      const destinationBox = destination.getBBox();
      return {
        destinationId: destination.id,
        sourcePoint: graph.localToClient(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2),
        destinationPoint: graph.localToClient(
          destinationBox.x + destinationBox.width / 2,
          destinationBox.y + destinationBox.height / 2
        ),
      };
    }, target.chairId);

    await page.mouse.move(moveTarget.sourcePoint.x, moveTarget.sourcePoint.y);
    await page.mouse.down();
    await page.mouse.move(moveTarget.destinationPoint.x, moveTarget.destinationPoint.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForFunction(
      ({ sourceId, destinationId }) => {
        const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
        return (
          !graph.getCellById(sourceId)?.attrs?.xnode &&
          graph.getCellById(destinationId)?.attrs?.xnode?.title === "Ada Chen"
        );
      },
      { sourceId: target.chairId, destinationId: moveTarget.destinationId }
    );

    expect(pageErrors).toEqual([]);
  });

  test("keeps round tables and room objects visually and structurally intact", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();

    const stage = page.locator(".seatmap-stage-shell");
    await page.locator("#Round").dragTo(stage, {
      targetPosition: { x: 520, y: 300 },
    });

    const circleModal = page.locator(".ant-modal").filter({ hasText: "圆桌配置" });
    await expect(circleModal).toBeVisible();
    await circleModal.locator('input[placeholder="值最大99"]').fill("1");
    await circleModal.locator('input[placeholder="值最大30"]').fill("6");
    await circleModal.getByRole("button", { name: /提\s*交/ }).click();
    await expect(circleModal).not.toBeVisible();

    await page.waitForFunction(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const nodes = graph?.getNodes?.() ?? [];
      return (
        nodes.filter((node: any) => node?.data?.nodeType === "circleContainer").length === 1 &&
        nodes.filter((node: any) => node?.data?.nodeType === "circleChair").length === 6
      );
    });

    const initial = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getNodes().find((node: any) => node?.data?.nodeType === "circleContainer");
      const children = graph
        .getNodes()
        .filter((node: any) => node?.getParent?.()?.id === parent.id || node?.parent?.id === parent.id);
      const parentPosition = parent.getPosition();
      const parentBox = parent.getBBox();
      const topLeft = graph.localToClient(parentBox.x, parentBox.y);
      const bottomRight = graph.localToClient(parentBox.x + parentBox.width, parentBox.y + parentBox.height);

      return {
        parentId: parent.id,
        parentPosition: { ...parentPosition },
        clientBox: {
          left: topLeft.x,
          top: topLeft.y,
          right: bottomRight.x,
          bottom: bottomRight.y,
        },
        childTypes: children.map((node: any) => node?.data?.nodeType).sort(),
        children: children.map((node: any) => ({ id: node.id, position: { ...node.getPosition() } })),
        dragPoint: graph.localToClient(parentBox.x + 10, parentBox.y + 10),
      };
    });

    expect(initial.childTypes).toEqual([
      "circleChair",
      "circleChair",
      "circleChair",
      "circleChair",
      "circleChair",
      "circleChair",
      "circleTable",
    ]);
    const graphBox = await page.locator(".x6-graph").boundingBox();
    expect(graphBox).not.toBeNull();
    expect(initial.clientBox.left).toBeGreaterThanOrEqual(graphBox!.x);
    expect(initial.clientBox.top).toBeGreaterThanOrEqual(graphBox!.y);
    expect(initial.clientBox.right).toBeLessThanOrEqual(graphBox!.x + graphBox!.width);
    expect(initial.clientBox.bottom).toBeLessThanOrEqual(graphBox!.y + graphBox!.height);

    await page.mouse.move(initial.dragPoint.x, initial.dragPoint.y);
    await page.mouse.down();
    await page.mouse.move(initial.dragPoint.x + 90, initial.dragPoint.y + 55, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1_000);

    const movement = await page.evaluate((snapshot) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getCellById(snapshot.parentId);
      const parentPosition = parent.getPosition();
      const delta = {
        x: parentPosition.x - snapshot.parentPosition.x,
        y: parentPosition.y - snapshot.parentPosition.y,
      };

      return {
        delta,
        childDeltas: snapshot.children.map((child: any) => {
          const position = graph.getCellById(child.id).getPosition();
          return {
            id: child.id,
            x: position.x - child.position.x,
            y: position.y - child.position.y,
          };
        }),
      };
    }, initial);

    expect(movement.delta.x).toBeGreaterThan(70);
    expect(movement.delta.y).toBeGreaterThan(40);
    expect(
      movement.childDeltas.every(
        (child: any) => Math.abs(child.x - movement.delta.x) < 0.01 && Math.abs(child.y - movement.delta.y) < 0.01
      )
    ).toBe(true);

    await page.locator("#Proscenium").dragTo(stage, { targetPosition: { x: 760, y: 180 } });
    await page.locator("#Window").dragTo(stage, { targetPosition: { x: 860, y: 360 } });
    await page.locator("#Door").dragTo(stage, { targetPosition: { x: 700, y: 460 } });

    const objectCounts = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const nodes = graph?.getNodes?.() ?? [];
      return {
        stage: nodes.filter((node: any) => node?.data?.nodeType === "prosceniumNode").length,
        window: nodes.filter((node: any) => node?.data?.nodeType === "windowNode").length,
        door: nodes.filter((node: any) => node?.data?.nodeType === "doorNode").length,
      };
    });
    expect(objectCounts).toEqual({ stage: 1, window: 1, door: 1 });

    await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const selection = graph.getPlugin("selection");
      const chairs = graph
        .getNodes()
        .filter((node: any) => node?.data?.nodeType === "circleChair")
        .slice(0, 2);
      selection.clean();
      selection.select(chairs);
    });
    await expect(page.getByText("已选择 2 个座位")).toBeVisible();

    await page.getByText("背景色", { exact: true }).click();
    await page.locator(".color-swatch").nth(1).click();
    await page.waitForFunction(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const selected = graph?.getSelectedCells?.() ?? [];
      return selected.length === 2 && selected.every((node: any) => node.attr("rect/fill") === "#EA131350");
    });
    await expect(page.getByText("区域命名")).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("supports round table seat controls and name editing", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();

    await page.locator("#Round").dragTo(page.locator(".seatmap-stage-shell"), {
      targetPosition: { x: 520, y: 300 },
    });
    const circleModal = page.locator(".ant-modal").filter({ hasText: "圆桌配置" });
    await circleModal.locator('input[placeholder="值最大99"]').fill("1");
    await circleModal.locator('input[placeholder="值最大30"]').fill("6");
    await circleModal.getByRole("button", { name: /提\s*交/ }).click();

    const circlePoints = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const parent = graph.getNodes().find((node: any) => node?.data?.nodeType === "circleContainer");
      const table = graph.getNodes().find((node: any) => node?.data?.nodeType === "circleTable");
      const parentBox = parent.getBBox();
      const tableBox = table.getBBox();
      return {
        parent: graph.localToClient(parentBox.x + 10, parentBox.y + 10),
        table: graph.localToClient(tableBox.x + tableBox.width / 2, tableBox.y + tableBox.height / 2),
      };
    });

    await page.mouse.move(circlePoints.parent.x, circlePoints.parent.y);
    const addChair = page.locator(".circle_chair_increase_icon");
    await expect(addChair).toBeVisible();
    await addChair.click();
    await page.waitForFunction(
      () =>
        (window as any).__SEATMAP_STUDIO_GRAPH__
          ?.getNodes?.()
          .filter((node: any) => node?.data?.nodeType === "circleChair").length === 7
    );

    await page.mouse.move(circlePoints.parent.x, circlePoints.parent.y);
    const removeChair = page.locator(".circle_chair_decrease_icon");
    await expect(removeChair).toBeVisible();
    await removeChair.click();
    await page.waitForFunction(
      () =>
        (window as any).__SEATMAP_STUDIO_GRAPH__
          ?.getNodes?.()
          .filter((node: any) => node?.data?.nodeType === "circleChair").length === 6
    );

    await page.mouse.dblclick(circlePoints.table.x, circlePoints.table.y);
    const nameModal = page.locator(".ant-modal").filter({ hasText: "圆桌名配置" });
    await expect(nameModal).toBeVisible();
    await nameModal.locator('input[placeholder="请输入桌子中文名"]').fill("圆桌 A");
    await nameModal.locator('input[placeholder="请输入桌子英文名"]').fill("Round A");
    await nameModal.getByRole("button", { name: /保\s*存/ }).click();
    await expect(nameModal).not.toBeVisible();
    await page.waitForFunction(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const table = graph?.getNodes?.().find((node: any) => node?.data?.nodeType === "circleTable");
      return table?.data?.tableName === "圆桌 A" && table?.data?.tableNameEn === "Round A";
    });

    expect(pageErrors).toEqual([]);
  });

  test("resizes and removes room objects with mouse tools", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.locator("#Proscenium").dragTo(page.locator(".seatmap-stage-shell"), {
      targetPosition: { x: 360, y: 180 },
    });
    await page.waitForFunction(
      () => Boolean((window as any).__SEATMAP_STUDIO_GRAPH__?.getPlugin?.("transform")),
      undefined,
      { timeout: 15_000 }
    );

    const stageNode = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const node = graph.getNodes().find((item: any) => item?.data?.nodeType === "prosceniumNode");
      const box = node.getBBox();
      return {
        id: node.id,
        center: graph.localToClient(box.x + box.width / 2, box.y + box.height / 2),
      };
    });

    const stageNodeView = page.locator(`.x6-node[data-cell-id="${stageNode.id}"]`);
    await expect(stageNodeView).toBeVisible();
    await stageNodeView.click();
    const rightHandle = page.locator('.x6-widget-transform-resize[data-position="right"]');
    await expect(rightHandle).toBeVisible();
    const handleBox = await rightHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 100, handleBox!.y + handleBox!.height / 2, {
      steps: 10,
    });
    await page.mouse.up();
    await page.waitForTimeout(800);

    const resizedWidth = await page.evaluate((id) => {
      return (window as any).__SEATMAP_STUDIO_GRAPH__.getCellById(id).getSize().width;
    }, stageNode.id);
    expect(resizedWidth).toBeGreaterThanOrEqual(490);

    const updatedCenter = await page.evaluate((id) => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const node = graph.getCellById(id);
      const box = node.getBBox();
      return graph.localToClient(box.x + box.width / 2, box.y + box.height / 2);
    }, stageNode.id);
    const graphBox = await page.locator(".x6-graph").boundingBox();
    expect(graphBox).not.toBeNull();
    await page.mouse.click(graphBox!.x + 24, graphBox!.y + 120);
    await page.mouse.move(updatedCenter.x, updatedCenter.y);

    const removeTool = page.locator('[data-tool-name="button-remove"]');
    await expect(removeTool).toBeVisible();
    await removeTool.click();
    await page.waitForFunction((id) => !(window as any).__SEATMAP_STUDIO_GRAPH__?.getCellById?.(id), stageNode.id);

    expect(pageErrors).toEqual([]);
  });

  test("exposes panel and color controls to keyboard users", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByRole("button", { name: "所属组织(4)" })).toBeVisible();

    const layoutSection = page.getByRole("button", { name: /^布局素材$/ });
    const peopleSection = page.getByRole("button", { name: /^人员与座位$/ });
    await expect(layoutSection).toHaveAttribute("aria-expanded", "true");
    await expect(peopleSection).toHaveAttribute("aria-expanded", "true");

    await peopleSection.focus();
    await page.keyboard.press("Enter");
    await expect(peopleSection).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(peopleSection).toHaveAttribute("aria-expanded", "true");

    const colorTrigger = page.getByRole("button", { name: "展开背景色面板" });
    await colorTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "收起配色面板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "清除座位背景色" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "应用区域颜色 B" })).toBeVisible();

    await loadTemplate(page, "Boardroom Demo");
    await expect(page.locator('[aria-label="矩阵布局，当前布局不可添加"]')).toHaveAttribute("aria-disabled", "true");

    expect(pageErrors).toEqual([]);
  });

  test("filters the roster by search, person type, and attendance state", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByRole("button", { name: "所属组织(4)" })).toBeVisible();

    const search = page.getByPlaceholder("搜索");
    await search.fill("Ada");
    const productNode = page.locator(".ant-tree-treenode").filter({ hasText: "Product" }).first();
    await productNode.locator(".ant-tree-switcher").click();
    await expect(page.getByText("Design", { exact: true })).toBeVisible();
    await expect(page.locator(".ant-tree-treenode-motion")).toHaveCount(0);
    const designNode = page.locator(".ant-tree-treenode:visible").filter({ hasText: "Design" }).first();
    await designNode.locator(".ant-tree-switcher").click();
    await expect(page.getByText("Ada Chen", { exact: true })).toBeVisible();

    await search.fill("Nobody");
    await expect(page.getByText("当前筛选无人员")).toBeVisible();

    await search.fill("");
    await page.getByRole("button", { name: "全球合伙人(2)" }).click();
    const guestsNode = page.locator(".ant-tree-treenode").filter({ hasText: "Guests" }).first();
    await guestsNode.locator(".ant-tree-switcher").click();
    await expect(page.getByText("Lee Park", { exact: true })).toBeVisible();
    await expect(page.getByText("Morgan Yu", { exact: true })).not.toBeVisible();

    await page.getByRole("button", { name: "不参加" }).click();
    const absentGuestsNode = page.locator(".ant-tree-treenode").filter({ hasText: "Guests" }).first();
    await absentGuestsNode.locator(".ant-tree-switcher").click();
    await expect(page.getByText("Morgan Yu", { exact: true })).toBeVisible();
    await expect(page.getByText("Lee Park", { exact: true })).not.toBeVisible();

    await page.getByRole("button", { name: "已排座" }).click();
    await expect(page.getByText("当前筛选无人员")).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("pans the canvas with left mouse drag while Ctrl+drag keeps rubberband", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForFunction(
      () => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0,
      undefined,
      {
        timeout: 30_000,
      }
    );

    const graphBox = await page.locator(".x6-graph").boundingBox();
    expect(graphBox).not.toBeNull();
    const startX = graphBox!.x + graphBox!.width / 2;
    const startY = graphBox!.y + graphBox!.height / 2;

    const translateBefore = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__.translate());
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 140, startY - 90, { steps: 10 });
    await page.mouse.up();
    const translateAfterPan = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__.translate());
    expect(translateAfterPan.tx).not.toBe(translateBefore.tx);
    expect(translateAfterPan.ty).not.toBe(translateBefore.ty);

    const rubberband = page.locator(".x6-widget-selection-rubberband");
    await page.keyboard.down("Control");
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 160, startY + 120, { steps: 10 });
    await expect(rubberband).toBeVisible();
    await page.mouse.up();
    await page.keyboard.up("Control");
    await expect(rubberband).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test("clamps a matrix created at the edge of the visible area", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();
    await page.waitForFunction(
      () =>
        Boolean((window as any).__SEATMAP_STUDIO_GRAPH__) &&
        typeof (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
      undefined,
      { timeout: 30_000 }
    );
    await page.waitForFunction(
      () => ((window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().length ?? 0) === 0,
      undefined,
      {
        timeout: 30_000,
      }
    );

    const area = await page.evaluate(() => {
      const graphArea = (window as any).__SEATMAP_STUDIO_GRAPH__.getGraphArea();
      return { x: graphArea.x, y: graphArea.y, width: graphArea.width, height: graphArea.height };
    });

    await createMatrix(page, 4, 8, area.x + area.width - 12, area.y + area.height - 12);

    await page.waitForFunction(
      () =>
        Boolean(
          (window as any).__SEATMAP_STUDIO_GRAPH__
            ?.getNodes?.()
            .find((node: any) => node?.data?.nodeType === "matrixContainer")
        ),
      undefined,
      { timeout: 30_000 }
    );

    const bbox = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const container = graph.getNodes().find((node: any) => node?.data?.nodeType === "matrixContainer");
      const box = container.getBBox();
      return { x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
    });

    expect(bbox.x).toBeGreaterThanOrEqual(area.x - 1);
    expect(bbox.y).toBeGreaterThanOrEqual(area.y - 1);
    expect(bbox.right).toBeLessThanOrEqual(area.x + area.width + 1);
    expect(bbox.bottom).toBeLessThanOrEqual(area.y + area.height + 1);

    expect(pageErrors).toEqual([]);
  });

  test("rebinds graph event handlers to the new session after a host session switch", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    // 本地存储后端只有一个布局桶，sessionId 不参与寻址;
    // 事件处理器闭包的 sessionId 只在发给远端网关的请求里可观察——
    // 因此本用例切到 remote 模式并拦截网关请求，断言写请求所携带的场次。
    const seen: { type: string; sessionId: string }[] = [];

    await page.addInitScript(() => {
      window.localStorage.setItem("seatmap-api-mode", "remote");
      window.localStorage.setItem("seatmap-api-url", `${window.location.origin}/api/seatmap/invoke`);
      window.localStorage.setItem("seatmap-api-codes", JSON.stringify({ seat: "S", person: "P", template: "T" }));
    });

    await page.route("**/api/seatmap/invoke", async (route) => {
      const body = JSON.parse(route.request().postData() ?? "{}");
      const params: any = body?.invokeParam ?? {};
      seen.push({ type: params.type ?? "", sessionId: params.sessionId ?? "" });
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          subMsgType: "success",
          // 超集响应形状，覆盖所有消费方的取值路径
          data: { response: { schema: [], result: [], subList: [], dataList: [], total: 0 } },
        }),
      });
    });

    await page.goto("/");
    await expect(page.getByText(/已同步到最新版本|已保存 /)).toBeVisible();

    // 场次 A（demo-session）：写入请求应带 demo-session
    await createMatrix(page, 3, 4, 240, 120);
    await expect.poll(() => seen.filter((r) => r.type === "graph").length, { timeout: 30_000 }).toBeGreaterThan(0);
    const writesAfterA = seen.filter((r) => r.type === "graph");
    expect(writesAfterA[writesAfterA.length - 1].sessionId).toBe("demo-session");

    // 宿主切换场次：B 的查询应到达网关；B 空布局先把画布清空（create 内部会等这一清空发生）
    await page.evaluate(() =>
      (window as any).__SEATMAP_STUDIO_STORE__.dispatch(
        (window as any).__SEATMAP_STUDIO_RUNTIME_ACTIONS__.setSessionId("e2e-session-b")
      )
    );
    await expect
      .poll(() => seen.some((r) => r.type === "query" && r.sessionId === "e2e-session-b"), { timeout: 30_000 })
      .toBe(true);

    // 场次 B 建阵后用真实鼠标拖拽移动矩阵：node:moved 只在用户拖拽时触发，
    // 走 GraphBehavior 的事件处理器——useEffect([graphInstance, sessionId]) 重绑闭包后，
    // 写请求必须沿用 e2e-session-b；若仍是旧闭包则会以 demo-session 写入（核心断言，见 a66b1ad）
    await createMatrix(page, 3, 4, 240, 120);
    const writesBeforeMove = seen.length;
    const dragOrigin = await page.evaluate(() => {
      const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
      const container = graph.getNodes().find((node: any) => node?.data?.nodeType === "matrixContainer");
      const { x, y } = container.position();
      // 位置靠容器内边缘上方内边距区，避免落在座位/行标签子节点上
      const point = graph.localToClient(x + 12, y + 12);
      return { x: point.x, y: point.y };
    });
    await page.mouse.move(dragOrigin.x, dragOrigin.y);
    await page.mouse.down();
    await page.mouse.move(dragOrigin.x + 160, dragOrigin.y + 120, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(() => seen.slice(writesBeforeMove).filter((r) => r.type === "graph").length, { timeout: 30_000 })
      .toBeGreaterThan(0);

    const moveWrites = seen.slice(writesBeforeMove).filter((r) => r.type === "graph");
    expect(moveWrites.some((r) => r.sessionId === "e2e-session-b")).toBe(true);
    // 回归点：重绑失效的旧实现会把移动写进宿主切换前的场次
    expect(moveWrites.some((r) => r.sessionId === "demo-session")).toBe(false);

    expect(pageErrors).toEqual([]);
  });

  test("keeps canvas controls and material drop boundaries reliable", async ({ page }) => {
    const pageErrors = capturePageErrors(page);

    await page.goto("/");
    await expect(page.getByText("已同步到最新版本")).toBeVisible();

    const matrixMaterial = page.locator("#Matrix");
    await matrixMaterial.dragTo(page.locator("header"));
    await expect(page.locator(".ant-modal").filter({ hasText: "矩阵配置" })).toHaveCount(0);

    await matrixMaterial.dragTo(page.locator(".seatmap-stage-shell"), {
      targetPosition: { x: 520, y: 300 },
    });
    const matrixModal = page.locator(".ant-modal").filter({ hasText: "矩阵配置" });
    await expect(matrixModal).toBeVisible();
    await matrixModal.getByRole("button", { name: /取\s*消/ }).click();

    await expect(page.locator(".canvas-status-primary")).toHaveText("100%");
    await page.getByRole("button", { name: "放大" }).click();
    await expect(page.locator(".canvas-status-primary")).toHaveText("120%");

    const translateBefore = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__.translate());
    const graphBox = await page.locator(".x6-graph").boundingBox();
    expect(graphBox).not.toBeNull();

    await page.mouse.move(graphBox!.x + 900, graphBox!.y + 500);
    await page.mouse.down();
    await page.mouse.move(graphBox!.x + 840, graphBox!.y + 450, { steps: 8 });
    await page.mouse.up();

    const translateAfter = await page.evaluate(() => (window as any).__SEATMAP_STUDIO_GRAPH__.translate());
    expect(translateAfter.tx).not.toBe(translateBefore.tx);
    expect(translateAfter.ty).not.toBe(translateBefore.ty);
    expect(pageErrors).toEqual([]);
  });
});
