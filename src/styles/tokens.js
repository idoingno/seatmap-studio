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

const antdVars = {
  "primary-color": colors.accent,
  "link-color": colors.accent,
  "border-radius-base": radius.base,
};

module.exports = { colors, radius, shadow, antdVars };
