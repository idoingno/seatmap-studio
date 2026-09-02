// config 桶文件：原有 `import ... from "../config"` 调用点无需改动。
// 实现已拆分到：
//   graphOptions.ts   ——  X6 图初始化选项（无运行时状态）
//   materials.ts      ——  拖拽素材表与可用性规则（panelArr 只读）
//   constants.ts      ——  调色板、列序列号等静态常量
//   runtimeState.ts   ——  全局可变单例（graph、Session 等 getter/setter）

export * from "./graphOptions";
export * from "./materials";
export * from "./constants";
export * from "./runtimeState";
