import { useDrop } from "ahooks";
import { Node } from "@antv/x6";
import {
  getGraph,
  getDragNodeType,
  getCurrentColumn,
  getCurrentRow,
  Session,
  setCurrentColumn,
  setCurrentRow,
} from "./config";
import { isOutElementCorridor, isOutElementAisle } from "./utils/util";
import { AISLE_SIZE } from "./GlobalVar";

const toDrop = (dropRef: any) => {
  return useDrop(dropRef, {
    onDom: (content: any, e) => {
      const graph = getGraph();
      const nodes = graph.getNodes() as any;
      // 获取场次Id
      // const sessionId = Session.getDataId;
      // const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      if (content.nodeType === "Corridor") {
        const currentColumn = getCurrentColumn();
        // const columnSpaceArr = getColumnSpaceArr();
        const corridorColumnspaceArr = nodes.filter(
          (item: any) => item.data.idt && item.data.idt.includes("corridorColumnSpace-")
        );
        const findIdx = corridorColumnspaceArr.find((ite: any) => ite.data.idx === currentColumn);
        if (currentColumn > -1) {
          // columnSpaceArr[currentColumn].hit = true;
          // corridorColumnspaceArr[currentColumn].data.isExist = true;
          findIdx.data.isExist = true;
          findIdx.setProp({
            size: {
              width: AISLE_SIZE,
              height: findIdx.height,
            },
          });
          findIdx.attr("body/fill", "transparent");
        }
      } else if (content.nodeType === "Aisle") {
        const currentRow = getCurrentRow();
        // const rowSpaceArr = getRowSpaceArr();
        const aisleRowSpaceArr = nodes.filter((item: any) => item.data.idt && item.data.idt.includes("aisleRowSpace-"));
        const findIdx = aisleRowSpaceArr.find((ite: any) => ite.data.idx === currentRow);
        if (currentRow > -1) {
          // rowSpaceArr[currentRow].hit = true;
          findIdx.data.isExist = true;
          // aisleRowSpaceArr[currentRow].data.isExist = true;

          findIdx.setProp({
            size: {
              width: findIdx.width,
              height: AISLE_SIZE,
            },
          });
          findIdx.attr("body/fill", "transparent");
          findIdx.attr("label", {
            text: "过道 Aisle",
            fill: "#000",
            fontSize: 14,
          });
        }
      }
    },
    onDragEnter: (e: any) => {
      const nodeType = getDragNodeType();

      const graph = getGraph();
      const p1 = graph.pageToLocal(e.x, e.y);
      if (nodeType === "Corridor") {
        isOutElementCorridor(p1);
      } else if (nodeType === "Aisle") {
        isOutElementAisle(p1);
      }
    },
    onDragLeave: (e: any) => {},
    onDragOver: (e: any) => {},
    onDrop: (e: any) => {
    },
  });
};

export default toDrop;
