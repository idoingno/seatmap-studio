import { normalSitOut, partnerSitOut, patternSeat } from "../assets";
import { AllPersonArr, ColorArr } from "../config";
// import { chairSvg } from "../config/Markup/chair";
import { syncSvg } from "../config/Markup/syncIcon";
import { findColor, listToTreeSimple, sliceText } from "./util";

const martixParentAttrs = {
  label: {
    refY: 120,
    fontSize: 12,
  },
  body: {
    fill: "rgba(255,255,255,.3)", //
    stroke: "#ffe7ba", //
  },
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
  const personArr = AllPersonArr.getArr;
  const personByNodeId = new Map<string, any>(personArr.map((person: any) => [person.nodeId, person]));

  return data.map((item) => {
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
      data: item.data,
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
      obj.attrs = getTextAttrs(item.name);
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

const getTextAttrs = (name: string) => {
  return {
    text: {
      text: name,
    },
  };
};

const getRowSpaceAttrs = (flag: boolean) => {
  if (flag) {
    return {
      body: {
        stroke: "transparent",
        fill: "transparent",
      },
      label: {
        text: "过道 Aisle",
        fill: "#000",
        fontSize: 14,
      },
    };
  } else {
    return {
      body: {
        stroke: "transparent",
        fill: "transparent",
      },
    };
  }
};

const getColumnSpaceAttrs = () => {
  return {
    body: {
      fill: "transparent",
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

    const idt = item.data.idt && item.data.idt.split("-");
    // 查询人员座位关联
    if (!person) {
      return {
        // svg: {
        // fill: "rgba(0, 0, 0, 0.25)",
        // },
        rect: {
          fill: item.color ? findColor(item.color) : "transparent",
          stroke: "transparent",
        },
      };
    } else {
      return {
        text: {
          fill: "#FFFFFF",
          "font-size": "12",
          text: sliceText(person.name),
        },
        rect: {
          fill: item.color ? findColor(item.color) : "transparent",
          stroke: "transparent",
        },
        body: {
          stroke: "transparent",
        },
        svg: {
          width: 34,
          height: 34,
          x: 3,
          y: 3,
          fill: "#B39372",
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
          row: idt ? Number(idt[0]) + 1 : "",
          column: idt ? Number(idt[1]) + 1 : "",
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
    },
    text2: {
      text: item.data.tableNameEn,
      fontSize: 14,
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
