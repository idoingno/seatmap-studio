// 运行时可变状态的存放处（从 config/index.tsx 拆分）。
// 历史上这批单例直接长在模块作用域里；集中到这里是为了：
// 1) 一眼看清应用有哪些共享可变状态；2) 为后续迁入 Redux 划好边界。
// 注意：始终保持模块内私有 + getter/setter 访问，不要直接导出裸变量。

import type { Graph } from "@antv/x6";

let graph: Graph = null;
let nodeType: string = "";
let rowSpaceArr: any[] = [];
let columnSpaceArr: any[] = [];
let groupData: any[] = [];
let currentColumn: number = -1;
let currentRow: number = -1;

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
