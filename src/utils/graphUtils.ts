import { normalSitOut, partnerSitOut, patternSeat } from "../assets";
import { ColorArr } from "../config";
import store from "../store";
// import { chairSvg } from "../config/Markup/chair";
import { syncSvg } from "../config/Markup/syncIcon";
import { findColor, listToTreeSimple, sliceText } from "./util";
import { parseChairIdt } from "./validation";
import { colors } from "../styles/tokens";

const martixParentAttrs = {
  label: {
    refY: 120,
    fontSize: 12,
    fill: "rgba(51, 65, 63, 0.76)",
  },
  body: {
    fill: "rgba(25, 118, 111, 0.035)",
    stroke: "rgba(25, 118, 111, 0.22)",
    strokeWidth: 1.4,
    rx: 24,
    ry: 24,
  },
};

const TEXT_FONT_FAMILY = '"Helvetica Neue", "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

const STAGE_BODY_ATTRS = {
  stroke: "rgba(25, 118, 111, 0.34)",
  strokeWidth: 1.8,
  fill: "rgba(25, 118, 111, 0.1)",
  rx: 20,
  ry: 20,
};

const WINDOW_BODY_ATTRS = {
  stroke: "rgba(129, 181, 255, 0.42)",
  strokeWidth: 1.6,
  fill: "rgba(129, 181, 255, 0.12)",
  rx: 18,
  ry: 18,
};

const DOOR_BODY_ATTRS = {
  stroke: "rgba(25, 118, 111, 0.26)",
  strokeWidth: 1.6,
  fill: "rgba(25, 118, 111, 0.08)",
  rx: 18,
  ry: 18,
};

const chairNoMarkup = [
  {
    tagName: "rect",
    attrs: {
      width: "40px",
      height: "40px",
    },
  },
  syncSvg,
];

