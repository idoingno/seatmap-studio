// 仅存 X6 Graph 实例这一非序列化服务单例：不适合进 Redux，
// 保持模块内私有 + getter/setter 访问。
// 其余运行时数据状态（Session、矩阵参数、拖拽类型等）
// 已迁入 src/store/runtimeSlice.ts（state.runtime.*）。

import type { Graph } from "@antv/x6";

let graph: Graph = null;

export function setGraph(val: any) {
  graph = val;
  if (typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)) {
    (window as any).__SEATMAP_STUDIO_GRAPH__ = val;
  }
}
export function getGraph() {
  return graph;
}
