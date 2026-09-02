import {
  CHAIR_SIZE,
  SPACE_SIZE,
  PARENTLEFTANDRIGHTSPACE,
  PARENTTOPANDBOTTOMHEIGHT,
  AISLE_SIZE,
  AISLE_DEFAULT_SIZE,
} from "../GlobalVar";

import type { Graph } from "@antv/x6";
import { CellView, Node, NodeView } from "@antv/x6";
import { chairSvg } from "../config/Markup/chair";

import {
  matrixPreComputed,
  parentParams,
  parentProps,
} from "./paramsComputed";
import {
  MatrixAllRowsOrColumns,
  MatrixSize,
  Session,
  getCurrentColumn,
  getCurrentRow,
  getGraph,
  setColumnSpaceArr,
  setCurrentColumn,
  setCurrentRow,
} from "../config";
// import { resizeProscenium, resizeWindow } from "../utils/util";
import { generateGraphics, generateNode, updateGraphics, updateNode } from "../utils/apiParams";
import { ResponseType, handleCpApi } from "../api";
import { runGraphBatch } from "../utils/graphBatch";
import { syncGraphPerformanceMode } from "../utils/graphPerformance";
import { getNodeChildren } from "../utils/util";
import { patternSeat } from "../assets";
import { markLocalGraphMutation } from "../utils/querySync";

const CHAIR_STEP = CHAIR_SIZE + SPACE_SIZE;
const EDITABLE_TOOLS = ["node-editor"];
const TRANSPARENT_STROKE_BODY = {
  fill: "transparent",
  stroke: "transparent",
};
const CHAIR_MARKUP = [
  {
    tagName: "rect",
    attrs: {
      width: "40px",
      height: "40px",
    },
  },
  chairSvg,
  {
    tagName: "image",
  },
  {
    tagName: "text",
  },
];

