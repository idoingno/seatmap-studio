import type { Graph } from "@antv/x6";

export const runGraphBatch = <T>(graph: Graph, name: string, task: () => T): T => {
  return graph.batchUpdate(name as any, task);
};
