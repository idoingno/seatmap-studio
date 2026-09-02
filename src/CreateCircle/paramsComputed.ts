import { CHAIR_SIZE, PARENT_EXTRA_SPACE } from "../GlobalVar";
import { patternSeat } from "../assets";
import store from "../store";
import { chairSvg } from "../config/Markup/chair";

interface ParentDataType {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}
interface circleDataType {
  tableName?: string;
  tableNameEn?: string;
  chairNum?: number;
  tablezIndex?: number;
  tableNameIdx?: number;
  tableRealIdx?: number;
  chairIds?: number;
}

const matrixCircle = () => {
  const nums = 26;
  const rows = Math.floor(nums / 10);
  const columns = nums % 10;
};

// 圆桌数据计算
export const CirclePreComputed = (x: number, y: number, i: number) => {
  const chairCount = store.getState().runtime.circleChairCount;
  const currentRow = Math.floor(i / 10);

  let currentIndex = i;

  if (i > 9) {
    const num = String(i).split("")[1];
    currentIndex = Number(num);
  }

  let chairNum = chairCount > 10 ? chairCount : 10;
  //   let canvasOffsetY = getGraphTranslateVal().y / canvasScale;
  //   let canvasOffsetX = getGraphTranslateVal().x / canvasScale;
  let circleTableData = {
    width: (chairNum / 2) * CHAIR_SIZE,
    height: (chairNum / 2) * CHAIR_SIZE,
    // x: x + PARENT_EXTRA_SPACE / 2,
    x: x + PARENT_EXTRA_SPACE / 2 + currentIndex * ((chairNum / 2) * CHAIR_SIZE + PARENT_EXTRA_SPACE + 20),
    // y: y + PARENT_EXTRA_SPACE / 2,
    y: y + PARENT_EXTRA_SPACE / 2 + currentRow * ((chairNum / 2) * CHAIR_SIZE + PARENT_EXTRA_SPACE + 20),
  };

  let parentData = {
    width: circleTableData.width + PARENT_EXTRA_SPACE,
    height: circleTableData.height + PARENT_EXTRA_SPACE,
    x: x + currentIndex * (circleTableData.width + PARENT_EXTRA_SPACE + 20),
    // x,
    // y,
    y: y + currentRow * (circleTableData.width + PARENT_EXTRA_SPACE + 20),
  };
  return {
    circleTableData,
    parentData,
  };
};

export const parentParams = (parentData: ParentDataType, circleData: circleDataType) => {
  const chairCount = store.getState().runtime.circleChairCount;
  return {
    x: parentData.x,
    y: parentData.y,
    width: parentData.width,
    height: parentData.height,
    // zIndex: Number(circleData.tablezIndex) + 5,
    data: {
      disableMove: false,
      circleChairNum: chairCount,
      nodeType: "circleContainer",
      tableName: circleData.tableName,
      tableNameEn: circleData.tableNameEn,
      // tablezIndex: circleData.tablezIndex || "",
      tableNameIdx: circleData.tableNameIdx,
      // tableRealIdx: circleData.tableRealIdx,
    },
    attrs: {
      label: {
        refY: 120,
        fontSize: 12,
        fill: "rgba(51, 65, 63, 0.76)",
      },
      body: {
        fill: "rgba(25, 118, 111, 0.02)",
        stroke: "transparent",
        // fill: '#fffbe6',
        // stroke: '#ffe7ba',
      },
    },
    // tools: ['node-editor'],
  };
};

export const tableParams = (circleData: circleDataType, circleTableData: any) => {
  const circleTableSize = circleTableData.width;
  return {
    shape: "circle-table-ellipse-node",
    width: circleTableData.width,
    height: circleTableData.height,
    // zIndex: Number(circleData.tablezIndex) + 1,
    x: circleTableData.x,
    y: circleTableData.y,
    data: {
      nodeType: "circleTable",
      disableMove: true,
      tableName: circleData.tableName,
      tableNameEn: circleData.tableNameEn,
      // tablezIndex: circleData.tablezIndex || "",
      tableNameIdx: circleData.tableNameIdx,
      // tableRealIdx: circleData.tableRealIdx,
    },
    markup: [
      {
        tagName: "circle",
        attrs: {
          cx: circleTableSize / 2,
          cy: circleTableSize / 2,
          r: circleTableSize / 2,
          text: circleData.tableName,
          fill: "rgba(25, 118, 111, 0.05)",
          stroke: "rgba(25, 118, 111, 0.26)",
          strokeWidth: 2,
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
        text: circleData.tableName,
        fontSize: 18,
        fill: "#33413f",
        fontWeight: 700,
        fontFamily: '"Helvetica Neue", "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      },
      text2: {
        // text:
        //   "Table " +
        //   (circleData.tableNameIdx != undefined ? circleData.tableNameIdx : circleData.tableName.replace("号桌", "")), //'Table ' + circleData.tableName.replace('号桌', ''),

        text: circleData.tableNameEn,
        fontSize: 14,
        fill: "rgba(86, 103, 99, 0.66)",
        fontFamily: '"Helvetica Neue", "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      },
    },
  };
};

export const circleChairParams = (
  circleData: circleDataType,
  circleTableData: any,
  table: any,
  angle: number,
  i: number,
  parentId?: string
) => {
  const circleTableSize = circleTableData.width;
  const chairRadius = circleTableSize / 2 + CHAIR_SIZE / 2 + 5; // 椅子距离圆桌的半径

  return {
    shape: "circle-chair-node",
    parent: parentId,
    x: table.getBBox().x + circleTableSize / 2 - CHAIR_SIZE / 2 + Math.cos(angle) * chairRadius,
    y: table.getBBox().y + circleTableSize / 2 - CHAIR_SIZE / 2 + Math.sin(angle) * chairRadius,
    data: {
      disableMove: true,
      tableName: circleData.tableName,
      tableNameEn: circleData.tableNameEn,
      nodeType: "circleChair",
      visible: true,
      idx: i,
    },
    // zIndex: Number(circleData.tablezIndex) + 10,
  };
};
