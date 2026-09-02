import { useDrop } from "ahooks";
import { getGraph } from "./config";
import store from "./store";
import { isOutElementCorridor, isOutElementAisle } from "./utils/util";
import { AISLE_SIZE } from "./GlobalVar";

const toDrop = (dropRef: any) => {
  return useDrop(dropRef, {
    onDom: (content: any) => {
      const graph = getGraph();
      const nodes = graph.getNodes() as any;
      const { currentColumn, currentRow, dragNodeType } = store.getState().runtime;

      if (content.nodeType === "Corridor") {
        const corridorColumnspaceArr = nodes.filter(
          (item: any) => item.data.idt && item.data.idt.includes("corridorColumnSpace-")
        );
        const findIdx = corridorColumnspaceArr.find((ite: any) => ite.data.idx === currentColumn);
        if (currentColumn > -1 && findIdx) {
          findIdx.setData({ ...findIdx.data, isExist: true });
          findIdx.setProp({
            size: {
              width: AISLE_SIZE,
              height: findIdx.height,
            },
          });
          findIdx.attr("body/fill", "transparent");
        }
      } else if (content.nodeType === "Aisle") {
        const aisleRowSpaceArr = nodes.filter((item: any) => item.data.idt && item.data.idt.includes("aisleRowSpace-"));
        const findIdx = aisleRowSpaceArr.find((ite: any) => ite.data.idx === currentRow);
        if (currentRow > -1 && findIdx) {
          findIdx.setData({ ...findIdx.data, isExist: true });
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
      const nodeType = store.getState().runtime.dragNodeType;

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
    onDrop: (e: any) => {},
  });
};

export default toDrop;
