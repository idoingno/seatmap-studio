import { Graph, Node } from "@antv/x6";
import {
  ColorArr,
  Session,
  getColumnSpaceArr,
  getDragNodeType,
  getGraph,
  setColumnSpaceArr,
  setCurrentColumn,
  setCurrentRow,
} from "../config";
import {
  AISLE_DEFAULT_SIZE,
  AISLE_SIZE,
  CHAIR_SIZE,
  MATRIX_OFFSET_DISTANCE,
  MATRIX_OFFSET_SIZE_DISTANCE,
  SPACE_SIZE,
} from "../GlobalVar";

import { updateGraphics } from "./apiParams";
import { handleCpApi } from "../api";

export interface pProps {
  x: number;
  y: number;
}

export interface ParamsProps {
  data?: Node[];
  shape?: string;
  label?: string;
  idt?: string;
  idx?: number;
  direction?: string;
}

export interface MatrixMenuIndex {
  allChildren: Node[];
  columnBottomNodes: Node[];
  columnBottomTextByIdx: Map<number, Node>;
  columnSpaceByIdx: Map<number, Node>;
  columnTopTextByIdx: Map<number, Node>;
  parent: Node;
  rowEnNodes: Node[];
  rowSpaceByIdx: Map<number, Node>;
  rowTextByIdx: Map<number, Node>;
  rowTextEnByIdx: Map<number, Node>;
  chairsByColumn: Map<number, Node[]>;
  chairsByRow: Map<number, Node[]>;
}

export const getNodeChildren = (parent: Node | null | undefined): Node[] => {
  const directChildren = (parent as Node & { children?: Node[] } | null | undefined)?.children;
  if (Array.isArray(directChildren) && directChildren.length) {
    return directChildren.filter(Boolean) as Node[];
  }

  const nestedChildren = (((parent?.getChildren() as unknown as Node[] | null) ?? []).filter(Boolean) as Node[]);
  if (nestedChildren.length) {
    return nestedChildren;
  }

  if (!parent) {
    return [];
  }

  return getGraph()
    .getNodes()
    .filter((node) => {
      const currentNode = node as Node;
      const currentParent = currentNode.getParent?.() ?? ((currentNode as Node & { parent?: Node }).parent ?? null);
      return currentParent?.id === parent.id;
    }) as Node[];
};

export const buildMatrixMenuIndex = (parent: Node): MatrixMenuIndex => {
  const allChildren = getNodeChildren(parent);
  const index: MatrixMenuIndex = {
    allChildren,
    columnBottomNodes: [],
    columnBottomTextByIdx: new Map(),
    columnSpaceByIdx: new Map(),
    columnTopTextByIdx: new Map(),
    parent,
    rowEnNodes: [],
    rowSpaceByIdx: new Map(),
    rowTextByIdx: new Map(),
    rowTextEnByIdx: new Map(),
    chairsByColumn: new Map(),
    chairsByRow: new Map(),
  };

  for (const node of allChildren) {
    const nodeType = node.data?.nodeType;
    const idx = Number(node.data?.idx);

    if (nodeType === "matrixRows") {
      index.rowTextByIdx.set(idx, node);
      continue;
    }

    if (nodeType === "matrixRowsEn") {
      index.rowTextEnByIdx.set(idx, node);
      index.rowEnNodes.push(node);
      continue;
    }

    if (nodeType === "aisleRowSpace") {
      index.rowSpaceByIdx.set(idx, node);
      continue;
    }

    if (nodeType === "matrixColumnTopNum") {
      index.columnTopTextByIdx.set(idx, node);
      continue;
    }

    if (nodeType === "matrixColumnBottomNum") {
      index.columnBottomTextByIdx.set(idx, node);
      index.columnBottomNodes.push(node);
      continue;
    }

    if (nodeType === "corridorColumnSpace") {
      index.columnSpaceByIdx.set(idx, node);
      continue;
    }

    if (nodeType === "matrixChair") {
      const [rowKey, columnKey] = String(node.data?.idt ?? "-").split("-");
      const rowIndex = Number(rowKey);
      const columnIndex = Number(columnKey);

      if (!Number.isNaN(rowIndex)) {
        const rowNodes = index.chairsByRow.get(rowIndex) ?? [];
        rowNodes.push(node);
        index.chairsByRow.set(rowIndex, rowNodes);
      }

      if (!Number.isNaN(columnIndex)) {
        const columnNodes = index.chairsByColumn.get(columnIndex) ?? [];
        columnNodes.push(node);
        index.chairsByColumn.set(columnIndex, columnNodes);
      }
    }
  }

  return index;
};

export const isOutElementCorridor = (p1: pProps) => {
  // 设置当前列为-1
  setCurrentColumn(-1);
  isOutElement("corridorColumnSpace-", p1);
};

export const isOutElementAisle = (p1: pProps) => {
  // 设置当前行为-1
  setCurrentRow(-1);
  isOutElement("aisleRowSpace-", p1);
};

