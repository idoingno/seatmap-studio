// 布局素材缩略图：浅色扁平风，与全局设计系统 token 保持一致
// （纸白面板、汽油绿 #19766f、黄铜 #b58a3a，见 src/style.less）。
// 卡片容器 .material-card-inner 本身已带浅底与边框，缩略图不再绘制外框，
// 避免深色底卡 + 双重边框造成的视觉冲突。

const encodeSvg = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const PETROL = "#19766f";
const PETROL_SOFT = "rgba(25, 118, 111, 0.12)";
const PETROL_LINE = "rgba(25, 118, 111, 0.34)";
const BRASS = "#b58a3a";

const makeMaterialSvg = (inner: string) =>
  encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96" fill="none">
    ${inner}
  </svg>`);

export const img_matrix_layout = makeMaterialSvg(`
  <g>
    <rect x="26" y="24" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.92" />
    <rect x="42" y="24" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.92" />
    <rect x="58" y="24" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.92" />
    <rect x="74" y="24" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.92" />
    <rect x="90" y="24" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.92" />
    <rect x="26" y="40" width="10" height="10" rx="3" fill="${PETROL_SOFT}" />
    <rect x="42" y="40" width="10" height="10" rx="3" fill="${PETROL_SOFT}" />
    <rect x="58" y="40" width="10" height="10" rx="3" fill="${PETROL_SOFT}" />
    <rect x="74" y="40" width="10" height="10" rx="3" fill="${PETROL_SOFT}" />
    <rect x="90" y="40" width="10" height="10" rx="3" fill="${PETROL_SOFT}" />
    <rect x="26" y="56" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.55" />
    <rect x="42" y="56" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.55" />
    <rect x="58" y="56" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.55" />
    <rect x="74" y="56" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.55" />
    <rect x="90" y="56" width="10" height="10" rx="3" fill="${PETROL}" fill-opacity="0.55" />
    <path d="M22 36H104" stroke="${BRASS}" stroke-opacity="0.8" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 5" />
  </g>
`);

export const img_round_layout = makeMaterialSvg(`
  <circle cx="64" cy="48" r="18" fill="#ffffff" stroke="${PETROL}" stroke-width="2.5" />
  <circle cx="64" cy="48" r="9" fill="none" stroke="${BRASS}" stroke-opacity="0.75" stroke-width="2" stroke-dasharray="3 4" />
  <g fill="${PETROL}">
    <circle cx="64" cy="18" r="5" />
    <circle cx="88" cy="28" r="5" />
    <circle cx="98" cy="52" r="5" />
    <circle cx="84" cy="74" r="5" />
    <circle cx="64" cy="80" r="5" />
    <circle cx="44" cy="74" r="5" />
    <circle cx="30" cy="52" r="5" />
    <circle cx="40" cy="28" r="5" />
  </g>
`);

export const img_transverse_corridor = makeMaterialSvg(`
  <rect x="18" y="38" width="92" height="20" rx="10" fill="${PETROL_SOFT}" stroke="${PETROL_LINE}" stroke-width="2" />
  <path d="M30 48H98" stroke="${BRASS}" stroke-opacity="0.8" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 6" />
  <path d="M26 48L34 43V53Z" fill="${BRASS}" fill-opacity="0.85" />
  <path d="M102 48L94 43V53Z" fill="${BRASS}" fill-opacity="0.85" />
`);

export const img_vertical_corridor = makeMaterialSvg(`
  <rect x="54" y="16" width="20" height="64" rx="10" fill="${PETROL_SOFT}" stroke="${PETROL_LINE}" stroke-width="2" />
  <path d="M64 28V68" stroke="${BRASS}" stroke-opacity="0.8" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 6" />
  <path d="M64 20L59 28H69Z" fill="${BRASS}" fill-opacity="0.85" />
  <path d="M64 76L59 68H69Z" fill="${BRASS}" fill-opacity="0.85" />
`);

export const img_proscenium = makeMaterialSvg(`
  <path d="M28 60Q64 24 100 60" fill="${PETROL_SOFT}" stroke="${PETROL}" stroke-width="2.5" />
  <rect x="28" y="60" width="72" height="10" rx="5" fill="${BRASS}" fill-opacity="0.88" />
  <circle cx="52" cy="44" r="2.5" fill="${BRASS}" fill-opacity="0.85" />
  <circle cx="64" cy="39" r="2.5" fill="${BRASS}" fill-opacity="0.85" />
  <circle cx="76" cy="44" r="2.5" fill="${BRASS}" fill-opacity="0.85" />
`);

export const img_window = makeMaterialSvg(`
  <rect x="40" y="18" width="48" height="60" rx="12" fill="${PETROL_SOFT}" stroke="${PETROL_LINE}" stroke-width="2.5" />
  <path d="M64 22V74" stroke="${PETROL}" stroke-opacity="0.7" stroke-width="2" />
  <path d="M44 48H84" stroke="${PETROL}" stroke-opacity="0.7" stroke-width="2" />
  <circle cx="64" cy="48" r="2.5" fill="${BRASS}" />
`);

export const img_door = makeMaterialSvg(`
  <path d="M38 74V24C38 21.8 39.8 20 42 20H86C88.2 20 90 21.8 90 24V74" fill="${PETROL_SOFT}" stroke="${PETROL}" stroke-width="2.5" />
  <path d="M64 24V74" stroke="${PETROL}" stroke-opacity="0.7" stroke-width="2" />
  <circle cx="56" cy="48" r="2.5" fill="${BRASS}" />
`);
