// 运行时数据状态（从 config/runtimeState.ts 迁入 Redux）。
// 迁入后：读 state.runtime.<field> / store.getState().runtime.<field>，
// 写 store.dispatch(runtimeActions.<action>(...))；DevTools 中可见。
// graph 实例等非序列化服务对象仍留在 config/graphInstance.ts。

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RuntimeSliceState {
  /** 场次与大厅标识（嵌入宿主或演示默认值注入） */
  sessionId: string;
  hallId: string;
  /** 宿主注入的表单上下文（导出 Excel 模板时使用） */
  cpForm: any;
  /** 当前拖拽中的素材 nodeType */
  dragNodeType: string;
  /** 当前操作的行/列索引；-1 表示无 */
  currentColumn: number;
  currentRow: number;
  /** 矩阵行列总数（InitMatrixForm 提交后写入，创建/重算时读取） */
  matrixAllRows: number;
  matrixAllColumns: number;
  /** 矩阵画布宽高（行列增删时刷新） */
  matrixWidth: number;
  matrixHeight: number;
  /** 圆桌座位数与桌数 */
  circleChairCount: number;
  circleTableCount: number;
  /** 人员列表缓存 */
  allPersonArr: any[];
}

const initialState: RuntimeSliceState = {
  sessionId: "",
  hallId: "",
  cpForm: {},
  dragNodeType: "",
  currentColumn: -1,
  currentRow: -1,
  matrixAllRows: 0,
  matrixAllColumns: 0,
  matrixWidth: 0,
  matrixHeight: 0,
  circleChairCount: 0,
  circleTableCount: 0,
  allPersonArr: [],
};

const runtimeSlice = createSlice({
  name: "runtime",
  initialState,
  reducers: {
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
    setHallId(state, action: PayloadAction<string>) {
      state.hallId = action.payload;
    },
    setCpForm(state, action: PayloadAction<any>) {
      state.cpForm = action.payload;
    },
    setDragNodeType(state, action: PayloadAction<string>) {
      state.dragNodeType = action.payload;
    },
    setCurrentColumn(state, action: PayloadAction<number>) {
      state.currentColumn = action.payload;
    },
    setCurrentRow(state, action: PayloadAction<number>) {
      state.currentRow = action.payload;
    },
    setMatrixAllRows(state, action: PayloadAction<number>) {
      state.matrixAllRows = action.payload;
    },
    setMatrixAllColumns(state, action: PayloadAction<number>) {
      state.matrixAllColumns = action.payload;
    },
    setMatrixWidth(state, action: PayloadAction<number>) {
      state.matrixWidth = action.payload;
    },
    setMatrixHeight(state, action: PayloadAction<number>) {
      state.matrixHeight = action.payload;
    },
    setCircleChairCount(state, action: PayloadAction<number>) {
      state.circleChairCount = action.payload;
    },
    setCircleTableCount(state, action: PayloadAction<number>) {
      state.circleTableCount = action.payload;
    },
    setAllPersonArr(state, action: PayloadAction<any[]>) {
      state.allPersonArr = action.payload;
    },
  },
});

export const runtimeActions = runtimeSlice.actions;

export default runtimeSlice.reducer;