const circleTableMarkup = (item: any, name: string) => {
  return [
    {
      tagName: "circle",
      attrs: {
        cx: item.w / 2,
        cy: item.h / 2,
        r: item.w / 2,
        text: name,
        fill: "transparent",
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
  ];
};

interface ShapeType {
  matrixContainer: string;
  matrixRows: string;
  matrixRowsEn: string;
  matrixChair: string;
  aisleRowSpace: string;
  matrixColumnTopNum: string;
  matrixColumnBottomNum: string;
  corridorColumnSpace: string;
}

interface ItemType {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  attrs: any;
  shape: string;
  id: string;
  data: string;
  name: string;
}

export const shapeObj: any = {
  matrixContainer: "rect",
  matrixRows: "row-text-cn",
  matrixRowsEn: "row-text-en",
  matrixChair: "chair-node",
  matrixColumnTopNum: "top-number-node",
  matrixColumnBottomNum: "bottom-number-node",
  aisleRowSpace: "row-space-node",
  corridorColumnSpace: "column-space-node",
  prosceniumNode: "proscenium-rect-node",
  windowNode: "window-rect-node",
  doorNode: "door-rect-node",
  circleContainer: "rect",
  circleChair: "circle-chair-node",
  circleTable: "circle-table-ellipse-node",
};

const convertData = (nodes: ItemType[]) => {
  // 先转成tree
  const treeSimple = listToTreeSimple(nodes) || [];

  let arr: any[] = [];
  treeSimple.forEach((item) => {
    if (item.type !== "prosceniumNode" && item.type !== "windowNode" && item.type !== "doorNode") {
      arr.push({
        ...item,
        children: item.children && item.children.map((item: any) => item.id),
      });
      arr.push(...item.children);
    } else {
      arr.push(item);
    }
  });

  return arr;
};

// 渲染节点
export const renderGraph = (nodes: ItemType[]) => {
  const data = convertData(nodes);
  const personArr = store.getState().runtime.allPersonArr;
  const personByNodeId = new Map<string, any>(personArr.map((person: any) => [person.nodeId, person]));

  return data.map((item) => {
    const isMovableContainer = item.type === "matrixContainer" || item.type === "circleContainer";
    let obj: any = {
      position: {
        x: item.x,
        y: item.y,
      },
      size: {
        width: item.w,
        height: item.h,
      },
      //   attrs: getAttrs(item.type, item.name),
      shape: shapeObj[item.type],
      id: item.id,
      data: isMovableContainer ? { ...item.data, disableMove: false } : item.data,
      name: item.name,
      parent: item.pid || null,
      //   children: !item.pid && getChildrenIds(nodes, item.pid),
    };

    // 添加矩阵容器的子节点
    if (item.type === "matrixContainer" || item.type === "circleContainer") {
      obj.children = item.children;
    }

    if (item.type === "matrixContainer" || item.type === "circleContainer") {
      obj.attrs = martixParentAttrs;
    } else if (item.type === "circleTable") {
      obj.markup = circleTableMarkup(item, item.data.tableName);
      obj.attrs = getCircleTableAttrs(item);
    } else if (
      item.type === "matrixColumnBottomNum" ||
      item.type === "matrixColumnTopNum" ||
      item.type === "matrixRows" ||
      item.type === "matrixRowsEn" ||
      item.type === "prosceniumNode" ||
      item.type === "windowNode" ||
      item.type === "doorNode"
    ) {
      obj.attrs = getTextAttrs(item);
    } else if (item.type === "aisleRowSpace") {
      obj.attrs = getRowSpaceAttrs(item.data.isExist);
    } else if (item.type === "corridorColumnSpace") {
      obj.attrs = getColumnSpaceAttrs();
    } else if (item.type === "matrixChair" || item.type === "circleChair") {
      obj.attrs = getChairAttrs(item.data.visible, personByNodeId, item);
      if (!item.data.visible) {
        obj.markup = chairNoMarkup;
      }
    }
    return obj;
  });
};

const getTextAttrs = (item: any) => {
  const baseText = {
    text: item.name,
    fontFamily: TEXT_FONT_FAMILY,
    textAnchor: "middle",
    textVerticalAnchor: "middle",
  };

  if (item.type === "matrixRows") {
    return {
      text: {
        ...baseText,
        fill: "#7a4d68",
        fontSize: 13,
        fontWeight: 700,
      },
    };
  }

  if (item.type === "matrixRowsEn") {
    return {
      text: {
        ...baseText,
        fill: "rgba(123, 95, 120, 0.52)",
        fontSize: 10.5,
        fontStyle: "italic",
      },
    };
  }

  if (item.type === "matrixColumnTopNum" || item.type === "matrixColumnBottomNum") {
    return {
      text: {
        ...baseText,
        fill: "rgba(121, 86, 113, 0.78)",
        fontSize: 12,
        fontWeight: 700,
      },
    };
  }

  if (item.type === "prosceniumNode") {
    return {
      body: STAGE_BODY_ATTRS,
      text: {
        ...baseText,
        fill: "#86672e",
        fontSize: 14,
        fontWeight: 700,
      },
    };
  }

  if (item.type === "windowNode") {
    return {
      body: WINDOW_BODY_ATTRS,
      text: {
        ...baseText,
        fill: "#5d8fc9",
        fontSize: 13,
        fontWeight: 700,
      },
    };
  }

  if (item.type === "doorNode") {
    return {
      body: DOOR_BODY_ATTRS,
      text: {
        ...baseText,
        fill: "#19766f",
        fontSize: 13,
        fontWeight: 700,
      },
    };
  }

  return {
    text: baseText,
  };
};

const getRowSpaceAttrs = (flag: boolean) => {
  if (flag) {
    return {
      body: {
        stroke: "transparent",
        fill: "rgba(129, 181, 255, 0.14)",
      },
      label: {
        text: "过道 Aisle",
        fill: "rgba(94, 132, 183, 0.7)",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: TEXT_FONT_FAMILY,
      },
    };
  } else {
    return {
      body: {
        stroke: "transparent",
        fill: "rgba(129, 181, 255, 0.09)",
      },
    };
  }
};

const getColumnSpaceAttrs = () => {
  return {
    body: {
      fill: "rgba(129, 181, 255, 0.09)",
    },
  };
};

const getChairAttrs = (flag: boolean, personByNodeId: Map<string, any>, item: any) => {
  // 不展示
  if (!flag) {
    return {
      svg: {
        fill: "rgba(0, 0, 0, 0.25)",
      },
    };
  } else if (flag) {
    const person = personByNodeId.get(item.id);

    const parsedIdt = parseChairIdt(String(item.data?.idt ?? ""));
    // 查询人员座位关联
    if (!person) {
      return {
        // svg: {
        // fill: "rgba(0, 0, 0, 0.25)",
        // },
        rect: {
          fill: item.color ? findColor(item.color) : "rgba(25, 118, 111, 0.035)",
          stroke: "rgba(25, 118, 111, 0.08)",
          strokeWidth: 1,
          rx: 12,
          ry: 12,
        },
      };
    } else {
      return {
        text: {
          fill: "#FFFFFF",
          "font-size": "11.5",
          fontWeight: 700,
          fontFamily: TEXT_FONT_FAMILY,
          text: sliceText(person.name),
        },
        rect: {
          fill: item.color ? findColor(item.color) : "transparent",
          stroke: "rgba(25, 118, 111, 0.08)",
          strokeWidth: 1,
          rx: 12,
          ry: 12,
        },
        body: {
          stroke: "transparent",
        },
        svg: {
          width: 34,
          height: 34,
          x: 3,
          y: 3,
          fill: colors.accent,
          // style: "display:block",
          style: person.orgType === "org" && person.isAttend ? "display:block" : "display:none",
        },
        image: {
          width: 40,
          height: 40,
          y: 3,
          // style: "display:none",
          style: person.orgType === "org" && person.isAttend ? "display:none" : "display:block",
          "xlink:href": getImg(person.orgType, person.isAttend),
        },
        xnode: {
          key: person.id,
          title: person.title,
          subTitle: person.subTitle,
          otherName: person.otherName || "",
          orgType: person.orgType,
          row: parsedIdt ? parsedIdt.row + 1 : "",
          column: parsedIdt ? parsedIdt.column + 1 : "",
          s_seat: person.s_seat,
          s_seat_english: person.s_seat_english,
        },
      };
    }
  }
};

const getCircleTableAttrs = (item: any) => {
  return {
    circle: {},
    text1: {
      text: item.data.tableName,
      fontSize: 18,
      fill: "#33413f",
      fontWeight: 700,
      fontFamily: TEXT_FONT_FAMILY,
    },
    text2: {
      text: item.data.tableNameEn,
      fontSize: 14,
      fill: "rgba(86, 103, 99, 0.66)",
      fontFamily: TEXT_FONT_FAMILY,
    },
  };
};

const getImg = (orgType: string, isAttend: boolean) => {
  if (orgType === "org" && !isAttend) {
    return normalSitOut;
  } else if (orgType === "pattern" && isAttend) {
    return patternSeat;
  } else if (orgType === "pattern" && !isAttend) {
    return partnerSitOut;
  }
};

const getStyleShow = (orgType: string, isAttend: boolean) => {
  if (orgType === "org" && !isAttend) {
    return true;
  } else if (orgType === "pattern" && isAttend) {
    return true;
  } else if (orgType === "pattern" && !isAttend) {
    return true;
  } else {
    false;
  }
};
