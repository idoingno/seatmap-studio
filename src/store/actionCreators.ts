import {
  ADD_SEAT,
  ADDS_SEAT,
  DEL_SEAT,
  EMPTY_SEAT,
  SHOW_LOADING,
  SHOW_FULL_SCREEN_LOADING,
  SHOW_TIME,
  ADD_DRAG,
  SHOW_CIRCLE_UPDATE,
  IS_LOAD,
} from "./constants";

interface CircleUpdateActionType {
  show: boolean;
  tableName: string;
  tableNameEn: string;
  id: string;
  nodeType: string;
}

export const addAction = (val: string) => ({
  type: ADD_SEAT,
  val,
});

export const addsAction = (val: string[]) => ({
  type: ADDS_SEAT,
  val,
});

export const subAction = (val: string) => ({
  type: DEL_SEAT,
  val,
});

export const emptyAction = () => ({
  type: EMPTY_SEAT,
});

export const showLoadingAction = (val: boolean) => ({
  type: SHOW_LOADING,
  val,
});

export const showFullScreenLoadingAction = (val: boolean) => ({
  type: SHOW_FULL_SCREEN_LOADING,
  val,
});


export const showTimeAction = (val: string) => ({
  type: SHOW_TIME,
  val,
});

export const addDargAction = (val: string) => ({
  type: ADD_DRAG,
  val,
});

export const showCircleUpdateAction = (val: CircleUpdateActionType) => ({
  type: SHOW_CIRCLE_UPDATE,
  val,
});

export const isLoadAction = (val: boolean) => ({
  type: IS_LOAD,
  val,
});

// export const decAction = () => ({
//   type: DECREMENT,
// });
