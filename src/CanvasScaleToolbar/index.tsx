import React, { ReactNode, useEffect, useState } from "react";
import AppIcon from "../Components/AppIcon";
import "./index.less";

interface CommandsType {
  key: string;
  label: string;
  title: string;
  icon: ReactNode;
  tooltipProps?: any;
}

const commands: CommandsType[] = [
  {
    key: "zoomIn",
    label: "ZoomIn(0.2)",
    title: "放大",
    icon: <AppIcon name="zoomIn" />,
  },
  {
    key: "zoomOut",
    label: "ZoomOut(-0.2)",
    title: "缩小",
    icon: <AppIcon name="zoomOut" />,
  },
  {
    key: "zoomTo",
    label: "ZoomTo(1)",
    title: "缩小到1：1",
    icon: <AppIcon name="scaleReset" />,
  },
  {
    key: "zoomToFit",
    label: "ZoomToFit",
    title: "缩放到适应屏幕",
    icon: <AppIcon name="fitView" />,
  },
  {
    key: "centerContent",
    label: "CenterContent",
    title: "居中",
    icon: <AppIcon name="centerView" />,
  },
];

interface CanvasScaleToolbarProps {
  graph?: any;
}

const CanvasScaleToolbar: React.FC<CanvasScaleToolbarProps> = ({ graph }) => {
  const [zoom, setZoom] = useState(100);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (!graph) {
      return;
    }

    const syncStatus = () => {
      const nextZoom = typeof graph.zoom === "function" ? Math.round(graph.zoom() * 100) : 100;
      const nextSelection =
        typeof graph.getSelectedCells === "function" ? graph.getSelectedCells().length : 0;

      setZoom(nextZoom);
      setSelectedCount(nextSelection);
    };

    syncStatus();
    graph.on?.("scale", syncStatus);
    graph.on?.("selection:changed", syncStatus);
    graph.on?.("cell:removed", syncStatus);

    return () => {
      graph.off?.("scale", syncStatus);
      graph.off?.("selection:changed", syncStatus);
      graph.off?.("cell:removed", syncStatus);
    };
  }, [graph]);

  const transform = (command: string, graph: any) => {
    if (!graph) {
      return;
    }

    switch (command) {
      case "translate":
        graph.translate(20, 20);
        break;
      case "zoomIn":
        graph.zoom(0.2);
        break;
      case "zoomOut":
        graph.zoom(-0.2);
        break;
      case "zoomTo":
        graph.zoomTo(1);
        break;
      case "zoomToFit":
        graph.zoomToFit();
        break;
      case "centerContent":
        graph.centerContent();
        break;
      default:
        break;
    }

  };

  return (
    <div className="canvas-toolbar">
      <div className="canvas-toolbar-status" aria-live="polite">
        <span className="canvas-status-primary">{zoom}%</span>
        <span className="canvas-status-divider" aria-hidden="true" />
        <span>网格 36 px</span>
        <span className="canvas-status-divider" aria-hidden="true" />
        <span className={selectedCount > 0 ? "has-selection" : ""}>
          {selectedCount > 0 ? `已选择 ${selectedCount} 个座位` : "未选择座位"}
        </span>
      </div>
      <div className="canvas-toolbar-group">
        {commands.map((item) => (
          <button
            type="button"
            key={item.key}
            className="canvas-toolbar-item"
            title={item.title}
            aria-label={item.title}
            onClick={() => transform(item.key, graph)}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CanvasScaleToolbar;