const filterSpaceArr = (nodes: Node[], str: string) => {
  return nodes.filter((item: Node) => item.data.idt && item.data.idt.includes(str) && !item.data.isExist);
};

const isOutElement = (str: string, p1: pProps) => {
  const graph = getGraph();
  const nodes = graph.getNodes();

  const spaceArr = filterSpaceArr(nodes, str);

  for (let i = 0; i < spaceArr.length; i++) {
    const element = spaceArr[i];
    const { x, y } = element.position();
    const size = element.size();

    let objB_x = 0;
    let objB_y = 0;
    let rectB_width = 0;
    let rectB_height = 0;
    if (str === "aisleRowSpace-") {
      objB_x = x;
      objB_y = y - 10;
      rectB_width = objB_x + size.width;
      rectB_height = objB_y + AISLE_DEFAULT_SIZE + 20;
    } else {
      objB_x = x - 10;
      objB_y = y;
      rectB_width = objB_x + AISLE_DEFAULT_SIZE + 20;
      rectB_height = objB_y + size.height;
    }

    if (p1.x > objB_x && p1.x < rectB_width && p1.y > objB_y && p1.y < rectB_height) {
      element.setAttrs({
        body: {
          fill: "rgba(179,147,114,.3)",
        },
      });
      str === "aisleRowSpace-" ? setCurrentRow(element.data.idx) : setCurrentColumn(element.data.idx);
    } else {
      element.attr("body/fill", "transparent");
    }
  }
};

export const sliceText = (str: string) => {
  return str.slice(-2, str.length);
};

export const isOutChair = (p1: pProps, chairArr: any) => {
  for (let i = 0; i < chairArr.length; i++) {
    const element = chairArr[i];

    const { x, y } = element.position();
    const { width, height } = element.size();

    let objB_x = x;
    let objB_y = y;
    let rectB_width = objB_x + width;
    let rectB_height = objB_y + height;

    if (p1.x > objB_x && p1.x < rectB_width && p1.y > objB_y && p1.y < rectB_height) {
      return {
        flag: true,
        element,
      };
    } else {
    }
  }
  return {
    flag: false,
    element: null,
  };
};

export const setChairPerson = (node: any, item: any) => {
  if (node) {
    const { nodeType } = node.data;
    const getAttr = () => {
      if (nodeType === "matrixChair") {
        const { idt } = node.data;
        const arr = idt.split("-");
        return {
          row: Number(arr[0]) + 1,
          column: Number(arr[1]) + 1,
        };
      } else if (nodeType === "circleChair") {
        return {
          circleChairName: node.parent.data.tableName,
          circleChairNameEn: node.parent.data.tableNameEn,
        };
      }
    };

    node.attr({
      xnode: {
        key: item.id,
        title: item.title,
        subTitle: item.subTitle,
        otherName: item.otherName || "",
        orgType: item.orgType,
        ...getAttr(),
      },
      text: {
        text: sliceText(item.title),
        fill: "#FFFFFF",
      },
      // label: {
      //   text: sliceText(data.title),
      //   fill: "#FFFFFF",
      // },
      svg: {
        fill: "#B39372",
        style: item.orgType === "pattern" ? "display:none" : "display:block",
      },
      image: {
        style: item.orgType === "pattern" ? "display:block" : "display:none",
      },
    });
  }
};

export const changeSeatChair = (node: any, xnode: any) => {
  if (node) {
    node.attr({
      xnode,
      text: {
        text: sliceText(xnode.title),
        fill: "#FFFFFF",
      },
      // label: {
      //   text: sliceText(data.title),
      //   fill: "#FFFFFF",
      // },
      svg: {
        fill: "#B39372",
        style: xnode.orgType === "pattern" ? "display:none" : "display:block",
      },
      image: {
        style: xnode.orgType === "pattern" ? "display:block" : "display:none",
      },
    });
  }
};

export const parentAddText = (params: ParamsProps) => {
  const graph = getGraph();
  const { data, shape, label, idt, idx, direction } = params;
  const element = data[0];
  const { x, y } = element.getPosition();
  const parent = element.getParent();

  const child = graph.createNode({
    shape,
    x: direction === "right" ? x + MATRIX_OFFSET_DISTANCE : x,
    y: direction === "bottom" ? y + MATRIX_OFFSET_DISTANCE : y,
    label,
    data: { idt, idx },
  });

  parent.addChild(child);
  return child;
};

export const sortCompareFn = (a: any, b: any) => {
  return Number(a.data.idt.split("-")[0]) - Number(b.data.idt.split("-")[0]);
};

export const sortCompareFn2 = (a: any, b: any) => {
  return Number(a.data.idt.split("-")[1]) - Number(b.data.idt.split("-")[1]);
};

export const sortCompareFn3 = (a: any, b: any) => {
  return a.data.idx - b.data.idx;
};

