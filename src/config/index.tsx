import { Graph } from "@antv/x6";
import type { CellView, Node, View } from "@antv/x6";

import {
  img_triangle,
  img_matrix_layout,
  img_round_layout,
  img_transverse_corridor,
  img_vertical_corridor,
  img_window,
  img_proscenium,
  img_door,
} from "../assets/index";

export interface panelType {
  id?: string;
  name?: string;
  img?: string;
  nodeType?: string;
  list?: panelType[];
  draggable?: boolean;
}

let graph: Graph = null;
let nodeType: string = "";
let rowSpaceArr: any[] = [];
let columnSpaceArr: any[] = [];
let groupData: any[] = [];
let currentColumn: number = -1;
let currentRow: number = -1;

export const scaling = {
  min: 0.2,
  max: 4,
};

export const mousewheel = {
  enabled: true,
  // modifiers: '',
  maxScale: 4,
  minScale: 0.2,
  // zoomAtMousePosition: false,
};

export const panning = {
  enabled: true,
  eventTypes: ["mouseWheelDown" as const],
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
  restrict(view: CellView) {
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

// export const embedding = {
//   enabled: true,
//   findParent({ node }: any) {
//     const bbox = node.getBBox();
//     return this.getNodes().filter((node: any) => {
//       const data = node.getData();
//       if (data && data.parent) {
//         const targetBBox = node.getBBox();
//         return bbox.isIntersectWithRect(targetBBox);
//       }
//       return false;
//     });
//   },
// };

// const MyButton = Button.define<Button.Options>({
//   markup: [
//     {
//       tagName: "rect",
//       selector: "button",
//       attrs: {
//         width: 20,
//         height: 20,
//         rx: 4,
//         ry: 4,
//         fill: "white",
//         stroke: "#fe854f",
//         "stroke-width": 2,
//         cursor: "pointer",
//       },
//     },
//     {
//       tagName: "text",
//       selector: "text",
//       textContent: "+",
//       attrs: {
//         fill: "#fe854f",
//         "font-size": 24,
//         "text-anchor": "middle",
//         "pointer-events": "none",
//         x: 10,
//         y: 17,
//       },
//     },
//   ],
//   onClick({ view, e }: any) {
//   },
// });

// Graph.registerNodeTool("my-btn", MyButton, true);

export const panelArr: panelType[] = [
  // list: [
  {
    id: "1-1",
    name: "矩阵布局",
    img: img_matrix_layout,
    nodeType: "Matrix",
  },
  {
    id: "1-2",
    name: "圆桌布局",
    img: img_round_layout,
    nodeType: "Round",
  },
  {
    id: "1-3",
    name: "横向走廊",
    img: img_transverse_corridor,
    nodeType: "Aisle",
  },
  {
    id: "1-4",
    name: "竖向走廊",
    img: img_vertical_corridor,
    nodeType: "Corridor",
  },
  {
    id: "1-5",
    name: "舞台",
    img: img_proscenium,
    nodeType: "Proscenium",
  },
  {
    id: "1-6",
    name: "窗户",
    img: img_window,
    nodeType: "Window",
  },
  {
    id: "1-7",
    name: "门",
    img: img_door,
    nodeType: "Door",
  },
];
// };
// {
//   id: "2",
//   name: "场景布局",
//   img: img_triangle,
//   list: [
//     {
//       id: "2-1",
//       name: "横向走廊",
//       img: img_transverse_corridor,
//       nodeType: "Aisle",
//     },
//     {
//       id: "2-2",
//       name: "竖向走廊",
//       img: img_vertical_corridor,
//       nodeType: "Corridor",
//     },
//   ],
// },

export const ColorArr = [
  {
    name: "A",
    color: "#FFFFFF",
  },
  {
    name: "B",
    color: "#EA131350",
  },
  {
    name: "C",
    color: "#FFA34050",
  },
  {
    name: "D",
    color: "#ECE30D50",
  },
  {
    name: "E",
    color: "#9F785350",
  },
  {
    name: "F",
    color: "#C0EC0D50",
  },
  {
    name: "G",
    color: "#0DEC4A50",
  },
  {
    name: "H",
    color: "#29601F50",
  },
  {
    name: "I",
    color: "#0DECE250",
  },
  {
    name: "J",
    color: "#0D5FEC50",
  },
  {
    name: "K",
    color: "#224E8750",
  },
  {
    name: "L",
    color: "#720DEC50",
  },
  {
    name: "M",
    color: "#BB0DEC50",
  },
  {
    name: "N",
    color: "#EC0D9050",
  },
  {
    name: "O",
    color: "#33333350",
  },
];

// Excel字母序列号
export const AlphabeticSerialNumber = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "AF",
  "AG",
  "AH",
  "AI",
  "AJ",
  "AK",
  "AL",
  "AM",
  "AN",
  "AO",
  "AP",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AV",
  "AW",
  "AX",
  "AY",
  "AZ",
  "BA",
  "BB",
  "BC",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BK",
  "BL",
  "BM",
  "BN",
  "BO",
  "BP",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BU",
  "BV",
  "BW",
  "BX",
  "BY",
  "BZ",
  "CA",
  "CB",
  "CC",
  "CD",
  "CE",
  "CF",
  "CG",
  "CH",
  "CI",
  "CJ",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CP",
  "CQ",
  "CR",
  "CS",
  "CT",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
];

export function setDragNodeType(val: any) {
  nodeType = val;
}
export function getDragNodeType() {
  return nodeType;
}

export function setGraphs(val: any) {
  graph = val;
  if (typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)) {
    (window as any).__SEATMAP_STUDIO_GRAPH__ = val;
  }
}
export function getGraph() {
  return graph;
}

