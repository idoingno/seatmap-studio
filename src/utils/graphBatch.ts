import type { Graph } from "@antv/x6";

export const runGraphBatch = <T>(graph: Graph, name: string, task: () => T): T => {
  const model = graph.model;

  model.startBatch(name as any);
  try {
    return task();
  } finally {
    model.stopBatch(name as any);
  }
};