export const parentAddChair = (data: Node[], row: number, direction: string) => {
  const graph = getGraph();

  const sortData = data.sort(sortCompareFn).sort(sortCompareFn2);
  const children: Node[] = [];
  for (let i = 0; i < sortData.length; i++) {
    const element = sortData[i] as Node;
    let { x, y } = element.getPosition();
    const idt = direction === "bottom" || direction === "top" ? `${row}-${i}` : `${i}-${row}`;

    const parent = element.getParent();
    const child = graph.createNode({
      shape: "chair-node",
      x: direction === "right" ? x + MATRIX_OFFSET_DISTANCE : x,
      y: direction === "bottom" ? y + MATRIX_OFFSET_DISTANCE : y,
      data: {
        idt: idt,
        idx: row,
        matrixChairName: direction === "bottom" || direction === "top" ? "新增行" : element.data.matrixChairName,
        matrixChairNameEn: direction === "bottom" || direction === "top" ? "新增行" : element.data.matrixChairNameEn,
        matrixChairTopName: direction === "left" || direction === "right" ? "新增列" : element.data.matrixChairTopName,
        matrixChairBottomName:
          direction === "left" || direction === "right" ? "新增列" : element.data.matrixChairBottomName,
      },
    });
    parent.addChild(child);
    children.push(child);
  }

  return children;
};

export const parentAddRoworColumn = (params: ParamsProps) => {
  const graph = getGraph();
  const { data, shape, label, idt, idx, direction } = params;
  const element = data[0];
  const { x, y } = element.getPosition();
  const parent = element.getParent();
  const { width, height } = element.size();

  const new_x = width > 6 ? x + MATRIX_OFFSET_SIZE_DISTANCE : x + MATRIX_OFFSET_DISTANCE;
  const new_y = height > 6 ? y + MATRIX_OFFSET_SIZE_DISTANCE : y + MATRIX_OFFSET_DISTANCE;

  const child = graph.createNode({
    shape,
    x: direction === "right" ? new_x : x,
    y: direction === "bottom" ? new_y : y,
    width: direction === "left" || direction === "right" ? AISLE_DEFAULT_SIZE : width,
    height: direction === "top" || direction === "bottom" ? AISLE_DEFAULT_SIZE : height,
    data: { idt, idx },
  });
  parent.addChild(child);
  return child;
};

export const setAllCorridorColumnH = (nodes: Node[], name: string, num: number) => {
  const allCorridorColumnspace = nodes.filter((ite: Node) => ite.data.idt && ite.data.idt.includes(name));

  for (let i = 0; i < allCorridorColumnspace.length; i++) {
    const element = allCorridorColumnspace[i];
    const { width, height } = element.size();

    const obj1 = {
      width: num,
      height,
    };

    const obj2 = {
      width,
      height: num,
    };

    const size = name === "aisleRowSpace" ? obj1 : obj2;
    element.setProp({ size });
  }
};

export const resizeWindow = async (height: number) => {
  const graph = getGraph();
  const nodes = graph.getNodes();
  const findWindow = nodes.filter((ite: Node) => ite.data.nodeType === "windowNode");
  // 获取场次Id
  const sessionId = Session.getDataId;

  if (findWindow && findWindow.length > 0) {
    for (let i = 0; i < findWindow.length; i++) {
      const element = findWindow[i];
      element.setProp({
        size: {
          width: 48,
          height,
        },
      });

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(element, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);
    }
  }
};

export const resizeProscenium = async (width: number) => {
  const graph = getGraph();
  const nodes = graph.getNodes();
  const finProscenium = nodes.filter((ite: Node) => ite.data.nodeType === "prosceniumNode");
  // 获取场次Id
  const sessionId = Session.getDataId;

  if (finProscenium && finProscenium.length > 0) {
    for (let i = 0; i < finProscenium.length; i++) {
      const element = finProscenium[i];
      element.setProp({
        size: {
          width,
          height: 48,
        },
      });

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(element, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);
    }
  }
};

export const listToTreeSimple = (data: any[]) => {
  if (data && data.length) {
    // * 先生成parent建立父子关系
    const obj: any = {};
    data.forEach((item) => {
      obj[item.id] = item;
    });

    const parentList: any[] = [];
    data.forEach((item) => {
      const parent = obj[item.pid];
      if (parent) {
        // * 当前项有父节点
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        // * 当前项没有父节点 -> 顶层
        parentList.push(item);
      }
    });
    return parentList;
  }
};

export function time(time = +new Date()) {
  var date = new Date(time + 8 * 3600 * 1000);
  return date.toJSON().substr(0, 19).replace("T", " ").replace(/-/g, ":").slice(10, 19);
}

export const findColor = (name: string) => {
  const color = ColorArr.find((item) => item.name === name)
  return name === 'A' ? 'transparent' : color.color || ''
};

export const base64ToFile = (urlData: string) => {
  const arr = urlData.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bytes = atob(arr[1]);
  let n = bytes.length;
  const ia = new Uint8Array(n);
  while (n--) {
    ia[n] = bytes.charCodeAt(n);
  }
  return new File([ia], "jpeg", { type: mime });
};

export const isEnvironment = () => {
  return window.location.pathname === "/" ? "lab" : "op";
};
