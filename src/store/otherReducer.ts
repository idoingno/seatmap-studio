// import { createSlice } from "@reduxjs/toolkit";
// // import { cloneDeep } from "lodash";

// export const counterSlice = createSlice({
//   name: "x6-store",
//   initialState: {
//     // graph: {},
//     value: new Set()
//   },
//   reducers: {
//     adds: (state, { payload }) => {
//     },
//     removes: (state, { payload }) => {
//       // state.list = payload;
//     }
//   },
// });

// // 为每个 case reducer 函数生成 Action creators
// export const { adds, removes } = counterSlice.actions;

// export default counterSlice.reducer;

import { ADD_DRAG, SHOW_CIRCLE_UPDATE, IS_LOAD, SHOW_FULL_SCREEN_LOADING } from "./constants";

const defaultState = {
  isDrag: "",
  circleUpdate: {
    show: false,
    tableName: "",
    tableNameEn: "",
    id: "",
    nodeType: "",
  },
  isLoad: false,
  showFullScreenLoading: false,
};

function reducer(state = defaultState, action: { type: string; val: any }) {
  let newState = { ...state };

  switch (action.type) {
    case ADD_DRAG:
      // return Object.assign({}, newState, {
      //   isDrag: action.val
      // })
      newState.isDrag = action.val;
      break;
    case SHOW_CIRCLE_UPDATE:
      newState.circleUpdate = action.val;
      break;
    case IS_LOAD:
      // newState.isLoad = action.val;
      // break;
      return Object.assign({}, newState, {
        isLoad: action.val,
      });
    case SHOW_FULL_SCREEN_LOADING:
      return Object.assign({}, newState, {
        showFullScreenLoading: action.val,
      });

    default:
      break;
  }
  return newState;
}

export default reducer;
