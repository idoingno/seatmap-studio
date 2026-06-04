import { CHAIR_SIZE, SPACE_SIZE, PARENTLEFTANDRIGHTSPACE, PARENTTOPANDBOTTOMHEIGHT, AISLE_SIZE } from "../GlobalVar";
// import { rows, columns, parentWidth, parentHeight } from ".";
import { chairSvg } from "../config/Markup/chair";
import { patternSeat } from "../assets";
import { MatrixAllRowsOrColumns } from "../config";

export interface parentProps {
  width: number;
  height: number;
  x: number;
  y: number;
  rowSpaceArr: any[];
  columnSpaceArr: any[];
}

// 矩阵坐标计算
export const matrixPreComputed = (x: number, y: number, parentWidth: number, parentHeight: number) => {
  let rowSpaceArr: any[] = [];
  let columnSpaceArr: any[] = [];
  let rowSpaceArrLength = rowSpaceArr.length;
  const rows = MatrixAllRowsOrColumns.getAllRows;
  const columns = MatrixAllRowsOrColumns.getAllColumns;

  for (let i = rowSpaceArrLength; i < rows - 1; i++) {
    rowSpaceArr.push({
      y1: i * (CHAIR_SIZE + SPACE_SIZE) + PARENTTOPANDBOTTOMHEIGHT,
      y2: i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
      inity1: i * (CHAIR_SIZE + SPACE_SIZE) + PARENTTOPANDBOTTOMHEIGHT,
      inity2: i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
      // hit: false,
      idx: i,
    });
  }

  let columnSpaceArrLength = columnSpaceArr.length;

  for (let i = columnSpaceArrLength; i < columns - 1; i++) {
    columnSpaceArr.push({
      y1: i * (CHAIR_SIZE + SPACE_SIZE) + PARENTTOPANDBOTTOMHEIGHT,
      y2: i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
      inity1: i * (CHAIR_SIZE + SPACE_SIZE) + PARENTTOPANDBOTTOMHEIGHT,
      inity2: i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
      // hit: false,
      idx: i,
    });
  }

  return {
    width: parentWidth,
    height: parentHeight,
    x,
    y,
    rowSpaceArr,
    columnSpaceArr,
    rows,
    columns,
  };
};

// 组节点参数
export const parentParams = (parentData: any) => {
  let { x, y, width, height, rowSpaceArr, columnSpaceArr, rows, columns } = parentData;
  return {
    x: x,
    y: y,
    width: width,
    height: height,
    zIndex: 1,
    data: {
      nodeType: "matrixContainer",
      disableMove: false,
      snapline: true,
      rows,
      columns,
      // spaceArr: spaceArr,
      // rowSpaceArr: rowSpaceArr,
      // columnSpaceArr: columnSpaceArr,
    },
    attrs: {
      label: {
        // refY: 120,
        fontSize: 12,
        fill: "rgba(122, 84, 106, 0.74)",
      },
      body: {
        fill: "rgba(251, 114, 153, 0.045)",
        stroke: "rgba(251, 114, 153, 0.24)",
        strokeWidth: 1.4,
        rx: 24,
        ry: 24,
      },
    },
    // tools: [
    //   {
    //     name: 'my-btn',
    //     args: {
    //       x: '100%',
    //       y: '100%',
    //       offset: { x: 0, y: -height },
    //     },
    //   },
    // ],
  };
};

export const aisleColumnNodeParams = (
  parentData: parentProps,
  moreCorridorNum: number,
  corridorCount: number,
  i: number
) => {
  let { x, y, height } = parentData;
  // let { count, height: AISLE_SIZE } = aisleData
  // let { width: corridorW } = corridorData
  // let { width, SPACE_SIZE } = chairData
  return {
    // id: `corridorColumn-${i}`,
    shape: "rect",
    width: AISLE_SIZE,
    height: height + corridorCount * AISLE_SIZE,
    x:
      x + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE / 2 + PARENTLEFTANDRIGHTSPACE + moreCorridorNum * AISLE_SIZE,
    y: y,
    label: ``, //过道Aisle
    data: {
      disableMove: true,
      nodeType: "corridorColumn",
      idx: i,
      isExist: false,
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "transparent", //rgba(255,255,255,.6)
      },
      text: {
        width: "12px",
        "writing-mode": "vertical-lr",
        "letter-spacing": "2px",
      },
    },
  };
};

