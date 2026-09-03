import { Cell, Node } from "@antv/x6";

// 防御：所有批处理入口要求数组入参，非数组时返回空并告警，避免运行时抛错
// 返回值保持 any[]，与本文件既有的 `Node[] | any[]` 宽松签名保持一致
const asArray = (items: any, context: string): any[] => {
  if (!Array.isArray(items)) {
    console.warn(`${context}: expected an array, got`, items);
    return [];
  }
  return items;
};

//  生成图形组
export const generateGraphics = (node: Node | Cell | any, sessionId: string, asyncOrNot = false) => {
  const { x, y } = node.getPosition();
  const { width, height } = node.size();
  return {
    type: "graph",
    sessionId: sessionId,
    asyncOrNot: asyncOrNot,
    graph: JSON.stringify([
      {
        update: {
          id: node.id,
          name: node.label,
          s_type: node.data.nodeType,
          s_x_axis: x,
          s_y_axis: y,
          s_session: sessionId,
          s_w: width,
          s_h: height,
          s_data: node.data,
        },
      },
    ]),
  };
};

//  生成节点
export const generateNode = (nodes: Node[] | any[], sessionId: string, parent: Node, asyncOrNot = false) => {
  const newNodes = asArray(nodes, "generateNode").map((node) => {
    const { x, y } = node.getPosition();
    const { width, height } = node.size();
    return {
      update: {
        id: node.id,
        name: node.label,
        s_type: node.data.nodeType,
        s_x_axis: x,
        s_y_axis: y,
        s_session: sessionId,
        s_graph: parent.id,
        s_w: width,
        s_h: height,
        s_visible: true,
        s_data: node.data,
        s_seat:
          node.data.nodeType === "matrixChair"
            ? `${node.data.matrixChairName}-${node.data.matrixChairTopName}座`
            : node.data.nodeType === "circleChair"
            ? `${node.data.tableName}-${node.data.idx + 1}座`
            : "",
        s_seat_en:
          node.data.nodeType === "matrixChair"
            ? `${node.data.matrixChairNameEn}-${node.data.matrixChairTopName}`
            : node.data.nodeType === "circleChair"
            ? `${node.data.tableNameEn}-${node.data.idx + 1}`
            : "",
      },
    };
  });

  return {
    type: "node",
    sessionId: sessionId,
    asyncOrNot: asyncOrNot,
    node: JSON.stringify([...newNodes]),
  };
};

//  更新节点
export const updateNode = (nodes: Node[] | any[], sessionId: string, parent: Node | Cell, asyncOrNot = false) => {
  const newNodes = asArray(nodes, "updateNode").map((node) => {
    const { x, y } = node.getPosition();
    const { width, height } = node.size();
    return {
      query: { id: node.id },
      update: {
        id: node.id,
        name: node.label,
        s_type: node.data.nodeType,
        s_x_axis: x,
        s_y_axis: y,
        s_session: sessionId,
        s_graph: parent.id,
        s_w: width,
        s_h: height,
        s_visible: node.data.visible,
        s_data: node.data,

        s_seat:
          node.data.nodeType === "matrixChair"
            ? `${node.data.matrixChairName}-${node.data.matrixChairTopName}座`
            : node.data.nodeType === "circleChair"
            ? `${node.data.tableName}-${node.data.idx + 1}座`
            : "",
        s_seat_en:
          node.data.nodeType === "matrixChair"
            ? `${node.data.matrixChairNameEn}-${node.data.matrixChairTopName}`
            : node.data.nodeType === "circleChair"
            ? `${node.data.tableNameEn}-${node.data.idx + 1}`
            : "",
      },
    };
  });

  return {
    type: "node",
    // sessionId: sessionId,
    asyncOrNot: asyncOrNot,
    node: JSON.stringify([...newNodes]),
  };
};

