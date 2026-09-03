/**
 * 设计 Token 单源（CommonJS — webpack.config.js 直接 require）
 *
 * - antd 主题变量（modifyVars）由 antdVars 派生
 * - TS 运行时通过 ../styles/tokens 导入（类型见 tokens.d.ts）
 * - style.less 头部 :root 用同名字面量桥接出 CSS custom properties；
 *   修改颜色时只改这里 + style.less 的桥接段（两处都引用下方的注释锚点）
 */

const colors = {
  accent: "#19766f",
  accentText: "#145f59",
  accentSoft: "rgba(25, 118, 111, 0.1)",
  accentBorder: "rgba(25, 118, 111, 0.26)",

  ink: "#263431",
  textBody: "#667673",

  canvas: "#e8eceb",
  panel: "#ffffff",
  panelBorder: "#cfd7d5",

  // 语义色
  seatOccupied: "#2f8f86",
  seatEmpty: "#ffffff",

  brass: "#b58a3a",
};

const radius = {
  base: "2px",
  island: "12px",
};

const shadow = {
  island: "0 2px 10px rgba(38, 52, 49, 0.08), 0 1px 3px rgba(38, 52, 49, 0.06)",
};

// DOM 浮层 z-index 标度（挂住 antd 4 原生基线：Popover/Modal=1000、Message=1010）
// 历史曾经为适配低代码宿主把 Modal/toast 抬到 1e6/1e8，宿主约束解除后回落到原生标度。
// .less 里的数字以此处层名注释引用；TSX 侧不再传 zIndex 覆盖 antd 默认。
const overlay = {
  // 画布缩放工具条
  toolbar: 99,
  // 浮层面板（ColorPanel / ChairCard / ColorEdit）
  floatPanel: 1000,
  // antd Modal 原生层级——仅作文档锚点，不再用 props 覆盖
  modal: 1000,
  // antd message 原生层级 1010——不再在全局 less 里强制改写
  // 自定义 toast：压过 antd message（1010）与 modal（1000）
  toast: 1060,
};

const antdVars = {
  "primary-color": colors.accent,
  "link-color": colors.accent,
  "border-radius-base": radius.base,
};

module.exports = { colors, radius, shadow, overlay, antdVars };
