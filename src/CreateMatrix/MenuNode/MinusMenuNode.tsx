import { register } from "x6-html-shape";
import createRender from "x6-html-shape/dist/react17";
import React, { memo, useLayoutEffect, useRef, useState } from "react";
import { MATRIX_OFFSET_DISTANCE, MATRIX_OFFSET_SIZE_DISTANCE } from "../../GlobalVar";
import { MatrixSize, Session, getGraph } from "../../config";
import type { Node } from "@antv/x6";
import { buildMatrixMenuIndex, getNodeChildren, resizeProscenium, resizeWindow, setAllCorridorColumnH } from "../../utils/util";
import AppIcon from "../../Components/AppIcon";
import { message } from "antd";
import { delNode, delPersonnel, updateGraphics, updateNode } from "../../utils/apiParams";
import { handleCpApi } from "../../api";
import store from "../../store/index";
import { subAction } from "../../store/actionCreators";
import { runGraphBatch } from "../../utils/graphBatch";
import { syncGraphPerformanceMode } from "../../utils/graphPerformance";
import { markLocalGraphMutation } from "../../utils/querySync";

const hasAllMatrixAnchors = (...groups: Node[][]) => {
  return groups.every((group) => group.length > 0);
};

export const MinusMenuNode = memo(() => {
  const [show, setShow] = useState(true);
  const upRef = useRef<HTMLDivElement | null>(null);
  const downRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const awayRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = () => {
    setShow(false);
  };

  const removeTopRow = async () => {
    const sessionId = Session.getDataId;
    const graph = getGraph();
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);
    const rows = parent.data.rows;
    markLocalGraphMutation();

    if (rows <= 2) {
      message.error("至少保留二行");
      return;
    }

    const firstRowText = [matrixIndex.rowTextByIdx.get(0)].filter(Boolean) as Node[];
    const firstRowEnText = [matrixIndex.rowTextEnByIdx.get(0)].filter(Boolean) as Node[];
    const firstRowChair = matrixIndex.chairsByRow.get(0) ?? [];
    const firstRowSpace = [matrixIndex.rowSpaceByIdx.get(0)].filter(Boolean) as Node[];
    const hasPeronArr = matrixIndex.allChildren.filter(
      (item) => item.attrs.xnode && item.data.nodeType === "matrixChair" && item.data.idt.split("-")[0] === "0"
    );

    if (!hasAllMatrixAnchors(firstRowText, firstRowEnText, firstRowChair)) {
      return;
    }

    const removeArr = [...firstRowText, ...firstRowEnText, ...firstRowChair, ...firstRowSpace];
    const fs = firstRowSpace[0]?.size?.();
    const offset = fs && fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE;

    runGraphBatch(graph, "matrix-remove-row-top", () => {
      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      const { width, height } = parent.size();
      const pHeight = height - offset;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      MatrixSize.setMh = pHeight;
      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      const filterNode = matrixIndex.allChildren.filter((ite: Node) => {
        return (
          ite.data &&
          ite.data.idt &&
          !ite.data.idt.includes("matrixColumnTopNum") &&
          ite.data.nodeType !== "matrixContainer" &&
          !ite.data.idt.includes("corridorColumnSpace")
        );
      });
      for (let i = 0; i < filterNode.length; i++) {
        const element = filterNode[i];
        let { x, y } = element.getPosition();
        const idArr = element.data.idt && element.data.idt.split("-");
        if (element.data.nodeType === "matrixRows") {
          element.setData({ idx: element.data.idx - 1, idt: `row-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixRowsEn") {
          element.setData({ idx: element.data.idx - 1, idt: `rowEn-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx - 1, idt: `${Number(idArr[0]) - 1}-${idArr[1]}` });
        } else if (element.data.nodeType === "aisleRowSpace") {
          element.setData({ idx: element.data.idx - 1, idt: `aisleRowSpace-${Number(idArr[1]) - 1}` });
        }

        element.position(x, y - offset);
      }

      parent.setData({
        rows: rows - 1,
      });
    });
    syncGraphPerformanceMode(graph);

    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    const delNodeParams = delNode(removeArr, sessionId);
    await handleCpApi({ params: delNodeParams, code: "seat" }, true);

    if (hasPeronArr && hasPeronArr.length > 0) {
      for (let i = 0; i < hasPeronArr.length; i++) {
        const element: any = hasPeronArr[i];
        store.dispatch(subAction(element.attrs.xnode.key));
      }
    }
  };

  const removeLeftColumn = async () => {
    const sessionId = Session.getDataId;
    const graph = getGraph();
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);
    const columns = parent.data.columns;
    markLocalGraphMutation();

    if (columns <= 2) {
      message.error("至少保留2列");
      return;
    }

    const firstColumnTopText = [matrixIndex.columnTopTextByIdx.get(0)].filter(Boolean) as Node[];
    const firstColumnBottomText = [matrixIndex.columnBottomTextByIdx.get(0)].filter(Boolean) as Node[];
    const firstColumnChair = matrixIndex.chairsByColumn.get(0) ?? [];
    const firstColumnsSpace = [matrixIndex.columnSpaceByIdx.get(0)].filter(Boolean) as Node[];

    if (!hasAllMatrixAnchors(firstColumnTopText, firstColumnBottomText, firstColumnChair)) {
      return;
    }

    const hasPeronArr = matrixIndex.allChildren.filter(
      (item) => item.attrs.xnode && item.data.nodeType === "matrixChair" && item.data.idt.split("-")[1] === "0"
    );

    const removeArr = [...firstColumnTopText, ...firstColumnBottomText, ...firstColumnChair, ...firstColumnsSpace];
    const fs = firstColumnsSpace[0]?.size?.();
    const offset = fs && fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE;

    runGraphBatch(graph, "matrix-remove-column-left", () => {
      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      const { width, height } = parent.size();
      const pWidth = width - offset;
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      MatrixSize.setMw = pWidth;

      const filterNode = matrixIndex.allChildren.filter((ite: Node) => {
        return (
          ite.data &&
          ite.data.idt &&
          ite.data.nodeType !== "matrixRows" &&
          ite.data.nodeType !== "matrixContainer" &&
          !ite.data.idt.includes("aisleRowSpace")
        );
      });
      for (let i = 0; i < filterNode.length; i++) {
        const element = filterNode[i];
        let { x, y } = element.getPosition();
        const idArr = element.data.idt && element.data.idt.split("-");

        if (element.data.nodeType === "matrixColumnTopNum") {
          element.setData({ idx: element.data.idx - 1, idt: `matrixColumnTopNum-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixColumnBottomNum") {
          element.setData({ idx: element.data.idx - 1, idt: `matrixColumnBottomNum-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx - 1, idt: `${idArr[0]}-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "corridorColumnSpace") {
          element.setData({ idx: element.data.idx - 1, idt: `corridorColumnSpace-${Number(idArr[1]) - 1}` });
        }

        element.position(x - offset, y);
      }

      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);
      parent.setData({ columns: columns - 1 });
    });
    syncGraphPerformanceMode(graph);

    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    const delNodeParams = delNode(removeArr, sessionId);
    await handleCpApi({ params: delNodeParams, code: "seat" }, true);

    if (hasPeronArr && hasPeronArr.length > 0) {
      for (let i = 0; i < hasPeronArr.length; i++) {
        const element: any = hasPeronArr[i];
        store.dispatch(subAction(element.attrs.xnode.key));
      }
    }
  };

  const removeBottomRow = async () => {
    const sessionId = Session.getDataId;
    const graph = getGraph();

    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);

    const rows = parent.data.rows;
    markLocalGraphMutation();

    if (rows <= 2) {
      message.error("至少保留二行");
      return;
    }

    const lastMatrixBottomNum = matrixIndex.columnBottomNodes;
    const lastRowText = [matrixIndex.rowTextByIdx.get(rows - 1)].filter(Boolean) as Node[];
    const lastRowEnText = [matrixIndex.rowTextEnByIdx.get(rows - 1)].filter(Boolean) as Node[];
    const lastRowChair = matrixIndex.chairsByRow.get(rows - 1) ?? [];
    const lastRowSpace = [matrixIndex.rowSpaceByIdx.get(rows - 2)].filter(Boolean) as Node[];

    if (!hasAllMatrixAnchors(lastMatrixBottomNum, lastRowText, lastRowEnText, lastRowChair)) {
      return;
    }

    const hasPeronArr = matrixIndex.allChildren.filter(
      (item) =>
        item.attrs.xnode &&
        item.data.nodeType === "matrixChair" &&
        item.data.idt.split("-")[0] === (rows - 1).toString()
    );

    const removeArr = [...lastRowText, ...lastRowEnText, ...lastRowChair, ...lastRowSpace];
    const fs = lastRowSpace[0]?.size?.();
    const offset = fs && fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE;

    runGraphBatch(graph, "matrix-remove-row-bottom", () => {
      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      const { width, height } = parent.size();
      const pHeight = height - offset;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      MatrixSize.setMh = pHeight;
      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      lastMatrixBottomNum.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x, y - offset);
      });

      parent.setData({
        rows: rows - 1,
      });
    });
    syncGraphPerformanceMode(graph);

    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);

    const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);

    const delNodeParams = delNode(removeArr, sessionId);
    await handleCpApi({ params: delNodeParams, code: "seat" }, true);

    if (hasPeronArr && hasPeronArr.length > 0) {
      for (let i = 0; i < hasPeronArr.length; i++) {
        const element: any = hasPeronArr[i];
        store.dispatch(subAction(element.attrs.xnode.key));
      }
    }
  };

  const removeRightColumn = async () => {
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
      const matrixIndex = buildMatrixMenuIndex(parent);
      // 获取所有列
      const columns = parent.data.columns;
      markLocalGraphMutation();

      if (columns <= 2) {
        message.error("至少保留2列");
        return;
      }

      const lastColumns = matrixIndex.rowEnNodes;
      const lastColumnsTopText = [matrixIndex.columnTopTextByIdx.get(columns - 1)].filter(Boolean) as Node[];
      const lastColumnsBottomText = [matrixIndex.columnBottomTextByIdx.get(columns - 1)].filter(Boolean) as Node[];
      const lastRowChair = matrixIndex.chairsByColumn.get(columns - 1) ?? [];
      const lastRowSpace = [matrixIndex.columnSpaceByIdx.get(columns - 2)].filter(Boolean) as Node[];

      if (!hasAllMatrixAnchors(lastColumns, lastColumnsTopText, lastColumnsBottomText, lastRowChair)) {
        return;
      }
      // 过滤出添加过人的节点
      const hasPeronArr = matrixIndex.allChildren.filter(
        (item) =>
          item.attrs.xnode &&
          item.data.nodeType === "matrixChair" &&
          item.data.idt.split("-")[1] === (columns - 1).toString()
      );

      const removeArr = [...lastColumnsTopText, ...lastColumnsBottomText, ...lastRowChair, ...lastRowSpace];
      const fs = lastRowSpace[0]?.size?.();
      const offset = fs && fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE;

      runGraphBatch(graph, "matrix-remove-column-right", () => {
        for (let i = 0; i < removeArr.length; i++) {
          const element = removeArr[i];
          parent.removeChild(element);
        }

        const { width, height } = parent.size();
        const pWidth = width - offset;
        parent.setProp({
          size: {
            width: pWidth,
            height: height,
          },
        });

        MatrixSize.setMw = pWidth;
        setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

        lastColumns.forEach((element) => {
          const { x, y } = element.getPosition();
          element.position(x - offset, y);
        });

        parent.setData({ columns: columns - 1 });
      });
      syncGraphPerformanceMode(graph);

      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      const nodeParams = updateNode(getNodeChildren(parent), sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      const delNodeParams = delNode(removeArr, sessionId);
      await handleCpApi({ params: delNodeParams, code: "seat" }, true);

      if (hasPeronArr && hasPeronArr.length > 0) {
        for (let i = 0; i < hasPeronArr.length; i++) {
          const element: any = hasPeronArr[i];
          store.dispatch(subAction(element.attrs.xnode.key));
        }
      }
  };

  useLayoutEffect(() => {
    const bindAction = (element: HTMLDivElement | null, action: () => Promise<void>): (() => void) => {
      if (!element) {
        return () => undefined;
      }

      const handler = () => {
        void action().then(closeMenu);
      };

      element.addEventListener("click", handler);
      return () => {
        element.removeEventListener("click", handler);
      };
    };

    const cleanups = [
      bindAction(upRef.current, removeTopRow),
      bindAction(downRef.current, removeBottomRow),
      bindAction(leftRef.current, removeLeftColumn),
      bindAction(rightRef.current, removeRightColumn),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return show ? (
    <div
      className="menu-dialog"
      ref={awayRef}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="items" ref={upRef}>
        <AppIcon name="removeTop" className="menu-item-icon" /> 删除最上 1 行
      </div>
      <div className="items" ref={downRef}>
        <AppIcon name="removeBottom" className="menu-item-icon" /> 删除最下 1 行
      </div>
      <div className="items" ref={leftRef}>
        <AppIcon name="removeLeft" className="menu-item-icon" /> 删除最左 1 列
      </div>
      <div className="items" ref={rightRef}>
        <AppIcon name="removeRight" className="menu-item-icon" /> 删除最右 1 列
      </div>
    </div>
  ) : (
    <></>
  );
});

const render = createRender(MinusMenuNode);

register({
  shape: "minus-menu-react-node",
  render,
  width: 152,
  height: 160,
  data: {
    nodeType: "menuNode",
  },
});
