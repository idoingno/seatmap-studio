// import { SyncOutlined } from "@ant-design/icons";

import "./node.less";
import { chairSvg } from "../../config/Markup/chair";
import { Graph } from "@antv/x6";
import { CHAIR_SIZE, PARENTTOPANDBOTTOMHEIGHT, SPACE_SIZE } from "../../GlobalVar";
import { patternSeat } from "../../assets";
// import type { CellView } from "@antv/x6";

// const SyncNode = memo(() => {
//   return (
//     <div className="icon-node">
//       <SyncOutlined style={{ color: "rgba(0,0,0,.25)" }} />
//     </div>
//   );
// });

// const render = createRender(SyncNode);

// register({
//   shape: "sync-react-node",
//   // width: 40,
//   // height: 40,
//   render,
// });

Graph.registerNode(
  "chair-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: 40,
    height: 40,
    data: {
      disableMove: true,
      nodeType: "matrixChair",
      visible: true,
      idt: "",
      matrixChairName: "",
      matrixChairNameEn: "",
      matrixChairTopName: "",
      matrixChairBottomName: "",
    },
    markup: [
      {
        tagName: "rect",
        attrs: {
          width: "40px",
          height: "40px",
        },
      },
      chairSvg,
      {
        tagName: "image",
      },
      {
        tagName: "text",
      },
    ],
    attrs: {
      body: {
        stroke: "transparent",
      },
      rect: {
        fill: "transparent",
        stroke: "transparent",
      },
      svg: {
        width: 34,
        height: 34,
        x: 3,
        y: 3,
        fill: "#FFFFFF",
      },
      image: {
        width: 40,
        y: 3,
        style: {
          display: "none",
        },
        "xlink:href": patternSeat,
      },
      text: {
        "font-size": "12",
      },
    },
  },
  true
);

Graph.registerNode(
  "row-text-cn",
  {
    inherit: "rect", // 继承于 rect 节点
    width: CHAIR_SIZE + 20,
    height: CHAIR_SIZE,
    data: {
      disableMove: true,
      nodeType: "matrixRows",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "row-text-en",
  {
    inherit: "rect", // 继承于 rect 节点
    width: CHAIR_SIZE + 20,
    height: CHAIR_SIZE,
    data: {
      disableMove: true,
      nodeType: "matrixRowsEn",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "row-space-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: 100,
    height: SPACE_SIZE - 4,
    label: ``,
    data: {
      disableMove: true,
      nodeType: "aisleRowSpace",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "rgba(255,255,255,.2)", //rgba(255,255,255,.6)
      },
    },
  },
  true
);

Graph.registerNode(
  "column-space-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: SPACE_SIZE - 4,
    height: 100,
    label: ``,
    data: {
      disableMove: true,
      nodeType: "corridorColumnSpace",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "rgba(255,255,255,.2)", //rgba(255,255,255,.6)
      },
    },
  },
  true
);

Graph.registerNode(
  "top-number-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: CHAIR_SIZE,
    height: PARENTTOPANDBOTTOMHEIGHT,
    data: {
      disableMove: true,
      nodeType: "matrixColumnTopNum",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "bottom-number-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: CHAIR_SIZE,
    height: PARENTTOPANDBOTTOMHEIGHT,
    data: {
      disableMove: true,
      nodeType: "matrixColumnBottomNum",
      idx: 0,
      idt: "",
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "proscenium-rect-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: 300,
    height: 48,
    data: {
      disableMove: false,
      nodeType: "prosceniumNode",
      snapline: true,
    },
    label: "舞台 Stage",
    // path: "M0 0h3242.666667v716.8c-540.4416 204.8-1080.891733 307.2-1621.333334 307.2S540.4416 921.6 0 716.8V0z",
    attrs: {
      body: {
        stroke: "rgba(0,0,0,0.25)",
        fill: "#fff",
      },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "window-rect-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: 48,
    height: 200,
    data: {
      disableMove: false,
      nodeType: "windowNode",
      snapline: true,
    },
    label: "窗户",
    attrs: {
      body: {
        stroke: "rgba(0,0,0,0.25)",
        fill: "#fff",
      },
      // text: {
      //   writingMode: "vertical-rl",
      //   "font-weight": 500,
      //   color: "rgba(0, 0, 0, 0.85)",
      // },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "door-rect-node",
  {
    inherit: "rect", // 继承于 rect 节点
    width: 120,
    height: 48,
    data: {
      disableMove: false,
      nodeType: "doorNode",
      snapline: true,
    },
    label: "门 Door",
    attrs: {
      body: {
        stroke: "rgba(0,0,0,0.25)",
        fill: "#fff",
      },
      // text: {
      //   writingMode: "vertical-rl",
      //   "font-weight": 500,
      //   color: "rgba(0, 0, 0, 0.85)",
      // },
    },
    tools: ["node-editor"],
  },
  true
);

Graph.registerNode(
  "circle-table-ellipse-node",
  {
    inherit: "ellipse", // 继承于 rect 节点
    width: 100,
    height: 100,
    data: {
      nodeType: "circleTable",
      disableMove: true,
    },
    markup: [
      {
        tagName: "circle",
        attrs: {
          cx: 0,
          cy: 0,
          r: 0,
          text: "1号桌",
          fill: "transparent",
          // stroke: 'transparent',
          // fill: '#f2d4ad',
          stroke: "#333",
          fontSize: 18,
        },
      },
      {
        tagName: "text",
        selector: "text1",
        attrs: {
          fontSize: 18,
          width: 100,
          height: 20,
          letterSpacing: 3,
        },
      },
      {
        tagName: "text",
        selector: "text2",
        attrs: {
          y: 20,
        },
      },
    ],
    attrs: {
      circle: {},
      text1: {
        text: "1号桌",
        fontSize: 18,
      },
      text2: {
        text: "Table 1",

        fontSize: 14,
      },
    },
  },
  true
);

Graph.registerNode(
  "circle-chair-node",
  {
    inherit: "ellipse", // 继承于 rect 节点
    // id: chairIds ? chairIds[i] : circleData.tableRealIdx + "-" + i,
    width: CHAIR_SIZE,
    height: CHAIR_SIZE,
    // x: table.getBBox().x + circleTableSize / 2 - CHAIR_SIZE / 2 + Math.cos(angle) * chairRadius,
    // y: table.getBBox().y + circleTableSize / 2 - CHAIR_SIZE / 2 + Math.sin(angle) * chairRadius,
    // zIndex: Number(circleData.tablezIndex) + 10,
    data: {
      disableMove: true,
      nodeType: "circleChair",
      visible: true,
      tableName: "",
      // tableNameIdx: circleData.tableNameIdx,
      // tableRealIdx: circleData.tableRealIdx,
      // idt: "1111",
    },
    markup: [
      {
        tagName: "rect",
        attrs: {
          width: "40px",
          height: "40px",
        },
      },
      chairSvg,
      {
        tagName: "image",
      },
      {
        tagName: "text",
      },
    ],
    attrs: {
      body: {
        stroke: "transparent",
      },
      rect: {
        fill: "transparent",
        stroke: "transparent",
      },
      svg: {
        width: 34,
        height: 34,
        x: 3,
        y: 3,
        fill: "#FFFFFF",
      },

      image: {
        width: 40,
        y: 3,
        style: {
          display: "none",
        },
        "xlink:href": patternSeat,
      },
      text: {
        "font-size": "12",
      },
    },
  },
  true
);
