import type { Graph } from "@antv/x6";

export const LARGE_GRAPH_CELL_THRESHOLD = 1800;
const graphModeState = new WeakMap<Graph, boolean>();

type GraphDebugWindow = Window & {
  __SEATMAP_STUDIO_PERF__?: {
    cellCount: number;
    largeGraphMode: boolean;
    threshold: number;
  };
};

const getDebugWindow = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname;
  if (!["127.0.0.1", "localhost"].includes(hostname)) {
    return null;
  }

  return window as GraphDebugWindow;
};

const setDebugState = (cellCount: number, largeGraphMode: boolean) => {
  const debugWindow = getDebugWindow();
  if (!debugWindow) {
    return;
  }

  debugWindow.__SEATMAP_STUDIO_PERF__ = {
    cellCount,
    largeGraphMode,
    threshold: LARGE_GRAPH_CELL_THRESHOLD,
  };
};

export const isLargeGraphMode = (graph: Graph) => {
  return graphModeState.get(graph) === true;
};

export const syncGraphPerformanceMode = (graph: Graph, cellCount = graph.getNodes().length) => {
  const largeGraphMode = cellCount >= LARGE_GRAPH_CELL_THRESHOLD;
  const previousMode = isLargeGraphMode(graph);

  if (previousMode === largeGraphMode) {
    setDebugState(cellCount, largeGraphMode);
    return largeGraphMode;
  }

  graphModeState.set(graph, largeGraphMode);

  if (largeGraphMode) {
    graph.disableSnapline?.();
    graph.hideSnapline?.();
    graph.disableSelection?.();
    graph.disablePlugins?.("transform");
  } else {
    graph.enableSnapline?.();
    graph.enableSelection?.();
    graph.enablePlugins?.("transform");
  }

  setDebugState(cellCount, largeGraphMode);
  return largeGraphMode;
};
