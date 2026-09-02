import { Graph, Node } from "@antv/x6";
import { CHAIR_START_ANGLE } from "../GlobalVar";
import { CirclePreComputed, circleChairParams, parentParams, tableParams } from "./paramsComputed";
import { getGraph } from "../config";
import store from "../store";
import { generateGraphics, generateNode } from "../utils/apiParams";
import { handleCpApi } from "../api";
import { runGraphBatch } from "../utils/graphBatch";
import { markLocalGraphMutation } from "../utils/querySync";

function getCircleMaxTableOrder() {
  let graph = getGraph();
  let cells: any[] = graph.getCells();
  cells = cells
    .filter((ite) => {
      return ite.data && ite.data.nodeType === "circleContainer";
    })
    .map((ite) => {
      const tableName = ite.data?.tableName || "";
      const numStr = tableName.replace("号桌", "");
      const num = Number(numStr);
      return isNaN(num) ? 0 : num;
    });
  if (cells && cells.length) {
    let maxTableOrder = Math.max(...cells);
    return maxTableOrder;
  } else {
    return 0;
  }
}
function getCircleMaxTableRealOrder() {
  let graph = getGraph();
  let cells: any[] = graph.getCells();
  cells = cells
    .filter((ite) => {
      return ite.data && ite.data.nodeType === "circleContainer";
    })
    .map((ite) => {
      const idx = Number(ite.data?.tableRealIdx);
      return isNaN(idx) ? 0 : idx;
    });
  if (cells && cells.length) {
    let maxTableRealOrder = Math.max(...cells);
    return maxTableRealOrder;
  } else {
    return 0;
  }
}

export const initCircle = (x: number, y: number, graph: Graph) => {
  markLocalGraphMutation();
  const chairCount = store.getState().runtime.circleChairCount;
  const tableCount = store.getState().runtime.circleTableCount;

  // 获取场次Id
  const sessionId = store.getState().runtime.sessionId;
  let beginNum = getCircleMaxTableOrder() || 0;
  // let tableNum = circleData.tableNum
  // let realIdx = getCircleMaxTableRealOrder();

  // 添加节点
  // const nodes = graph.getNodes();

  // const circleLength = nodes.filter((item: any) => item.data.nodeType === "circleContainer").length || 0;
  // const lastChildren = node.children.lastItem;
  // const nums =  Number(tableCount) + Number(beginNum)

  for (let i = 0; i < Number(tableCount); i++) {
    const { circleTableData, parentData } = CirclePreComputed(x, y, i);

    const circleData = {
      tableName: `${beginNum + i + 1}号桌`,
      tableNameEn: `Table ${beginNum + i + 1}`,
      chairCount,
      //   tablezIndex: 100 - i,
      tableNameIdx: beginNum + i,
      // tableRealIdx: beginNum,
      // (tableNum + beginNum - i) * 10
    };

    initCircleSeat(circleData, circleTableData, parentData, chairCount, graph, sessionId);
  }
};

const initCircleSeat = async (
  circleData: any,
  circleTableData: any,
  parentData: any,
  chairCount: number,
  graph: Graph,
  sessionId: string
) => {
  const parent = graph.createNode(parentParams(parentData, circleData));
  const table = graph.createNode({
    ...tableParams(circleData, circleTableData),
    parent: parent.id,
  });
  const children: Node[] = [table];

  runGraphBatch(graph, "create-circle", () => {
    // 椅子角度间隔
    const CHAIR_ANGLE_STEP = 360 / chairCount;
    for (let i = 0; i < chairCount; i++) {
      const angle = (CHAIR_START_ANGLE + CHAIR_ANGLE_STEP * i) * (Math.PI / 180);
      const chair = graph.createNode(circleChairParams(circleData, circleTableData, table, angle, i, parent.id));
      children.push(chair);
    }

    graph.addNodes([parent, ...children], { async: true });
    parent.setChildren(children);
  });

  // 添加图形组（父节点）
  const graphicsParams = generateGraphics(parent, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);

  const nodeParams = generateNode(children, sessionId, parent);
  await handleCpApi({ params: nodeParams, code: "seat" }, true);
};