//  更新节点区域信息
export const updateNodeRegion = (regionArr: Node[] | any[], sessionId: string, asyncOrNot = false) => {
  let newNodes: Node[] = [];
  asArray(regionArr, "updateNodeRegion").forEach((item: any) => {
    newNodes = item.nodes.map((node: Node | any) => {
      const { x, y } = node.getPosition();
      const { width, height } = node.size();
      return {
        query: { id: node.id },
        update: {
          id: node.id,
          name: node.label,
          s_type: node.data.nodeType,
          s_x_axis: x,
          s_y_axis: y,
          s_session: sessionId,
          s_graph: node.parent.id,
          s_w: width,
          s_h: height,
          s_visible: node.data.visible,
          s_data: node.data,
          s_region: item.s_region,
          s_color: item.s_color,

          s_seat:
            node.data.nodeType === "matrixChair"
              ? `${node.data.matrixChairName}-${node.data.matrixChairTopName}座`
              : node.data.nodeType === "circleChair"
              ? `${node.data.tableName}-${node.data.idx + 1}座`
              : "",
          s_seat_en:
            node.data.nodeType === "matrixChair"
              ? `${node.data.matrixChairNameEn}-${node.data.matrixChairTopName}`
              : node.data.nodeType === "circleChair"
              ? `${node.data.tableNameEn}-${node.data.idx + 1}`
              : "",
        },
      };
    });
  });

  return {
    type: "node",
    // sessionId: sessionId,
    asyncOrNot: asyncOrNot,
    node: JSON.stringify([...newNodes]),
  };
};

//  更新图形组
export const updateGraphics = (node: Node | Cell | any, sessionId: string, asyncOrNot = false) => {
  const { x, y } = node.getPosition();
  const { width, height } = node.size();

  return {
    type: "graph",
    sessionId: sessionId,
    asyncOrNot: asyncOrNot,
    graph: JSON.stringify([
      {
        query: { id: node.id },
        update: {
          id: node.id,
          name: node.label,
          s_type: node.data.nodeType,
          s_x_axis: x,
          s_y_axis: y,
          s_session: sessionId,
          s_w: width,
          s_h: height,
          s_data: node.data,
        },
      },
    ]),
  };
};

// 删除节点：
export const delNode = (nodes: Node[] | Cell[] | any[], sessionId: string) => {
  const newNodesIds = asArray(nodes, "delNode").map((node) => {
    return {
      id: node.id,
    };
  });
  return {
    type: "node",
    sessionId: sessionId,
    isDelete: "true",
    node: JSON.stringify(newNodesIds),
  };
};

// 人员添加
export const generatePersonnel = (personArr: any[]) => {
  const newNodes = asArray(personArr, "generatePersonnel").map((item) => {
    return {
      query: { id: item.id },
      update: {
        s_node_id: item.node.id,
        s_graph: item.node.parent.id,
        s_node_name: item.name,
        s_seat_english:
          item.node.data.nodeType === "matrixChair"
            ? `${item.node.data.matrixChairNameEn}-${item.node.data.matrixChairTopName}`
            : `${item.node.data.tableNameEn}-${item.node.data.idx + 1}`,
        s_seat:
          item.node.data.nodeType === "matrixChair"
            ? `${item.node.data.matrixChairName}-${item.node.data.matrixChairTopName}座`
            : `${item.node.data.tableName}-${item.node.data.idx + 1}座`,
      },
    };
  });

  return {
    type: "personnel",
    personnel: JSON.stringify([...newNodes]),
  };
};

// 人员删除
export const delPersonnel = (personArr: any[], sessionId: string, asyncOrNot = true) => {
  const newNodes = asArray(personArr, "delPersonnel").map((item) => {
    return {
      query: { id: item.id },
      update: {
        $unsetColumns: "s_graph,s_seat_version,s_node_id,s_seat_pic,s_node_name,s_seat,s_seat_english,s_color,s_region",
      },
    };
  });

  return {
    type: "personnel",
    asyncOrNot,
    sessionId,
    personnel: asyncOrNot ? JSON.stringify([...newNodes]) : "",
  };
};

// 根据图形组id删除图形组
export const delGraphics = (node: Node) => {
  return {
    type: "empty",
    graphId: node.id,
  };
};

// 清空
export const emptyGraph = (sessionId: string) => {
  return {
    type: "empty",
    sessionId,
  };
};

// 查询座位信息
export const querySeatInfo = (sessionId: string) => {
  return {
    type: "query",
    sessionId,
  };
};
