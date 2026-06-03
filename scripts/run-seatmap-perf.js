const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");

const cwd = path.resolve(__dirname, "..");
const nodeBinary = process.env.NODE_BINARY || process.execPath;
const port = Number(process.env.SEATMAP_PERF_PORT || 18081);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;

const scenarios = [
  {
    rows: 50,
    columns: 50,
    maxCreateDurationMs: 30000,
    maxClickDurationMs: 1000,
    maxAddColumnLeftDurationMs: 3000,
    maxAddRowTopDurationMs: 3000,
    maxColumnRenameDurationMs: 2000,
    maxRemoveColumnLeftDurationMs: 3000,
    maxRemoveRowTopDurationMs: 3000,
    maxWheelDurationMs: 1500,
    maxVisibleNodes: 1000,
    maxHeapMb: 200,
    maxRowRenameDurationMs: 2000,
  },
  {
    rows: 80,
    columns: 80,
    maxCreateDurationMs: 45000,
    maxClickDurationMs: 1500,
    maxAddColumnLeftDurationMs: 4500,
    maxAddRowTopDurationMs: 4500,
    maxColumnRenameDurationMs: 2500,
    maxRemoveColumnLeftDurationMs: 4500,
    maxRemoveRowTopDurationMs: 4500,
    maxWheelDurationMs: 2000,
    maxVisibleNodes: 1500,
    maxHeapMb: 260,
    maxRowRenameDurationMs: 2500,
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 120000) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (response) => {
          response.resume();
          resolve();
        });
        req.on("error", reject);
      });
      return;
    } catch (error) {
      await delay(500);
    }
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
};