export const aisleColumnSpaceNodeParams = (parentData: parentProps, i: number) => {
  let { x, y, height } = parentData;
  return {
    // id: `corridorColumnSpace-${i}`,
    shape: "rect",
    width: SPACE_SIZE - 4,
    // height: height + corridorCount * AISLE_SIZE,
    height: height,
    // x: x + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + PARENTLEFTANDRIGHTSPACE + moreCorridorNum * AISLE_SIZE + 2,
    x: x + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + PARENTLEFTANDRIGHTSPACE + 2,
    y: y,
    label: ``,
    data: {
      disableMove: true,
      nodeType: "corridorColumnSpace",
      idx: i,
      isExist: false,
      idt: `corridorColumnSpace-${i}`,
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "transparent",
        // nodeType: 'corridorColumnSpace'
      },

      text: {},
    },
  };
};

export const aisleRowNodeParams = (parentData: parentProps, moreAisleNum: number, corridorCount: number, i: number) => {
  let { x, y, width } = parentData;

  return {
    // id: `aisleRow-${i}`,
    shape: "rect",
    width: width + corridorCount * AISLE_SIZE,
    height: SPACE_SIZE,
    x: x,
    y: y + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE / 2 + moreAisleNum * AISLE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    label: `过道 Aisle`,
    // imageUrl: require('./chair.png'),
    data: {
      disableMove: true,
      nodeType: "aisleRow",
      idx: i,
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "transparent", //rgba(255,255,255,.6)
      },
      // text: {
      //     "font-size": '12',
      //     "z-index": 100,
      // },
    },
  };
};

export const aisleRowSpaceNodeParams = (parentData: parentProps, i: number) => {
  let { x, y, width } = parentData;

  return {
    // id: `aisleRowSpace-${i}`,
    shape: "rect",
    // width: width + corridorCount * AISLE_SIZE,
    width: width,
    height: SPACE_SIZE - 4,
    x: x,
    // y: y + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + moreAisleNum * AISLE_SIZE + PARENTTOPANDBOTTOMHEIGHT + 2,
    y: y + (i + 1) * (CHAIR_SIZE + SPACE_SIZE) + PARENTTOPANDBOTTOMHEIGHT + 2,
    label: ``,
    data: {
      disableMove: true,
      nodeType: "aisleRowSpace",
      idx: i,
      idt: `aisleRowSpace-${i}`,
    },
    attrs: {
      body: {
        stroke: "transparent",
        fill: "transparent", //rgba(255,255,255,.6)
      },
    },
  };
};

