const encodeSvg = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const frame = `
  <defs>
    <linearGradient id="cardGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1dfc1" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#7b5b32" stop-opacity="0.08" />
    </linearGradient>
    <linearGradient id="accentGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f4d8aa" />
      <stop offset="100%" stop-color="#b8894c" />
    </linearGradient>
    <linearGradient id="accentBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9fd2ff" />
      <stop offset="100%" stop-color="#4e759f" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect x="6" y="6" width="116" height="84" rx="18" fill="#0d1015" stroke="url(#cardGlow)" />
  <rect x="12" y="12" width="104" height="72" rx="14" fill="#121821" stroke="rgba(255,255,255,0.06)" />
`;

const makeMaterialSvg = (inner: string) =>
  encodeSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96">
    ${frame}
    ${inner}
  </svg>`);

export const img_matrix_layout = makeMaterialSvg(`
  <g opacity="0.95">
    <rect x="26" y="24" width="10" height="10" rx="3" fill="url(#accentGold)" />
    <rect x="42" y="24" width="10" height="10" rx="3" fill="url(#accentGold)" />
    <rect x="58" y="24" width="10" height="10" rx="3" fill="url(#accentGold)" />
    <rect x="74" y="24" width="10" height="10" rx="3" fill="url(#accentGold)" />
    <rect x="90" y="24" width="10" height="10" rx="3" fill="url(#accentGold)" />
    <rect x="26" y="40" width="10" height="10" rx="3" fill="#f7f0e3" fill-opacity="0.9" />
    <rect x="42" y="40" width="10" height="10" rx="3" fill="#f7f0e3" fill-opacity="0.9" />
    <rect x="58" y="40" width="10" height="10" rx="3" fill="#f7f0e3" fill-opacity="0.9" />
    <rect x="74" y="40" width="10" height="10" rx="3" fill="#f7f0e3" fill-opacity="0.9" />
    <rect x="90" y="40" width="10" height="10" rx="3" fill="#f7f0e3" fill-opacity="0.9" />
    <rect x="26" y="56" width="10" height="10" rx="3" fill="url(#accentGold)" fill-opacity="0.7" />
    <rect x="42" y="56" width="10" height="10" rx="3" fill="url(#accentGold)" fill-opacity="0.7" />
    <rect x="58" y="56" width="10" height="10" rx="3" fill="url(#accentGold)" fill-opacity="0.7" />
    <rect x="74" y="56" width="10" height="10" rx="3" fill="url(#accentGold)" fill-opacity="0.7" />
    <rect x="90" y="56" width="10" height="10" rx="3" fill="url(#accentGold)" fill-opacity="0.7" />
    <path d="M22 36H104" stroke="#80a6d0" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="4 4" />
  </g>
`);

export const img_round_layout = makeMaterialSvg(`
  <g filter="url(#softGlow)">
    <circle cx="64" cy="48" r="18" fill="rgba(255,255,255,0.04)" stroke="url(#accentGold)" stroke-width="3" />
  </g>
  <g fill="#f5e8d1">
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
  <rect x="18" y="38" width="92" height="20" rx="10" fill="rgba(120,165,210,0.12)" stroke="url(#accentBlue)" stroke-width="2.5" />
  <path d="M28 48H100" stroke="#dcecff" stroke-opacity="0.8" stroke-width="2.5" stroke-dasharray="7 7" />
  <path d="M24 48L34 42V54Z" fill="#dcecff" fill-opacity="0.8" />
  <path d="M104 48L94 42V54Z" fill="#dcecff" fill-opacity="0.8" />
`);

export const img_vertical_corridor = makeMaterialSvg(`
  <rect x="54" y="16" width="20" height="64" rx="10" fill="rgba(120,165,210,0.12)" stroke="url(#accentBlue)" stroke-width="2.5" />
  <path d="M64 24V72" stroke="#dcecff" stroke-opacity="0.8" stroke-width="2.5" stroke-dasharray="7 7" />
  <path d="M64 18L58 28H70Z" fill="#dcecff" fill-opacity="0.8" />
  <path d="M64 78L58 68H70Z" fill="#dcecff" fill-opacity="0.8" />
`);

export const img_proscenium = makeMaterialSvg(`
  <path d="M28 60Q64 24 100 60" fill="rgba(216,181,121,0.12)" stroke="url(#accentGold)" stroke-width="3" />
  <rect x="28" y="60" width="72" height="10" rx="5" fill="url(#accentGold)" fill-opacity="0.88" />
  <circle cx="40" cy="40" r="3" fill="#f7efe1" fill-opacity="0.85" />
  <circle cx="52" cy="34" r="3" fill="#f7efe1" fill-opacity="0.7" />
  <circle cx="64" cy="30" r="3" fill="#f7efe1" fill-opacity="0.85" />
  <circle cx="76" cy="34" r="3" fill="#f7efe1" fill-opacity="0.7" />
  <circle cx="88" cy="40" r="3" fill="#f7efe1" fill-opacity="0.85" />
`);

export const img_window = makeMaterialSvg(`
  <rect x="40" y="18" width="48" height="60" rx="12" fill="rgba(146,189,235,0.14)" stroke="url(#accentBlue)" stroke-width="2.5" />
  <path d="M64 22V74" stroke="#d7ebff" stroke-opacity="0.85" stroke-width="2" />
  <path d="M44 48H84" stroke="#d7ebff" stroke-opacity="0.85" stroke-width="2" />
  <circle cx="64" cy="48" r="2.5" fill="#d7ebff" />
`);

export const img_door = makeMaterialSvg(`
  <path d="M38 74V24C38 21.8 39.8 20 42 20H86C88.2 20 90 21.8 90 24V74" fill="rgba(216,181,121,0.12)" stroke="url(#accentGold)" stroke-width="2.5" />
  <path d="M64 24V74" stroke="#f4e2bf" stroke-opacity="0.85" stroke-width="2" />
  <circle cx="56" cy="48" r="2.5" fill="#f4e2bf" />
`);