const createMatrixChildren = (graph: Graph, groupData: parentProps, parentId: string, rows: number, columns: number) => {
  const children: Node[] = [];
  const chairBaseX = groupData.x + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE;
  const rowTextX = groupData.x + SPACE_SIZE / 2;
  const rowTextEnX = groupData.x + PARENTLEFTANDRIGHTSPACE + CHAIR_STEP * columns;
  const topNumberY = groupData.y + SPACE_SIZE;
  const bottomNumberY = groupData.y + groupData.height - PARENTTOPANDBOTTOMHEIGHT - SPACE_SIZE;
  const rowBaseY = groupData.y + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT;

  for (let i = 0; i < groupData.columnSpaceArr.length; i++) {
    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: SPACE_SIZE - 4,
        height: groupData.height,
        x: groupData.x + (i + 1) * CHAIR_STEP + PARENTLEFTANDRIGHTSPACE + 2,
        y: groupData.y,
        label: "",
        data: {
          disableMove: true,
          nodeType: "corridorColumnSpace",
          idx: i,
          isExist: false,
          idt: `corridorColumnSpace-${i}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
          text: {},
        },
      })
    );
  }

  for (let i = 0; i < groupData.rowSpaceArr.length; i++) {
    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: groupData.width,
        height: SPACE_SIZE - 4,
        x: groupData.x,
        y: groupData.y + (i + 1) * CHAIR_STEP + PARENTTOPANDBOTTOMHEIGHT + 2,
        label: "",
        data: {
          disableMove: true,
          nodeType: "aisleRowSpace",
          idx: i,
          idt: `aisleRowSpace-${i}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
        },
      })
    );
  }

  for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
    const columnLabel = `${columnIndex + 1}`;
    const chairX = chairBaseX + columnIndex * CHAIR_STEP;

    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: CHAIR_SIZE,
        height: PARENTTOPANDBOTTOMHEIGHT,
        x: groupData.x + columnIndex * CHAIR_STEP + SPACE_SIZE + AISLE_SIZE,
        y: topNumberY,
        label: columnLabel,
        data: {
          disableMove: true,
          nodeType: "matrixColumnTopNum",
          idx: columnIndex,
          idt: `matrixColumnTopNum-${columnIndex}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
        },
        tools: EDITABLE_TOOLS,
      })
    );

    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: CHAIR_SIZE,
        height: PARENTTOPANDBOTTOMHEIGHT,
        x: chairX,
        y: bottomNumberY,
        label: columnLabel,
        data: {
          disableMove: true,
          nodeType: "matrixColumnBottomNum",
          idx: columnIndex,
          idt: `matrixColumnBottomNum-${columnIndex}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
        },
        tools: EDITABLE_TOOLS,
      })
    );
  }

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const rowLabel = `第${rowIndex + 1}排`;
    const rowLabelEn = `Row ${rowIndex + 1}`;
    const chairNameEn = `Row${rowIndex + 1}`;
    const rowY = rowBaseY + rowIndex * CHAIR_STEP;

    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: CHAIR_SIZE + 20,
        height: CHAIR_SIZE,
        x: rowTextX,
        y: rowY,
        label: rowLabel,
        data: {
          disableMove: true,
          nodeType: "matrixRows",
          idx: rowIndex,
          idt: `row-${rowIndex}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
        },
        tools: EDITABLE_TOOLS,
      })
    );

    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const columnLabel = `${columnIndex + 1}`;

      children.push(
        graph.createNode({
          shape: "rect",
          parent: parentId,
          width: CHAIR_SIZE,
          height: CHAIR_SIZE,
          x: chairBaseX + columnIndex * CHAIR_STEP,
          y: rowY,
          data: {
            disableMove: true,
            nodeType: "matrixChair",
            visible: true,
            idt: `${rowIndex}-${columnIndex}`,
            matrixChairName: rowLabel,
            matrixChairNameEn: chairNameEn,
            matrixChairTopName: columnLabel,
            matrixChairBottomName: columnLabel,
          },
          markup: CHAIR_MARKUP,
          attrs: {
            body: {
              stroke: "transparent",
            },
            rect: {
              fill: "transparent",
              stroke: "transparent",
            },
            svg: {
              width: 34,
              height: 34,
              x: 3,
              y: 3,
              fill: "#FFFFFF",
            },
            image: {
              width: 40,
              y: 3,
              style: {
                display: "none",
              },
              "xlink:href": patternSeat,
            },
            text: {
              "font-size": "12",
            },
          },
        })
      );
    }

    children.push(
      graph.createNode({
        shape: "rect",
        parent: parentId,
        width: CHAIR_SIZE + 20,
        height: CHAIR_SIZE,
        x: rowTextEnX,
        y: rowY,
        label: rowLabelEn,
        data: {
          disableMove: true,
          nodeType: "matrixRowsEn",
          idx: rowIndex,
          idt: `rowEn-${rowIndex}`,
        },
        attrs: {
          body: TRANSPARENT_STROKE_BODY,
        },
        tools: EDITABLE_TOOLS,
      })
    );
  }

  return children;
};

const MATRIX_VIEWPORT_MARGIN = 8;

const clampMatrixOrigin = (graph: Graph, x: number, y: number, width: number, height: number) => {
  const area = graph.getGraphArea?.();
  if (!area || area.width <= 0 || area.height <= 0) {
    return { x, y };
  }

  const clampIntoArea = (value: number, areaStart: number, areaSize: number, size: number) => {
    if (size + MATRIX_VIEWPORT_MARGIN * 2 >= areaSize) {
      return areaStart;
    }
    return Math.min(Math.max(value, areaStart + MATRIX_VIEWPORT_MARGIN), areaStart + areaSize - size - MATRIX_VIEWPORT_MARGIN);
  };

  return {
    x: clampIntoArea(x, area.x, area.width, width),
    y: clampIntoArea(y, area.y, area.height, height),
  };
};

export const initMatrix = async (x: number, y: number, graph: Graph) => {
  markLocalGraphMutation();
  const columns: number = MatrixAllRowsOrColumns.getAllColumns;
  const rows: number = MatrixAllRowsOrColumns.getAllRows;

  const parentWidth = (CHAIR_SIZE + SPACE_SIZE) * columns + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE * 2;
  const parentHeight = (CHAIR_SIZE + SPACE_SIZE) * rows + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT * 2;

  MatrixSize.setMw = parentWidth;
  MatrixSize.setMh = parentHeight;

  const origin = clampMatrixOrigin(graph, x, y, parentWidth, parentHeight);
  const groupData = matrixPreComputed(origin.x, origin.y, parentWidth, parentHeight);

  const parent = graph.createNode(parentParams(groupData));

  reDrawMatrix(groupData, parent, graph);
  setColumnSpaceArr(groupData.columnSpaceArr);
};

const reDrawMatrix = async (groupData: parentProps, parent: Node, graph: Graph) => {
  // 获取场次Id
  const sessionId = Session.getDataId;
  const rows = MatrixAllRowsOrColumns.getAllRows;
  const columns = MatrixAllRowsOrColumns.getAllColumns;

  // const aisleCount = groupData.rowSpaceArr.reduce(
  //   (counter: number, { hit }: any) => (hit ? (counter += 1) : counter),
  //   0
  // );
  // const corridorCount = groupData.columnSpaceArr.reduce(
  //   (counter: number, { hit }: any) => (hit ? (counter += 1) : counter),
  //   0
  // );

  const pcLength = groupData.columnSpaceArr.length;
  const prLength = groupData.rowSpaceArr.length;
  let createdChildCount = 0;
  let createdChildren: Node[] = [];

  runGraphBatch(graph, "create-matrix", () => {
    const children = createMatrixChildren(graph, groupData, parent.id, rows, columns);

    graph.addNodes([parent, ...children], { async: true });
    parent.setChildren(children);
    createdChildren = children;
    createdChildCount = children.length;
  });
  syncGraphPerformanceMode(graph, createdChildCount + 1);

  // 添加图形组（父节点）
  const graphicsParams = generateGraphics(parent, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);

  // 添加节点
  const nodeParams = generateNode(createdChildren, sessionId, parent);
  await handleCpApi({ params: nodeParams, code: "seat" }, true);
};

export const initProscenium = async (x: number, y: number, graph: Graph) => {
  markLocalGraphMutation();
  const mW = MatrixSize.getMw;

  // 获取场次Id
  const sessionId = Session.getDataId;
  const prosceniumNode = graph.addNode({
    shape: "proscenium-rect-node",
    x: x,
    y: y,
    width: 400,
    height: 48,
  });

  // 添加图形组 舞台
  const graphicsParams = generateGraphics(prosceniumNode, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);
};

export const initWindow = async (x: number, y: number, graph: Graph) => {
  markLocalGraphMutation();
  const mH = MatrixSize.getMh;

  // 获取场次Id
  const sessionId = Session.getDataId;

  const windowNode = graph.addNode({
    shape: "window-rect-node",
    x: x,
    y: y,
    width: 48,
    height: 300,
  });

  // 添加图形组 窗户
  const graphicsParams = generateGraphics(windowNode, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);
};

export const initDoor = async (x: number, y: number, graph: Graph) => {
  markLocalGraphMutation();
  const mH = MatrixSize.getMh;

  // 获取场次Id
  const sessionId = Session.getDataId;

  const doorNode = graph.addNode({
    shape: "door-rect-node",
    x: x,
    y: y,
    width: 120,
    height: 48,
  });

  // 添加图形组 窗户
  const graphicsParams = generateGraphics(doorNode, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);
};

if (typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)) {
  (window as any).__SEATMAP_STUDIO_CREATE_MATRIX__ = async (rows: number, columns: number, x = 240, y = 120) => {
    MatrixAllRowsOrColumns.setAllRows = rows;
    MatrixAllRowsOrColumns.setAllColumns = columns;
    return initMatrix(x, y, getGraph());
  };
}

const computeWidth = (oper: string, size: number) => {
  let num = 0;
  if (oper === "add") {
    num = size + AISLE_SIZE - AISLE_DEFAULT_SIZE;
  } else {
    num = size - AISLE_SIZE + AISLE_DEFAULT_SIZE;
  }
  return num;
};

export const handleOffsetCorridor = async (oper: string) => {
  markLocalGraphMutation();
  const graph = getGraph();
  const currentColumn = getCurrentColumn();
  // 获取场次Id
  const sessionId = Session.getDataId;

  if (currentColumn > -1) {
    const nodes = graph.getNodes();

    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    let pWidth = 0;

    runGraphBatch(graph, "offset-corridor", () => {
      const { width, height } = parent.size();
      pWidth = computeWidth(oper, width);
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      // resizeProscenium(pWidth);

      MatrixSize.setMw = pWidth;

      const aisleRowSpaceArr = nodes.filter((item: any) => item.data.idt && item.data.idt.includes("aisleRowSpace-"));

      for (let i = 0; i < aisleRowSpaceArr.length; i++) {
        const element = aisleRowSpaceArr[i];
        const { width, height } = element.size();
        element.setProp({
          size: {
            width: computeWidth(oper, width),
            height: height,
          },
        });
      }

      const matrixNode = nodes.filter((ite) => {
        return (
          (ite.data?.idt && ite.data?.idt?.includes("corridorColumnSpace") && ite.data?.idx > currentColumn) ||
          (ite.data.nodeType === "matrixChair" && Number(ite.data?.idt.split("-")[1]) > currentColumn) ||
          (ite.data?.idt?.includes("matrixColumnTopNum") && ite.data?.idx > currentColumn) ||
          (ite.data?.idt?.includes("matrixColumnBottomNum") && ite.data?.idx > currentColumn) ||
          ite.data?.idt?.includes("rowEn")
        );
      });

      for (let i = 0; i < matrixNode.length; i++) {
        const element = matrixNode[i];
        let { x, y } = element.getPosition();
        element.position(computeWidth(oper, x), y);
      }
    });

    // 更新图形组 父节点
    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    // 更新子节点节点
    const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    setCurrentColumn(-1);
  }
};

export const handleOffsetAisle = async (oper: string) => {
  markLocalGraphMutation();
  const graph = getGraph();
  const currentRow = getCurrentRow();
  // 获取场次Id
  const sessionId = Session.getDataId;

  if (currentRow > -1) {
    const nodes = graph.getNodes();

    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    let pHeight = 0;

    runGraphBatch(graph, "offset-aisle", () => {
      const { width, height } = parent.size();
      pHeight = computeWidth(oper, height);
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      // resizeWindow(pHeight);

      MatrixSize.setMh = pHeight;

      const corridorColumnSpaceArr = nodes.filter(
        (item: any) => item.data.idt && item.data.idt.includes("corridorColumnSpace-")
      );

      for (let i = 0; i < corridorColumnSpaceArr.length; i++) {
        const element = corridorColumnSpaceArr[i];
        const { width, height } = element.size();
        element.setProp({
          size: {
            width: width,
            height: computeWidth(oper, height),
          },
        });
      }

      const matrixNode = nodes.filter((ite) => {
        return (
          (ite.data?.idt && ite.data?.idt?.includes("aisleRowSpace") && ite.data.idx > currentRow) ||
          (ite.data.nodeType === "matrixChair" && Number(ite.data.idt.split("-")[0]) > currentRow) ||
          (ite.data?.idt?.includes("row-") && ite.data?.idx > currentRow) ||
          (ite.data?.idt?.includes("rowEn-") && ite.data?.idx > currentRow) ||
          ite.data?.idt?.includes("matrixColumnBottomNum")
        );
      });

      for (let i = 0; i < matrixNode.length; i++) {
        const element = matrixNode[i];
        let { x, y } = element.getPosition();
        element.position(x, computeWidth(oper, y));
      }
    });

    // 更新图形组 父节点
    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    // 更新子节点节点
    const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    setCurrentRow(-1);
  }
};
