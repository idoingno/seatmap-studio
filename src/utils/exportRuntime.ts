import type { Graph } from "@antv/x6";

let exportPluginModule: Promise<typeof import("@antv/x6-plugin-export")> | undefined;
const exportEnabledGraphs = new WeakSet<Graph>();
let domToImageModule: Promise<typeof import("dom-to-image")> | undefined;

export const ensureGraphExportPlugin = async (graph: Graph) => {
  if (!exportPluginModule) {
    exportPluginModule = import("@antv/x6-plugin-export");
  }

  const { Export } = await exportPluginModule;
  if (!exportEnabledGraphs.has(graph)) {
    graph.use(new Export());
    exportEnabledGraphs.add(graph);
  }
};

export const loadDomToImage = async () => {
  if (!domToImageModule) {
    domToImageModule = import("dom-to-image");
  }

  const module = await domToImageModule;
  return module.default;
};
