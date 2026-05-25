import React, { ReactNode } from "react";
// import { Graph } from '@antv/x6'
import { useGraphInstance } from "x6-graph/react";
import { ZoomInOutlined, ZoomOutOutlined, OneToOneOutlined, CompressOutlined, ExpandOutlined } from "@ant-design/icons";
import { Toolbar } from "@antv/x6-react-components";
import classnames from "classnames";
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
    icon: <ZoomInOutlined />,
  },
  {
    key: "zoomOut",
    label: "ZoomOut(-0.2)",
    title: "缩小",
    icon: <ZoomOutOutlined />,
  },
  {
    key: "zoomTo",
    label: "ZoomTo(1)",
    title: "缩小到1：1",
    icon: <OneToOneOutlined />,
  },
  {
    key: "zoomToFit",
    label: "ZoomToFit",
    title: "缩放到适应屏幕",
    icon: <CompressOutlined />,
  },
  {
    key: "centerContent",
    label: "CenterContent",
    title: "居中",
    icon: <ExpandOutlined />,
  },
];

const CanvasScaleToolbar: React.FC = () => {
  const graph = useGraphInstance();
  const transform = (command: string, graph: any) => {
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

  const clz = classnames({
    ["canvas-toolbar-group"]: true,
  });

  const clzi = classnames({
    ["canvas-toolbar-item"]: true,
  });

  const placement = "left";

  return (
    <div className="canvas-toolbar">
      <Toolbar.Group className={clz} key="toolBar">
        {commands.map((item) => (
          <Toolbar.Item
            {...item}
            icon={item.icon}
            key={item.key}
            tooltip={item.title}
            className={clzi}
            tooltipProps={{ placement: "left", ...item.tooltipProps }}
            onClick={() => transform(item.key, graph)}
          />
        ))}
      </Toolbar.Group>
    </div>
  );
};

export default CanvasScaleToolbar;
