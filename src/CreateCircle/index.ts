import { Graph, Node } from "@antv/x6";
import { CHAIR_START_ANGLE } from "../GlobalVar";
import { CirclePreComputed, circleChairParams, parentParams, tableParams } from "./paramsComputed";
import { CircleAllCount, Session, getGraph } from "../config";
import { generateGraphics, generateNode } from "../utils/apiParams";
import { handleCpApi } from "../api";
import { runGraphBatch } from "../utils/graphBatch";

// export const chairNum: number = 10;
// export const tableNum: number = 2;

// CircleAllCount.setChairCount = chairNum;
// CircleAllCount.setTableCount = tableNum;

function getCircleMaxTableOrder() {
  let graph = getGraph();
  let cells: any[] = graph.getCells();
  cells = cells
    .filter((ite) => {
      return ite.data && ite.data.nodeType === "circleContainer";
    })
    .map((ite) => {
      return Number(ite.data.tableName.replace("号桌", ""));
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
      return Number(ite.data.tableRealIdx);
    });
  if (cells && cells.length) {
    let maxTableRealOrder = Math.max(...cells);
    return maxTableRealOrder;
  } else {
    return 0;
  }
}

export const initCircle = (x: number, y: number, graph: Graph) => {
  const chairCount = CircleAllCount.getChairCount;
  const tableCount = CircleAllCount.getTableCount;

  // 获取场次Id
  const sessionId = Session.getDataId;
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
  const table = graph.createNode(tableParams(circleData, circleTableData));

  runGraphBatch(graph, "create-circle", () => {
    const children: Node[] = [table];

    parent.addChild(table);
    // 椅子角度间隔
    const CHAIR_ANGLE_STEP = 360 / chairCount;
    for (let i = 0; i < chairCount; i++) {
      const angle = (CHAIR_START_ANGLE + CHAIR_ANGLE_STEP * i) * (Math.PI / 180);
      const chair = graph.createNode(circleChairParams(circleData, circleTableData, table, angle, i));
      parent.addChild(chair);
      children.push(chair);
    }

    graph.addNode(parent, { async: true });
    graph.addNodes(children, { async: true });
  });

  // 添加图形组（父节点）
  const graphicsParams = generateGraphics(parent, sessionId);
  await handleCpApi({ params: graphicsParams, code: "seat" }, true);

  const newNodes = graph.getNodes();

  const filterNode = newNodes.filter(
    (ite: Node) => ite.data.nodeType !== "circleContainer" && ite.parent.id === parent.id
  );
  const nodeParams = generateNode(filterNode, sessionId, parent);
  await handleCpApi({ params: nodeParams, code: "seat" }, true);
};
