import React from "react";

type IconName =
  | "arrowLeft"
  | "statusReady"
  | "clearCanvas"
  | "downloadSheet"
  | "uploadSheet"
  | "exportImage"
  | "saveTemplate"
  | "importTemplate"
  | "zoomIn"
  | "zoomOut"
  | "scaleReset"
  | "fitView"
  | "centerView"
  | "palette"
  | "collapsePanel"
  | "check"
  | "addTop"
  | "addBottom"
  | "addLeft"
  | "addRight"
  | "removeTop"
  | "removeBottom"
  | "removeLeft"
  | "removeRight"
  | "sparkle"
  | "chevronRight"
  | "matrixLayout"
  | "roundLayout"
  | "aisle"
  | "corridor"
  | "stage"
  | "window"
  | "door"
  | "drag";

interface AppIconProps {
  name: IconName;
  className?: string;
}

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const iconMap: Record<IconName, React.ReactNode> = {
  arrowLeft: (
    <path {...baseProps} d="M14.5 12H4.5m0 0 4-4m-4 4 4 4" />
  ),
  statusReady: (
    <>
      <circle {...baseProps} cx="12" cy="12" r="8.5" />
      <path {...baseProps} d="m8.6 12.2 2.3 2.4 4.7-5.1" />
    </>
  ),
  clearCanvas: (
    <>
      <path {...baseProps} d="M6.5 6.5h11v11h-11z" />
      <path {...baseProps} d="m8.8 8.8 6.4 6.4m0-6.4-6.4 6.4" />
      <path {...baseProps} d="M3.5 5.5h2m-2 4h2m-2 4h2" opacity="0.7" />
    </>
  ),
  downloadSheet: (
    <>
      <rect {...baseProps} x="5.5" y="4.5" width="13" height="15" rx="2.5" />
      <path {...baseProps} d="M9 8.5h6m-6 4h6m-6 4h4" />
      <path {...baseProps} d="m12 20.5 2.5 2.5 2.5-2.5m-2.5-5v7" />
    </>
  ),
  uploadSheet: (
    <>
      <rect {...baseProps} x="5.5" y="4.5" width="13" height="15" rx="2.5" />
      <path {...baseProps} d="M9 8.5h6m-6 4h6m-6 4h4" />
      <path {...baseProps} d="m12 18.5 2.5-2.5 2.5 2.5m-2.5-5v7" />
    </>
  ),
  exportImage: (
    <>
      <rect {...baseProps} x="4.5" y="5.5" width="15" height="13" rx="3" />
      <circle {...baseProps} cx="9" cy="10" r="1.4" />
      <path {...baseProps} d="m7.5 16 3.4-3.5 2.4 2.4 1.9-1.9 2.3 3" />
      <path {...baseProps} d="M15.5 4.5v5m0 0-2-2m2 2 2-2" />
    </>
  ),
  saveTemplate: (
    <>
      <path {...baseProps} d="M6.5 4.5h9l3 3v12h-13z" />
      <path {...baseProps} d="M9 4.5v5h6v-5" />
      <path {...baseProps} d="M9 16h6" />
      <path {...baseProps} d="m16.6 15.2 1.4 1.4 3-3" />
    </>
  ),
  importTemplate: (
    <>
      <path {...baseProps} d="M5.5 7.5a2.5 2.5 0 0 1 2.5-2.5h8a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path {...baseProps} d="m12 8 3 3-3 3m3-3H8" />
    </>
  ),
  zoomIn: (
    <>
      <circle {...baseProps} cx="10.5" cy="10.5" r="5.25" />
      <path {...baseProps} d="M18.5 18.5 14.6 14.6M10.5 8v5m-2.5-2.5h5" />
    </>
  ),
  zoomOut: (
    <>
      <circle {...baseProps} cx="10.5" cy="10.5" r="5.25" />
      <path {...baseProps} d="M18.5 18.5 14.6 14.6M8 10.5h5" />
    </>
  ),
  scaleReset: (
    <>
      <rect {...baseProps} x="5.5" y="5.5" width="13" height="13" rx="3" />
      <path {...baseProps} d="M9 9h6v6H9z" />
    </>
  ),
  fitView: (
    <>
      <path {...baseProps} d="M9 5.5H5.5V9m0 6v3.5H9m6-13h3.5V9m0 6v3.5H15" />
      <rect {...baseProps} x="8" y="8" width="8" height="8" rx="2" />
    </>
  ),
  centerView: (
    <>
      <circle {...baseProps} cx="12" cy="12" r="2.8" />
      <path {...baseProps} d="M12 4.5V7m0 10v2.5M4.5 12H7m10 0h2.5" />
      <path {...baseProps} d="m6.7 6.7 1.8 1.8m7 7 1.8 1.8m0-10.6-1.8 1.8m-7 7-1.8 1.8" />
    </>
  ),
  palette: (
    <>
      <path {...baseProps} d="M12 4.5c-4.7 0-8.5 3.2-8.5 7.8 0 3.8 2.9 6.7 6.6 6.7h1.4c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.3-.2-.3-.3-.5-.3-.8 0-1 .8-1.8 1.8-1.8h1.7c3 0 5.5-2.3 5.5-5.2 0-4.7-4.5-8.2-9.5-8.2Z" />
      <circle {...baseProps} cx="8" cy="10" r="1" />
      <circle {...baseProps} cx="11" cy="8" r="1" />
      <circle {...baseProps} cx="15" cy="9" r="1" />
      <circle {...baseProps} cx="16" cy="13" r="1" />
    </>
  ),
  collapsePanel: (
    <>
      <rect {...baseProps} x="4.5" y="4.5" width="15" height="15" rx="4" />
      <path {...baseProps} d="m9 12 3 3 3-3" />
    </>
  ),
  check: <path {...baseProps} d="m6 12.5 3.2 3.1L18 7.8" />,
  addTop: (
    <>
      <path {...baseProps} d="M6 5.5h12" />
      <path {...baseProps} d="M12 9v9m-4.5-4.5h9" />
    </>
  ),
  addBottom: (
    <>
      <path {...baseProps} d="M6 18.5h12" />
      <path {...baseProps} d="M12 6v9m-4.5-4.5h9" />
    </>
  ),
  addLeft: (
    <>
      <path {...baseProps} d="M5.5 6v12" />
      <path {...baseProps} d="M9 12h9m-4.5-4.5v9" />
    </>
  ),
  addRight: (
    <>
      <path {...baseProps} d="M18.5 6v12" />
      <path {...baseProps} d="M6 12h9m-4.5-4.5v9" />
    </>
  ),
  removeTop: (
    <>
      <path {...baseProps} d="M6 5.5h12" />
      <path {...baseProps} d="M7.5 13.5h9" />
    </>
  ),
  removeBottom: (
    <>
      <path {...baseProps} d="M6 18.5h12" />
      <path {...baseProps} d="M7.5 10.5h9" />
    </>
  ),
  removeLeft: (
    <>
      <path {...baseProps} d="M5.5 6v12" />
      <path {...baseProps} d="M10.5 7.5v9" />
    </>
  ),
  removeRight: (
    <>
      <path {...baseProps} d="M18.5 6v12" />
      <path {...baseProps} d="M13.5 7.5v9" />
    </>
  ),
  sparkle: (
    <>
      <path {...baseProps} d="m12 4.5 1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Zm5 10 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Zm-9 2 1.1 2.8 2.8 1.1-2.8 1.1L8 24.2l-1.1-2.8-2.8-1.1 2.8-1.1Z" />
    </>
  ),
  chevronRight: <path {...baseProps} d="m9 6 6 6-6 6" />,
  matrixLayout: (
    <>
      <rect {...baseProps} x="5" y="5" width="14" height="14" rx="3" />
      <path {...baseProps} d="M9.5 5v14M14.5 5v14M5 9.5h14M5 14.5h14" />
    </>
  ),
  roundLayout: (
    <>
      <circle {...baseProps} cx="12" cy="12" r="3.5" />
      <circle {...baseProps} cx="12" cy="5.5" r="1.2" />
      <circle {...baseProps} cx="17.2" cy="8.5" r="1.2" />
      <circle {...baseProps} cx="17.2" cy="15.5" r="1.2" />
      <circle {...baseProps} cx="12" cy="18.5" r="1.2" />
      <circle {...baseProps} cx="6.8" cy="15.5" r="1.2" />
      <circle {...baseProps} cx="6.8" cy="8.5" r="1.2" />
    </>
  ),
  aisle: (
    <>
      <rect {...baseProps} x="4.5" y="8" width="15" height="8" rx="4" />
      <path {...baseProps} d="M8 12h8" />
    </>
  ),
  corridor: (
    <>
      <rect {...baseProps} x="8" y="4.5" width="8" height="15" rx="4" />
      <path {...baseProps} d="M12 8v8" />
    </>
  ),
  stage: (
    <>
      <path {...baseProps} d="M4.5 16.5c2.3-4.2 5.6-6.3 7.5-6.3s5.2 2.1 7.5 6.3" />
      <path {...baseProps} d="M6.5 16.5V9.5m11 7V9.5" />
      <path {...baseProps} d="M8.5 8.5h7" />
    </>
  ),
  window: (
    <>
      <rect {...baseProps} x="5" y="5" width="14" height="14" rx="3" />
      <path {...baseProps} d="M12 5v14M5 12h14" />
    </>
  ),
  door: (
    <>
      <path {...baseProps} d="M7.5 19V6.5l8-1.5V19Z" />
      <circle {...baseProps} cx="12.3" cy="12" r="0.8" />
    </>
  ),
  drag: (
    <>
      <path {...baseProps} d="M12 4.5v15m-4.5-11.5L12 4.5 16.5 8m-9 8L12 19.5 16.5 16M4.5 12h15m-11.5-4.5L4.5 12 8 16.5m8-9L19.5 12 16 16.5" />
    </>
  ),
};

const AppIcon: React.FC<AppIconProps> = ({ name, className }) => {
  return (
    <span className={`app-icon${className ? ` ${className}` : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {iconMap[name]}
      </svg>
    </span>
  );
};

export default AppIcon;