export function setRowSpaceArr(val: any) {
  rowSpaceArr = val;
}
export function getRowSpaceArr() {
  return rowSpaceArr;
}

export function setColumnSpaceArr(val: any) {
  columnSpaceArr = val;
}
export function getColumnSpaceArr() {
  return columnSpaceArr;
}

export function setGroupData(val: any) {
  groupData = val;
}
export function getGroupData() {
  return groupData;
}

export function setCurrentColumn(val: any) {
  currentColumn = val;
}
export function getCurrentColumn() {
  return currentColumn;
}

export function setCurrentRow(val: any) {
  currentRow = val;
}

export function getCurrentRow() {
  return currentRow;
}

export const MatrixAllRowsOrColumns = {
  allRows: 0,
  allColumns: 0,
  set setAllRows(val: number) {
    this.allRows = val;
  },
  get getAllRows() {
    return this.allRows;
  },
  set setAllColumns(val: number) {
    this.allColumns = val;
  },
  get getAllColumns() {
    return this.allColumns;
  },
};

export const CircleAllCount = {
  currentChairCount: 0,
  currentTableCount: 0,
  // allColumns: 0,
  set setChairCount(val: number) {
    this.currentChairCount = val;
  },
  get getChairCount() {
    return this.currentChairCount;
  },
  set setTableCount(val: number) {
    this.currentTableCount = val;
  },
  get getTableCount() {
    return this.currentTableCount;
  },
};

export const currentSpaceCount = {
  count: 0,
  set(val: number) {
    this.count += val;
  },
  get() {
    return this.count;
  },
};

export const MatrixSize = {
  mWidth: 0,
  mHeight: 0,
  set setMw(val: number) {
    this.mWidth = val;
  },
  set setMh(val: number) {
    this.mHeight = val;
  },
  get getMw() {
    return this.mWidth;
  },
  get getMh() {
    return this.mHeight;
  },
};

export const PersonTreeData = {
  data: [] as any[],
  set setData(data: any[]) {
    this.data = data;
  },
  get getData() {
    return this.data;
  },
};

export const Session = {
  sessionId: "",
  hallId: "",
  set setDataId(val: string) {
    this.sessionId = val;
  },
  get getDataId() {
    return this.sessionId;
  },
  set setHallId(val: string) {
    this.hallId = val;
  },
  get getHallId() {
    return this.hallId;
  },
};

export const CPForm = {
  form: {},
  set setForm(val: any) {
    this.form = val;
  },
  get getForm() {
    return this.form;
  },
};

export const LoadingStatus = {
  loading: false,
  set setLoading(val: boolean) {
    this.loading = val;
  },
  get getLoading() {
    return this.loading;
  },
};

export const AllPersonArr = {
  arr: [] as any,
  set setArr(val: []) {
    this.arr = val;
  },
  get getArr() {
    return this.arr;
  },
};

export const IsDragElement = {
  isFlag: false,
  set setFlag(val: boolean) {
    this.isFlag = val;
  },
  get getFlag() {
    return this.isFlag;
  },
};

export const ShowCircleUpdateModal = {
  show: "",
  set setShow(val: boolean) {
    this.show = val;
  },
  get getShow() {
    return this.show;
  },
};