export const matrixColumnTopNumNodeParams = (parentData: parentProps, moreCorridorCount: number, i: number) => {
  let { x, y } = parentData;
  // let { width, SPACE_SIZE, SPACE_SIZE } = chairData
  return {
    // id: `matrixColumnTopNum-${i}`,
    shape: "rect",
    width: CHAIR_SIZE,
    height: PARENTTOPANDBOTTOMHEIGHT,
    // x: x + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + AISLE_SIZE + moreCorridorCount * AISLE_SIZE,
    x: x + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + AISLE_SIZE,
    y: y + SPACE_SIZE,
    label: `${i + 1}`,
    data: {
      disableMove: true,
      nodeType: "matrixColumnTopNum",
      idx: i,
      idt: `matrixColumnTopNum-${i}`,
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  };
};

export const matrixColumnBottomNumNodeParams = (parentData: parentProps, i: number) => {
  let { x, y, height } = parentData;
  // let { count:cCount,height:corridorH } = corridorData
  // let { count: aCount, height: AISLE_SIZE } = aisleData
  // let { width, SPACE_SIZE, SPACE_SIZE } = chairData
  return {
    // id: `matrixColumnBottomNum-${i}`,
    shape: "rect",
    width: CHAIR_SIZE,
    height: PARENTTOPANDBOTTOMHEIGHT,
    x: x + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE,
    // y: y + height + aisleCount * AISLE_SIZE - PARENTTOPANDBOTTOMHEIGHT - SPACE_SIZE,
    y: y + height + -PARENTTOPANDBOTTOMHEIGHT - SPACE_SIZE,
    label: `${i + 1}`,
    data: {
      disableMove: true,
      nodeType: "matrixColumnBottomNum",
      idx: i,
      idt: `matrixColumnBottomNum-${i}`,
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  };
};

export const rowTextNodeParams = (parentData: parentProps, moreAisleNum: number, i: number) => {
  let { x, y } = parentData;
  // let { height: AISLE_SIZE } = aisleData
  // let { width, height, SPACE_SIZE, SPACE_SIZE } = chairData
  return {
    // id: `row-${i}`,
    shape: "rect",
    width: CHAIR_SIZE + 20,
    height: CHAIR_SIZE,
    x: x + SPACE_SIZE / 2,
    // y: y + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + moreAisleNum * AISLE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    y: y + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    label: `第${i + 1}排`,
    // imageUrl: require('./chair.png'),
    data: {
      disableMove: true,
      nodeType: "matrixRows",
      idx: i,
      idt: `row-${i}`,
    },
    attrs: {
      body: {
        // fill: '#f00f00',
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  };
};

export const rowTextEnNodeParams = (parentData: parentProps, i: number) => {
  const rows = MatrixAllRowsOrColumns.getAllRows;
  const columns = MatrixAllRowsOrColumns.getAllColumns;
  
  let { x, y } = parentData;
  // let { count: cCount, width: corridorW } = corridorData
  // let { count: aCount, height: AISLE_SIZE } = aisleData
  // let { width, height, SPACE_SIZE, SPACE_SIZE } = chairData
  return {
    // id: `rowEn-${i}`,
    shape: "rect",
    width: CHAIR_SIZE + 20,
    height: CHAIR_SIZE,
    // x: x + PARENTLEFTANDRIGHTSPACE + (CHAIR_SIZE + SPACE_SIZE) * columns + corridorCount * AISLE_SIZE,
    x: x + PARENTLEFTANDRIGHTSPACE + (CHAIR_SIZE + SPACE_SIZE) * columns,
    // y: y + (CHAIR_SIZE + SPACE_SIZE) * i + SPACE_SIZE + moreAisleNum * AISLE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    y: y + (CHAIR_SIZE + SPACE_SIZE) * i + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    label: `Row ${i + 1}`,
    // imageUrl: require('./chair.png'),
    data: {
      disableMove: true,
      nodeType: "matrixRowsEn",
      idx: i,
      idt: `rowEn-${i}`,
    },
    attrs: {
      body: {
        fill: "transparent",
        stroke: "transparent",
      },
    },
    tools: ["node-editor"],
  };
};

export const chairNodeParams = (parentData: parentProps, i: number, j: number) => {
  let { x, y } = parentData;
  //   let { width: corridorW } = corridorData;
  //   let { height: AISLE_SIZE } = aisleData;
  //   let { width, height, SPACE_SIZE, SPACE_SIZE } = chairData;
  return {
    // id: `${i}-${j}`,
    shape: "rect",
    width: CHAIR_SIZE,
    height: CHAIR_SIZE,
    // x: x + j * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE + moreCorridorNum * AISLE_SIZE,
    x: x + j * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTLEFTANDRIGHTSPACE,
    // y: y + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + moreAisleNum * AISLE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    y: y + i * (CHAIR_SIZE + SPACE_SIZE) + SPACE_SIZE + PARENTTOPANDBOTTOMHEIGHT,
    data: {
      disableMove: true,
      nodeType: "matrixChair",
      visible: true,
      idt: `${i}-${j}`,
      matrixChairName: `第${i + 1}排`,
      matrixChairNameEn: `Row${i + 1}`,
      matrixChairTopName: `${j + 1}`,
      matrixChairBottomName: `${j + 1}`,
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
  };
};
