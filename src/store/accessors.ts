import store from "./index";

/**
 * 运行时状态的统一读取口。
 *
 * 事件回调/纯模块请统一走 getRuntime()，避免把
 * `store.getState().runtime.xxx` 这条消息链散落在各调用文件里；
 * React 组件的渲染侧读取仍走 useSelector。
 */
export const getRuntime = () => store.getState().runtime;

/** 矩阵行/列数总是被成对读取——合并为一个维度访问器，避免数据簇重复出现 */
export const getMatrixDimensions = () => {
  const runtime = store.getState().runtime;
  return { rows: runtime.matrixAllRows, columns: runtime.matrixAllColumns };
};