const startServer = () => {
  const server = spawn(
    nodeBinary,
    ["./node_modules/webpack-cli/bin/cli.js", "serve", "--host", host, "--port", String(port)],
    {
      cwd,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return server;
};

const waitForEditorReady = async (page) => {
  await page.goto(baseUrl);
  await page.getByText("已加载最新版本").waitFor({ timeout: 15000 });
  await page.waitForFunction(
    () => Boolean(window.__SEATMAP_STUDIO_GRAPH__) && typeof window.__SEATMAP_STUDIO_CREATE_MATRIX__ === "function",
    undefined,
    { timeout: 15000 }
  );
  await page.waitForTimeout(750);
};

const createMatrix = async (page, rows, columns) => {
  const createDurationMs = await page.evaluate(
    async ({ nextRows, nextColumns }) => {
      const start = performance.now();
      await window.__SEATMAP_STUDIO_CREATE_MATRIX__(nextRows, nextColumns);
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      return performance.now() - start;
    },
    { nextRows: rows, nextColumns: columns }
  );

  await page.waitForFunction(
    ({ expectedRows, expectedColumns }) => {
      const graphInstance = window.__SEATMAP_STUDIO_GRAPH__;
      if (!graphInstance) {
        return false;
      }

      const nodes = graphInstance.getNodes?.() ?? [];
      const chairs = nodes.filter((node) => node?.data?.nodeType === "matrixChair");
      return chairs.length >= expectedRows * expectedColumns;
    },
    { expectedRows: rows, expectedColumns: columns },
    { timeout: 45000 }
  );

  return createDurationMs;
};

const ensureMenuHook = async (page, shape, hookName) => {
  await page.evaluate(
    ({ nextShape }) => {
      const graphInstance = window.__SEATMAP_STUDIO_GRAPH__;
      if (!graphInstance) {
        throw new Error("Graph debug hook is unavailable");
      }

      graphInstance.addNode({
        shape: nextShape,
        x: 24,
        y: 24,
      });
    },
    { nextShape: shape }
  );

  await page.waitForFunction(
    (nextHookName) => typeof window[nextHookName] === "function",
    hookName,
    { timeout: 5000 }
  );
};

const measureScenario = async (page, scenario) => {
  const createDurationMs = await createMatrix(page, scenario.rows, scenario.columns);

  const clickStart = Date.now();
  await page.locator(".x6-graph").click({ position: { x: 500, y: 250 } });
  const clickDurationMs = Date.now() - clickStart;

  const wheelStart = Date.now();
  await page.locator(".x6-graph").hover();
  await page.mouse.wheel(0, -600);
  await page.mouse.wheel(0, 600);
  const wheelDurationMs = Date.now() - wheelStart;

  const renameMetric = async (targetType, idx, nextText) => {
    const waitForSaved = page
      .getByText("自动保存中…")
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => page.getByText("自动保存中…").waitFor({ state: "hidden", timeout: 5000 }));

    const start = Date.now();
    await page.evaluate(
      ({ nodeType, currentIdx, text }) => {
        const graphInstance = window.__SEATMAP_STUDIO_GRAPH__;
        const targetNode = graphInstance
          ?.getNodes?.()
          ?.find((node) => node?.data?.nodeType === nodeType && Number(node?.data?.idx) === currentIdx);

        if (!targetNode) {
          throw new Error(`Missing ${nodeType} node ${currentIdx}`);
        }

        targetNode.attr("text/text", text);
      },
      { nodeType: targetType, currentIdx: idx, text: nextText }
    );

    await waitForSaved;
    return Date.now() - start;
  };

  const rowRenameDurationMs = await renameMetric("matrixRows", 0, `第1排-Bench-${scenario.rows}`);
  const columnRenameDurationMs = await renameMetric("matrixColumnTopNum", 0, `C-${scenario.columns}`);

  await ensureMenuHook(page, "add-menu-react-node", "__SEATMAP_STUDIO_ADD_ROW_TOP__");
  await ensureMenuHook(page, "minus-menu-react-node", "__SEATMAP_STUDIO_REMOVE_ROW_TOP__");

  const menuMetric = async (windowHookName) => {
    const start = Date.now();
    await page.evaluate(async (hookName) => {
      const hook = window[hookName];
      if (typeof hook !== "function") {
        throw new Error(`Missing debug hook: ${hookName}`);
      }
      await hook();
    }, windowHookName);
    return Date.now() - start;
  };

  const addRowTopDurationMs = await menuMetric("__SEATMAP_STUDIO_ADD_ROW_TOP__");
  const removeRowTopDurationMs = await menuMetric("__SEATMAP_STUDIO_REMOVE_ROW_TOP__");
  const addColumnLeftDurationMs = await menuMetric("__SEATMAP_STUDIO_ADD_COLUMN_LEFT__");
  const removeColumnLeftDurationMs = await menuMetric("__SEATMAP_STUDIO_REMOVE_COLUMN_LEFT__");

  const snapshot = await page.evaluate(() => {
    const graphInstance = window.__SEATMAP_STUDIO_GRAPH__;
    const perfState = window.__SEATMAP_STUDIO_PERF__ ?? {};

    return {
      cellCount: graphInstance?.getNodes?.().length ?? 0,
      heapSize: performance.memory?.usedJSHeapSize ?? 0,
      perfState,
      visibleNodes: document.querySelectorAll(".x6-node").length,
    };
  });

  return {
    rows: scenario.rows,
    columns: scenario.columns,
    createDurationMs: Number(createDurationMs.toFixed(2)),
    addColumnLeftDurationMs,
    addRowTopDurationMs,
    clickDurationMs,
    columnRenameDurationMs,
    removeColumnLeftDurationMs,
    removeRowTopDurationMs,
    wheelDurationMs,
    rowRenameDurationMs,
    cellCount: snapshot.cellCount,
    visibleNodes: snapshot.visibleNodes,
    heapMb: Number((snapshot.heapSize / 1024 / 1024).toFixed(2)),
    largeGraphMode: Boolean(snapshot.perfState.largeGraphMode),
    threshold: snapshot.perfState.threshold ?? 0,
  };
};

const assertScenario = (result, scenario) => {
  const failures = [];

  if (!result.largeGraphMode) failures.push("largeGraphMode was not enabled");
  if (result.cellCount < scenario.rows * scenario.columns) failures.push("cell count was below expected matrix size");
  if (result.threshold <= 0) failures.push("performance threshold debug state was missing");
  if (result.createDurationMs >= scenario.maxCreateDurationMs)
    failures.push(`createDurationMs ${result.createDurationMs} >= ${scenario.maxCreateDurationMs}`);
  if (result.clickDurationMs >= scenario.maxClickDurationMs)
    failures.push(`clickDurationMs ${result.clickDurationMs} >= ${scenario.maxClickDurationMs}`);
  if (result.addRowTopDurationMs >= scenario.maxAddRowTopDurationMs)
    failures.push(`addRowTopDurationMs ${result.addRowTopDurationMs} >= ${scenario.maxAddRowTopDurationMs}`);
  if (result.removeRowTopDurationMs >= scenario.maxRemoveRowTopDurationMs)
    failures.push(`removeRowTopDurationMs ${result.removeRowTopDurationMs} >= ${scenario.maxRemoveRowTopDurationMs}`);
  if (result.addColumnLeftDurationMs >= scenario.maxAddColumnLeftDurationMs)
    failures.push(`addColumnLeftDurationMs ${result.addColumnLeftDurationMs} >= ${scenario.maxAddColumnLeftDurationMs}`);
  if (result.removeColumnLeftDurationMs >= scenario.maxRemoveColumnLeftDurationMs)
    failures.push(
      `removeColumnLeftDurationMs ${result.removeColumnLeftDurationMs} >= ${scenario.maxRemoveColumnLeftDurationMs}`
    );
  if (result.rowRenameDurationMs >= scenario.maxRowRenameDurationMs)
    failures.push(`rowRenameDurationMs ${result.rowRenameDurationMs} >= ${scenario.maxRowRenameDurationMs}`);
  if (result.columnRenameDurationMs >= scenario.maxColumnRenameDurationMs)
    failures.push(`columnRenameDurationMs ${result.columnRenameDurationMs} >= ${scenario.maxColumnRenameDurationMs}`);
  if (result.wheelDurationMs >= scenario.maxWheelDurationMs)
    failures.push(`wheelDurationMs ${result.wheelDurationMs} >= ${scenario.maxWheelDurationMs}`);
  if (result.visibleNodes >= scenario.maxVisibleNodes)
    failures.push(`visibleNodes ${result.visibleNodes} >= ${scenario.maxVisibleNodes}`);
  if (result.heapMb >= scenario.maxHeapMb) failures.push(`heapMb ${result.heapMb} >= ${scenario.maxHeapMb}`);

  if (failures.length > 0) {
    throw new Error(`${scenario.rows}x${scenario.columns} benchmark failed: ${failures.join("; ")}`);
  }
};

const run = async () => {
  const server = startServer();
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const results = [];

    for (const scenario of scenarios) {
      await waitForEditorReady(page);
      const result = await measureScenario(page, scenario);
      assertScenario(result, scenario);
      results.push(result);
    }

    console.table(results);
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
