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

import {
  matrixPreComputed,
  parentParams,
  aisleColumnNodeParams,
  aisleColumnSpaceNodeParams,
  aisleRowNodeParams,
  aisleRowSpaceNodeParams,
  matrixColumnBottomNumNodeParams,
  matrixColumnTopNumNodeParams,
  chairNodeParams,
  rowTextEnNodeParams,
  rowTextNodeParams,
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
  setGroupData,
  setRowSpaceArr,
} from "../config";
// import { resizeProscenium, resizeWindow } from "../utils/util";
import { generateGraphics, generateNode, updateGraphics, updateNode } from "../utils/apiParams";
import { ResponseType, handleCpApi } from "../api";

export const initMatrix = async (x: number, y: number, graph: Graph) => {
  const columns: number = MatrixAllRowsOrColumns.getAllColumns;
  const rows: number = MatrixAllRowsOrColumns.getAllRows;

  const parentWidth = (CHAIR_SIZE + SPACE_SIZE) * columns + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE * 2;
  const parentHeight = (CHAIR_SIZE + SPACE_SIZE) * rows + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT * 2;

  MatrixSize.setMw = parentWidth;
  MatrixSize.setMh = parentHeight;

  const groupData = matrixPreComputed(x, y, parentWidth, parentHeight);

  const parent = graph.addNode(parentParams(groupData));

  console.log("父节点parent---->", parent);

  reDrawMatrix(groupData, parent, graph);
  setGroupData(groupData);
  setRowSpaceArr(groupData.rowSpaceArr);
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

  for (let i = 0; i < pcLength; i++) {
    let corridorColumnSpace = graph.addNode(aisleColumnSpaceNodeParams(groupData, i));
    console.log("corridorColumnSpace", corridorColumnSpace);
    parent.addChild(corridorColumnSpace);
  }

  for (let i = 0; i < prLength; i++) {
    const aisleRowSpace = graph.addNode(aisleRowSpaceNodeParams(groupData, i));
    parent.addChild(aisleRowSpace);
  }

  for (let i = 0; i < columns; i++) {
    const chairColumnTopNumText = graph.addNode(matrixColumnTopNumNodeParams(groupData, 0, i));
    const chairColumnBottomNumText = graph.addNode(matrixColumnBottomNumNodeParams(groupData, i));
    parent.addChild(chairColumnTopNumText);
    parent.addChild(chairColumnBottomNumText);
  }

  for (let i = 0; i < rows; i++) {
    const rowText = graph.addNode(rowTextNodeParams(groupData, 0, i));

    parent.addChild(rowText);

    for (let j = 0; j < columns; j++) {
      const chair = graph.addNode(chairNodeParams(groupData, i, j));
      parent.addChild(chair);
    }
    let rowTextEn = graph.addNode(rowTextEnNodeParams(groupData, i));

    parent.addChild(rowTextEn);
  }

  // 添加图形组（父节点）
  const graphicsParams = generateGraphics(parent, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);

  // 添加节点
  const nodes = graph.getNodes();
  const filterNode = nodes.filter((ite: Node) => ite.data.nodeType !== "matrixContainer");
  const nodeParams = generateNode(filterNode, sessionId, parent);
  await handleCpApi({ params: nodeParams, code: "seat" }, true);
};

export const initProscenium = async (x: number, y: number, graph: Graph) => {
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
  console.log(`${oper} =>>>>> 竖向进行重绘`);
  const graph = getGraph();
  const currentColumn = getCurrentColumn();
  console.log(currentColumn);
  // 获取场次Id
  const sessionId = Session.getDataId;

  if (currentColumn > -1) {
    const nodes = graph.getNodes();

    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const { width, height } = parent.size();
    const pWidth = computeWidth(oper, width);
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
      console.log("currentColumn----------------", currentColumn);
      return (
        (ite.data?.idt && ite.data?.idt?.includes("corridorColumnSpace") && ite.data?.idx > currentColumn) ||
        (ite.data.nodeType === "matrixChair" && Number(ite.data?.idt.split("-")[1]) > currentColumn) ||
        (ite.data?.idt?.includes("matrixColumnTopNum") && ite.data?.idx > currentColumn) ||
        (ite.data?.idt?.includes("matrixColumnBottomNum") && ite.data?.idx > currentColumn) ||
        ite.data?.idt?.includes("rowEn")
      );
    });

    console.log("matrixNode----------------->", matrixNode);

    for (let i = 0; i < matrixNode.length; i++) {
      const element = matrixNode[i];
      let { x, y } = element.getPosition();
      element.position(computeWidth(oper, x), y);
    }

    // 更新图形组 父节点
    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    // 更新子节点节点
    const nodeParams = updateNode(parent.children, sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    setCurrentColumn(-1);
  }
};

export const handleOffsetAisle = async (oper: string) => {
  console.log(`${oper} =>>>>> 横向进行重绘`);
  const graph = getGraph();
  const currentRow = getCurrentRow();
  console.log(currentRow);

  // 获取场次Id
  const sessionId = Session.getDataId;

  if (currentRow > -1) {
    const nodes = graph.getNodes();

    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const { width, height } = parent.size();
    const pHeight = computeWidth(oper, height);
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

    console.log("matrixNode----------------->", matrixNode);

    for (let i = 0; i < matrixNode.length; i++) {
      const element = matrixNode[i];
      let { x, y } = element.getPosition();
      element.position(x, computeWidth(oper, y));
    }

    // 更新图形组 父节点
    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    // 更新子节点节点
    const nodeParams = updateNode(parent.children, sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    setCurrentRow(-1);
  }
};
