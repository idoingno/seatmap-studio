import { hasAllMatrixAnchors } from "../../utils/matrixOperations";
import { updateGraphicsForParent, updateNodesForParent } from "../../services/graphService";
import { register } from "x6-html-shape";
import createRender from "x6-html-shape/dist/react17";
import React, { memo, useLayoutEffect, useRef } from "react";
import { MATRIX_OFFSET_DISTANCE } from "../../GlobalVar";
import { getGraph } from "../../config/graphInstance";
import store from "../../store";
import { getRuntime } from "../../store/accessors";
import { runtimeActions } from "../../store/runtimeSlice";
import type { Node } from "@antv/x6";
import {
  buildMatrixMenuIndex,
  getNodeChildren,
  parentAddChair,
  parentAddRoworColumn,
  parentAddText,
  setAllCorridorColumnH,
} from "../../utils/util";
import { runGraphBatch } from "../../utils/graphBatch";
import { syncGraphPerformanceMode } from "../../utils/graphPerformance";
import { markLocalGraphMutation } from "../../utils/querySync";
import AppIcon from "../../Components/AppIcon";

export const AddMenuNode = memo(() => {
  const upRef = useRef<HTMLDivElement | null>(null);
  const downRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const awayRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = () => {
    const graph = getGraph();
    graph
      .getNodes()
      .filter((node: Node) => node.data?.nodeType === "menuNode")
      .forEach((node: Node) => graph.removeNode(node.id));
  };

  const addTopRow = async () => {
    // 获取场次Id
    const sessionId = getRuntime().sessionId;

    const graph = getGraph();

    // 获取所有节点
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);
    markLocalGraphMutation();

    // 获取所有行
    const rows = parent.data.rows;

    runGraphBatch(graph, "matrix-add-row-top", () => {
      const createdNodes: Node[] = [];
      // 更改父节点高度
      const { width, height } = parent.size();
      const pHeight = height + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      store.dispatch(runtimeActions.setMatrixHeight(pHeight));

      const firstRowText = [matrixIndex.rowTextByIdx.get(0)].filter(Boolean) as Node[];
      const firstRowEnText = [matrixIndex.rowTextEnByIdx.get(0)].filter(Boolean) as Node[];
      const firstRowChair = matrixIndex.chairsByRow.get(0) ?? [];
      const firstRowSpace = [matrixIndex.rowSpaceByIdx.get(0)].filter(Boolean) as Node[];

      if (!hasAllMatrixAnchors(firstRowText, firstRowEnText, firstRowChair)) {
        return;
      }

      createdNodes.push(
        parentAddText({
          data: firstRowText,
          shape: "row-text-cn",
          label: `新增行`,
          idt: `row-0`,
          idx: 0,
          direction: "top",
        })
      );
      createdNodes.push(
        parentAddText({
          data: firstRowEnText,
          shape: "row-text-en",
          label: `新增行`,
          idt: `rowEn-0`,
          idx: 0,
          direction: "top",
        })
      );
      createdNodes.push(...parentAddChair(firstRowChair, 0, "top"));
      if (firstRowSpace.length > 0) {
        createdNodes.push(
          parentAddRoworColumn({
            data: firstRowSpace,
            shape: "row-space-node",
            idt: "aisleRowSpace-0",
            idx: 0,
            direction: "top",
          })
        );
      }
      graph.addNodes(createdNodes, { async: true });
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
          element.setData({ idx: element.data.idx + 1, idt: `row-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixRowsEn") {
          element.setData({ idx: element.data.idx + 1, idt: `rowEn-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx + 1, idt: `${Number(idArr[0]) + 1}-${idArr[1]}` });
        } else if (element.data.nodeType === "aisleRowSpace") {
          element.setData({ idx: element.data.idx + 1, idt: `aisleRowSpace-${Number(idArr[1]) + 1}` });
        }

        element.position(x, y + MATRIX_OFFSET_DISTANCE);
      }

      parent.setData({ rows: rows + 1 });
    });
    syncGraphPerformanceMode(graph);

    await updateGraphicsForParent(parent, sessionId);

    await updateNodesForParent(getNodeChildren(parent), sessionId, parent);
  };

  const addBottomRow = async () => {
    // 获取场次Id
    const sessionId = getRuntime().sessionId;

    const graph = getGraph();

    // 获取所有节点
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);
    markLocalGraphMutation();

    runGraphBatch(graph, "matrix-add-row-bottom", () => {
      const createdNodes: Node[] = [];

      // 更改父节点高度
      const { width, height } = parent.size();
      const pHeight = height + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      store.dispatch(runtimeActions.setMatrixHeight(pHeight));

      // 获取所有行
      const rows = parent.data.rows;

      const lastMatrixBottomNum = matrixIndex.columnBottomNodes;
      const lastRowText = [matrixIndex.rowTextByIdx.get(rows - 1)].filter(Boolean) as Node[];
      const lastRowEnText = [matrixIndex.rowTextEnByIdx.get(rows - 1)].filter(Boolean) as Node[];
      const lastRowChair = matrixIndex.chairsByRow.get(rows - 1) ?? [];
      const lastRowSpace = [matrixIndex.rowSpaceByIdx.get(rows - 2)].filter(Boolean) as Node[];

      if (!hasAllMatrixAnchors(lastMatrixBottomNum, lastRowText, lastRowEnText, lastRowChair)) {
        return;
      }

      createdNodes.push(
        parentAddText({
          data: lastRowText,
          shape: "row-text-cn",
          label: `新增行`,
          idt: `row-${rows}`,
          idx: rows,
          direction: "bottom",
        })
      );

      createdNodes.push(
        parentAddText({
          data: lastRowEnText,
          shape: "row-text-en",
          label: `新增行`,
          idt: `rowEn-${rows}`,
          idx: rows,
          direction: "bottom",
        })
      );
      createdNodes.push(...parentAddChair(lastRowChair, rows, "bottom"));

      if (lastRowSpace.length > 0) {
        createdNodes.push(
          parentAddRoworColumn({
            data: lastRowSpace,
            shape: "row-space-node",
            idt: `aisleRowSpace-${rows - 1}`,
            idx: rows - 1,
            direction: "bottom",
          })
        );
      }
      graph.addNodes(createdNodes, { async: true });

      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      lastMatrixBottomNum.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x, y + MATRIX_OFFSET_DISTANCE);
      });

      parent.setData({ rows: rows + 1 });
    });
    syncGraphPerformanceMode(graph);

    await updateGraphicsForParent(parent, sessionId);

    await updateNodesForParent(getNodeChildren(parent), sessionId, parent);
  };

  const addLeftColumn = async () => {
    const sessionId = getRuntime().sessionId;
    const graph = getGraph();
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);
    const columns = parent.data.columns;
    markLocalGraphMutation();

    runGraphBatch(graph, "matrix-add-column-left", () => {
      const createdNodes: Node[] = [];

      const { width, height } = parent.size();
      const pWidth = width + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      store.dispatch(runtimeActions.setMatrixWidth(pWidth));

      const firstColumnTopText = [matrixIndex.columnTopTextByIdx.get(0)].filter(Boolean) as Node[];
      const firstColumnBottomText = [matrixIndex.columnBottomTextByIdx.get(0)].filter(Boolean) as Node[];
      const firstColumnChair = matrixIndex.chairsByColumn.get(0) ?? [];
      const firstColumnsSpace = [matrixIndex.columnSpaceByIdx.get(0)].filter(Boolean) as Node[];

      if (!hasAllMatrixAnchors(firstColumnTopText, firstColumnBottomText, firstColumnChair)) {
        return;
      }

      createdNodes.push(
        parentAddText({
          data: firstColumnTopText,
          shape: "top-number-node",
          label: `新增列`,
          idt: `matrixColumnTopNum-0`,
          idx: 0,
          direction: "left",
        })
      );

      createdNodes.push(
        parentAddText({
          data: firstColumnBottomText,
          shape: "bottom-number-node",
          label: `新增列`,
          idt: `matrixColumnBottomNum-0`,
          idx: 0,
          direction: "left",
        })
      );

      createdNodes.push(...parentAddChair(firstColumnChair, 0, "left"));

      if (firstColumnsSpace.length > 0) {
        createdNodes.push(
          parentAddRoworColumn({
            data: firstColumnsSpace,
            shape: "column-space-node",
            idt: "corridorColumnSpace-0",
            idx: 0,
            direction: "left",
          })
        );
      }
      graph.addNodes(createdNodes, { async: true });

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
          element.setData({ idx: element.data.idx + 1, idt: `matrixColumnTopNum-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixColumnBottomNum") {
          element.setData({ idx: element.data.idx + 1, idt: `matrixColumnBottomNum-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx + 1, idt: `${idArr[0]}-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "corridorColumnSpace") {
          element.setData({ idx: element.data.idx + 1, idt: `corridorColumnSpace-${Number(idArr[1]) + 1}` });
        }

        element.position(x + MATRIX_OFFSET_DISTANCE, y);
      }

      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);
      parent.setData({ columns: columns + 1 });
    });
    syncGraphPerformanceMode(graph);

    await updateGraphicsForParent(parent, sessionId);

    await updateNodesForParent(getNodeChildren(parent), sessionId, parent);
  };

  const addRightColumn = async () => {
    // 获取场次Id
    const sessionId = getRuntime().sessionId;

    const graph = getGraph();

    // 获取所有节点
    const nodes = graph.getNodes();
    const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
    const matrixIndex = buildMatrixMenuIndex(parent);

    // 获取所有列
    const columns = parent.data.columns;
    markLocalGraphMutation();

    runGraphBatch(graph, "matrix-add-column-right", () => {
      const createdNodes: Node[] = [];

      const { width, height } = parent.size();
      const pWidth = width + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      store.dispatch(runtimeActions.setMatrixWidth(pWidth));

      const lastColumns = matrixIndex.rowEnNodes;
      const lastColumnsTopText = [matrixIndex.columnTopTextByIdx.get(columns - 1)].filter(Boolean) as Node[];
      const lastColumnsBottomText = [matrixIndex.columnBottomTextByIdx.get(columns - 1)].filter(Boolean) as Node[];
      const lastRowChair = matrixIndex.chairsByColumn.get(columns - 1) ?? [];
      const lastRowSpace = [matrixIndex.columnSpaceByIdx.get(columns - 2)].filter(Boolean) as Node[];

      if (!hasAllMatrixAnchors(lastColumns, lastColumnsTopText, lastColumnsBottomText, lastRowChair)) {
        return;
      }

      createdNodes.push(
        parentAddText({
          data: lastColumnsTopText,
          shape: "top-number-node",
          label: `新增列`,
          idt: `matrixColumnTopNum-${columns}`,
          idx: columns,
          direction: "right",
        })
      );

      createdNodes.push(
        parentAddText({
          data: lastColumnsBottomText,
          shape: "bottom-number-node",
          label: `新增列`,
          idt: `matrixColumnBottomNum-${columns}`,
          idx: columns,
          direction: "right",
        })
      );
      createdNodes.push(...parentAddChair(lastRowChair, columns, "right"));

      if (lastRowSpace.length > 0) {
        createdNodes.push(
          parentAddRoworColumn({
            data: lastRowSpace,
            shape: "column-space-node",
            idt: `corridorColumnSpace-${columns - 1}`,
            idx: columns - 1,
            direction: "right",
          })
        );
      }
      graph.addNodes(createdNodes, { async: true });

      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

      lastColumns.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x + MATRIX_OFFSET_DISTANCE, y);
      });

      parent.setData({ columns: columns + 1 });
    });
    syncGraphPerformanceMode(graph);

    await updateGraphicsForParent(parent, sessionId);

    await updateNodesForParent(getNodeChildren(parent), sessionId, parent);
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
      bindAction(upRef.current, addTopRow),
      bindAction(downRef.current, addBottomRow),
      bindAction(leftRef.current, addLeftColumn),
      bindAction(rightRef.current, addRightColumn),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <div
      className="menu-dialog"
      ref={awayRef}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="items" ref={upRef}>
        <AppIcon name="addTop" className="menu-item-icon" /> 插入最上 1 行
      </div>
      <div className="items" ref={downRef}>
        <AppIcon name="addBottom" className="menu-item-icon" /> 插入最下 1 行
      </div>
      <div className="items" ref={leftRef}>
        <AppIcon name="addLeft" className="menu-item-icon" /> 插入最左 1 列
      </div>
      <div className="items" ref={rightRef}>
        <AppIcon name="addRight" className="menu-item-icon" /> 插入最右 1 列
      </div>
    </div>
  );
});

const render = createRender(AddMenuNode);

register({
  shape: "add-menu-react-node",
  render,
  width: 152,
  height: 160,
  data: {
    nodeType: "menuNode",
  },
});
