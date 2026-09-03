// X6 Graph 初始化选项，从 config/index.tsx 拆分而来。
// 与画布外观和交互相关，不含任何运行时状态。

import type { CellView, Graph } from "@antv/x6";

export const scaling = {
  min: 0.2,
  max: 4,
};

export const mousewheel = {
  enabled: true,
  zoomAtMousePosition: true,
  maxScale: 4,
  minScale: 0.2,
};

export const panning = {
  enabled: true,
  eventTypes: ["leftMouseDown" as const],
};

export const interacting = (cellView: CellView) => {
  if (cellView.cell.getData() != undefined && cellView.cell.getData().disableMove) {
    return { nodeMovable: false };
  }
  return true;
};

export const snapline = {
  enabled: true,
};

export const background = {
  color: "transparent",
};

export const translating = {
  restrict(view: CellView | null) {
    if (!view) return null;
    const cell = view.cell;
    if (cell.isNode()) {
      const parent = cell.getParent();
      if (parent) {
        return parent.getBBox();
      }
    }
    return null;
  },
};

export const embedding = {
  enabled: true,
  findParent(this: Graph, { node }: any) {
    const bbox = node.getBBox();
    return this.getNodes().filter((node: any) => {
      const data = node.getData();
      if (data && data.parent) {
        const targetBBox = node.getBBox();
        return bbox.isIntersectWithRect(targetBBox);
      }
      return false;
    });
  },
};
