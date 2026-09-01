import { expect, test } from "@playwright/test";

const OUT = "test-results/ui-shots";

test("capture modal screenshots and styles", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("已同步到最新版本")).toBeVisible();

  // 1. matrix config modal
  await page.locator("#Matrix").dragTo(page.locator(".seatmap-stage-shell"), {
    targetPosition: { x: 520, y: 300 },
  });
  const matrixModal = page.locator(".ant-modal").filter({ hasText: "矩阵配置" });
  await expect(matrixModal).toBeVisible();
  await page.waitForTimeout(400);

  // vertical layout + theme-convergence assertions (real click focus)
  const firstInput = matrixModal.locator("input.ant-input").first();
  await firstInput.click();
  await page.waitForTimeout(400);
  const matrixFormStyles = await page.evaluate(() => {
    const modal = document.querySelector(".studio-modal-wrap .ant-modal") as HTMLElement;
    const form = modal.querySelector("form") as HTMLElement;
    const input = modal.querySelector("input.ant-input") as HTMLInputElement;
    const okButton = modal.querySelector(".ant-modal-footer .ant-btn-primary") as HTMLElement;
    return {
      isVertical: form.classList.contains("ant-form-vertical"),
      inputWidth: input.getBoundingClientRect().width,
      modalWidth: modal.getBoundingClientRect().width,
      focusBorder: getComputedStyle(input).borderColor,
      okButtonBg: getComputedStyle(okButton).backgroundColor,
    };
  });
  expect(matrixFormStyles.isVertical).toBe(true);
  expect(matrixFormStyles.inputWidth).toBeGreaterThan(260);
  expect(matrixFormStyles.modalWidth).toBeLessThanOrEqual(400);
  // antd 全局主题收敛：主按钮背景 = primary-color #19766f
  expect(matrixFormStyles.okButtonBg).toBe("rgb(25, 118, 111)");

  // antd 原生聚焦色参考：临时插入一个未被任何项目覆盖规则命中的 antd wrapper
  // （项目现有覆盖都 scoped 在 .ant-modal-root / .leftPerson / .studio-modal-wrap 内）
  const antdFocusReference = await page.evaluate(async () => {
    const probe = document.createElement("div");
    probe.className = "ant-input-affix-wrapper ant-input-affix-wrapper-focused";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).borderColor;
    probe.remove();
    return color;
  });

  // 弹窗 input 聚焦边框与侧边栏 antd 原生 input 聚焦边框一致，
  // 说明弹窗颜色完全由 antd 全局主题派生，而不是运行时覆盖。
  // 弹窗开着时有遮罩，先把弹窗聚焦边框存下来，关闭后再让搜索框进入聚焦态对比。
  expect(matrixFormStyles.focusBorder).not.toBe("rgb(207, 216, 213)");
  expect(matrixFormStyles.focusBorder).toBe(antdFocusReference);
  expect(antdFocusReference).not.toBe("rgb(207, 216, 213)");
  await page.screenshot({ path: `${OUT}/01-matrix-config.png` });
  await matrixModal.getByRole("button", { name: /取\s*消/ }).click();
  await expect(matrixModal).not.toBeVisible();

  // 2. circle config modal
  await page.locator("#Round").dragTo(page.locator(".seatmap-stage-shell"), {
    targetPosition: { x: 520, y: 300 },
  });
  const circleModal = page.locator(".ant-modal").filter({ hasText: "圆桌配置" });
  await expect(circleModal).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-circle-config.png` });

  // 3. submit circle, then open circle name modal via dblclick
  await circleModal.locator('input[placeholder="值最大99"]').fill("1");
  await circleModal.locator('input[placeholder="值最大30"]').fill("6");
  await circleModal.getByRole("button", { name: /提\s*交/ }).click();
  await page.waitForFunction(() =>
    (window as any).__SEATMAP_STUDIO_GRAPH__?.getNodes?.().find((n: any) => n?.data?.nodeType === "circleTable")
  );
  const tablePoint = await page.evaluate(() => {
    const graph = (window as any).__SEATMAP_STUDIO_GRAPH__;
    const table = graph.getNodes().find((n: any) => n?.data?.nodeType === "circleTable");
    const box = table.getBBox();
    return graph.localToClient(box.x + box.width / 2, box.y + box.height / 2);
  });
  // 等圆桌节点视图完成异步渲染后再双击；高负载下视图未挂上就双击会放空。
  await page.waitForSelector(".x6-graph-svg-stage circle[r]");
  const nameModal = page.locator(".ant-modal").filter({ hasText: "圆桌名配置" });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.mouse.dblclick(tablePoint.x, tablePoint.y);
    const opened = await nameModal.waitFor({ state: "visible", timeout: 3000 }).then(
      () => true,
      () => false
    );
    if (opened) {
      break;
    }
  }
  await expect(nameModal).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-circle-name.png` });
  await nameModal.getByRole("button", { name: /取\s*消/ }).click();
  await expect(nameModal).not.toBeVisible();

  // 4. template chooser (width + light card theme assertions)
  await page.getByText("引入模板").click();
  const templateModal = page.locator(".ant-modal").filter({ hasText: "模板选择" });
  await expect(templateModal).toBeVisible();
  await page.waitForTimeout(600);
  const templateStyles = await page.evaluate(() => {
    const wrap = document.querySelector(".studio-modal-wrap .ant-modal") as HTMLElement;
    const card = document.querySelector(".template-card") as HTMLElement | null;
    const label = card?.querySelector("span") as HTMLElement | null;
    return {
      modalWidth: wrap.getBoundingClientRect().width,
      viewportW: window.innerWidth,
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
      labelColor: label ? getComputedStyle(label).color : null,
    };
  });
  expect(templateStyles.modalWidth).toBeLessThanOrEqual(1080);
  expect(templateStyles.viewportW - templateStyles.modalWidth).toBeGreaterThan(60);
  if (templateStyles.cardBg) {
    expect(templateStyles.cardBg).toBe("rgb(255, 255, 255)");
    expect(templateStyles.labelColor).toBe("rgb(38, 52, 49)");
  }
  await page.screenshot({ path: `${OUT}/04-template-chooser.png` });
  await templateModal.locator(".ant-modal-close").click();
  await expect(templateModal).not.toBeVisible();

  // 5. seat upload modal (header button is 上传座位配置, modal title is 上传配置)
  await page.getByRole("button", { name: /上传座位配置/ }).click();
  const uploadModal = page.locator(".ant-modal").filter({ hasText: "上传配置" });
  await expect(uploadModal).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/05-upload.png` });
});

test("renders tldraw-style floating chrome with design tokens", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("已同步到最新版本")).toBeVisible();

  const chrome = await page.evaluate(() => {
    const toolbar = document.querySelector(".canvas-toolbar") as HTMLElement;
    const header = document.querySelector(".container-header") as HTMLElement;
    const copy = document.querySelector(".stage-chrome-copy") as HTMLElement;
    const badge = document.querySelector(".stage-badge") as HTMLElement;
    const stageShell = document.querySelector(".seatmap-stage-shell") as HTMLElement;

    const rect = toolbar.getBoundingClientRect();
    const shellRect = stageShell.getBoundingClientRect();

    return {
      centeredDelta: Math.abs(rect.left + rect.width / 2 - (shellRect.left + shellRect.width / 2)),
      toolbarRadius: getComputedStyle(toolbar).borderTopLeftRadius,
      headerRadius: getComputedStyle(header).borderTopLeftRadius,
      headerBg: getComputedStyle(header).backgroundColor,
      badgeRadius: getComputedStyle(badge).borderRadius,
      badgeExists: Boolean(badge && copy),
    };
  });

  await page.screenshot({ path: `${OUT}/06-chrome-islands.png` });

  // 浮岛工具条：底部居中（误差 < 4px），圆角、胶囊徽章均来自设计 token
  expect(chrome.badgeExists).toBe(true);
  expect(chrome.centeredDelta).toBeLessThan(4);
  expect(chrome.toolbarRadius).toBe("12px");
  expect(chrome.headerRadius).toBe("12px");
  expect(chrome.badgeRadius).toBe("999px");
  // 顶栏不再使用旧版深石板色 #263238
  expect(chrome.headerBg).not.toBe("rgb(38, 50, 56)");
});
