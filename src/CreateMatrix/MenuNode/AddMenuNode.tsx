import { register } from "x6-html-shape";
import createRender from "x6-html-shape/dist/react17";
import React, { memo, useRef, useState } from "react";
import { MATRIX_OFFSET_DISTANCE } from "../../GlobalVar";
import { ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useClickAway, useEventListener } from "ahooks";
import { MatrixAllRowsOrColumns, MatrixSize, Session, getGraph } from "../../config";
import type { Node } from "@antv/x6";
import {
  parentAddChair,
  parentAddRoworColumn,
  parentAddText,
  resizeProscenium,
  resizeWindow,
  setAllCorridorColumnH,
} from "../../utils/util";
import { updateGraphics, updateNode } from "../../utils/apiParams";
import { handleCpApi } from "../../api";

export const AddMenuNode = memo(() => {
  const [show, setShow] = useState(true);
  const upRef = useRef(null);
  const downRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const awayRef = useRef(null);

  useEventListener(
    "click",
    async () => {
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有行
      const rows = parent.data.rows;

      // 更改父节点高度
      const { width, height } = parent.size();
      const pHeight = height + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      // resizeWindow(pHeight);

      MatrixSize.setMh = pHeight;

      const firstRowText = nodes.filter((ite: Node) => ite.data.nodeType === "matrixRows" && ite.data.idt === "row-0");
      const firstRowEnText = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixRowsEn" && ite.data.idt === "rowEn-0"
      );
      const firstRowChair: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixChair" && ite.data.idt.split("-")[0] === "0"
      );
      const firstRowSpace: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "aisleRowSpace" && ite.data.idt === "aisleRowSpace-0"
      );

      parentAddText({
        data: firstRowText,
        shape: "row-text-cn",
        label: `新增行`,
        idt: `row-0`,
        idx: 0,
        direction: "top",
      });
      parentAddText({
        data: firstRowEnText,
        shape: "row-text-en",
        label: `新增行`,
        idt: `rowEn-0`,
        idx: 0,
        direction: "top",
      });
      parentAddChair(firstRowChair, 0, "top");
      parentAddRoworColumn({
        data: firstRowSpace,
        shape: "row-space-node",
        idt: "aisleRowSpace-0",
        idx: 0,
        direction: "top",
      });
      // 设置所有列间隙高度
      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      const filterNode = nodes.filter((ite: Node) => {
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
          // element.setProp({ label: `第${Number(idArr[1]) + 2}排` });
          element.setData({ idx: element.data.idx + 1, idt: `row-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixRowsEn") {
          // element.setProp({ label: `Row ${Number(idArr[1]) + 2}` });
          element.setData({ idx: element.data.idx + 1, idt: `rowEn-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx + 1, idt: `${Number(idArr[0]) + 1}-${idArr[1]}` });
        } else if (element.data.nodeType === "aisleRowSpace") {
          element.setData({ idx: element.data.idx + 1, idt: `aisleRowSpace-${Number(idArr[1]) + 1}` });
        }

        element.position(x, y + MATRIX_OFFSET_DISTANCE);
      }

      parent.setData({ rows: rows + 1 });

      // const nodesss = graph.getNodes();
      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
    },
    { target: upRef }
  );

  useEventListener(
    "click",
    async () => {
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 更改父节点高度
      const { width, height } = parent.size();
      const pHeight = height + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      // resizeWindow(pHeight);

      MatrixSize.setMh = pHeight;

      // 获取所有行
      const rows = parent.data.rows;

      const lastMatrixBottomNum = nodes.filter((ite: Node) => ite.data.nodeType === "matrixColumnBottomNum");

      const lastRowText = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixRows" && ite.data.idt === `row-${rows - 1}`
      );

      const lastRowEnText = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixRowsEn" && ite.data.idt === `rowEn-${rows - 1}`
      );

      const lastRowChair: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixChair" && ite.data.idt.split("-")[0] === (rows - 1).toString()
      );

      const lastRowSpace: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "aisleRowSpace" && ite.data.idt === `aisleRowSpace-${rows - 2}`
      );

      parentAddText({
        data: lastRowText,
        shape: "row-text-cn",
        // label: `第${rows + 1}排`,
        label: `新增行`,
        idt: `row-${rows}`,
        idx: rows,
        direction: "bottom",
      });

      parentAddText({
        data: lastRowEnText,
        shape: "row-text-en",
        // label: `Row ${rows + 1}`,
        label: `新增行`,
        idt: `rowEn-${rows}`,
        idx: rows,
        direction: "bottom",
      });
      parentAddChair(lastRowChair, rows, "bottom");

      parentAddRoworColumn({
        data: lastRowSpace,
        shape: "row-space-node",
        idt: `aisleRowSpace-${rows - 1}`,
        idx: rows - 1,
        direction: "bottom",
      });

      // 设置所有列间隙高度
      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      lastMatrixBottomNum.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x, y + MATRIX_OFFSET_DISTANCE);
      });

      // MatrixAllRowsOrColumns.setAllRows = rows + 1;

      parent.setData({ rows: rows + 1 });

      // const nodesss = graph.getNodes();
      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
    },
    { target: downRef }
  );

  useEventListener(
    "click",
    async () => {
      // 获取场次Id
      const sessionId = Session.getDataId;
      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      // const columns = MatrixAllRowsOrColumns.getAllColumns;

      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有列
      const columns = parent.data.columns;

      // 更改父节点高度
      const { width, height } = parent.size();
      const pWidth = width + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      // resizeProscenium(pWidth);

      MatrixSize.setMw = pWidth;

      const firstColumnTopText = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixColumnTopNum" && ite.data.idt === "matrixColumnTopNum-0"
      );
      const firstColumnBottomText = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixColumnBottomNum" && ite.data.idt === "matrixColumnBottomNum-0"
      );
      const firstColumnChair: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixChair" && ite.data.idt.split("-")[1] === "0"
      );
      const firstColumnsSpace: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "corridorColumnSpace" && ite.data.idt === "corridorColumnSpace-0"
      );

      parentAddText({
        data: firstColumnTopText,
        shape: "top-number-node",
        label: `新增列`,
        idt: `matrixColumnTopNum-0`,
        idx: 0,
        direction: "left",
      });

      parentAddText({
        data: firstColumnBottomText,
        shape: "bottom-number-node",
        label: `新增列`,
        idt: `matrixColumnBottomNum-0`,
        idx: 0,
        direction: "left",
      });

      parentAddChair(firstColumnChair, 0, "left");

      parentAddRoworColumn({
        data: firstColumnsSpace,
        shape: "column-space-node",
        idt: "corridorColumnSpace-0",
        idx: 0,
        direction: "left",
      });

      const filterNode = nodes.filter((ite: Node) => {
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
          // element.setProp({ label: `${Number(idArr[1]) + 2}` });
          element.setData({ idx: element.data.idx + 1, idt: `matrixColumnTopNum-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixColumnBottomNum") {
          // element.setProp({ label: `${Number(idArr[1]) + 2}` });
          element.setData({ idx: element.data.idx + 1, idt: `matrixColumnBottomNum-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx + 1, idt: `${idArr[0]}-${Number(idArr[1]) + 1}` });
        } else if (element.data.nodeType === "corridorColumnSpace") {
          element.setData({ idx: element.data.idx + 1, idt: `corridorColumnSpace-${Number(idArr[1]) + 1}` });
        }

        element.position(x + MATRIX_OFFSET_DISTANCE, y);
      }

      // 设置所有行间隙高度
      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

      // MatrixAllRowsOrColumns.setAllColumns = columns + 1;
      parent.setData({ columns: columns + 1 });

      // const nodesss = graph.getNodes();
      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
    },
    { target: leftRef }
  );

  useEventListener(
    "click",
    async () => {
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();
      // const columns = MatrixAllRowsOrColumns.getAllColumns;

      // 获取所有节点
      const nodes = graph.getNodes();
      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有列
      const columns = parent.data.columns;

      // 更改父节点高度
      const { width, height } = parent.size();
      const pWidth = width + MATRIX_OFFSET_DISTANCE;
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      // resizeProscenium(pWidth);

      MatrixSize.setMw = pWidth;

      const lastColumns = nodes.filter((ite: Node) => ite.data.nodeType === "matrixRowsEn");

      const lastColumnsTopText = nodes.filter(
        (ite: Node) =>
          ite.data.nodeType === "matrixColumnTopNum" && ite.data.idt === `matrixColumnTopNum-${columns - 1}`
      );

      const lastColumnsBottomText = nodes.filter(
        (ite: Node) =>
          ite.data.nodeType === "matrixColumnBottomNum" && ite.data.idt === `matrixColumnBottomNum-${columns - 1}`
      );

      const lastRowChair: any[] = nodes.filter(
        (ite: Node) => ite.data.nodeType === "matrixChair" && ite.data.idt.split("-")[1] === (columns - 1).toString()
      );

      const lastRowSpace: any[] = nodes.filter(
        (ite: Node) =>
          ite.data.nodeType === "corridorColumnSpace" && ite.data.idt === `corridorColumnSpace-${columns - 2}`
      );

      parentAddText({
        data: lastColumnsTopText,
        shape: "top-number-node",
        // label: `${columns + 1}`,
        label: `新增列`,
        idt: `matrixColumnTopNum-${columns}`,
        idx: columns,
        direction: "right",
      });

      parentAddText({
        data: lastColumnsBottomText,
        shape: "bottom-number-node",
        // label: `${columns + 1}`,
        label: `新增列`,
        idt: `matrixColumnBottomNum-${columns}`,
        idx: columns,
        direction: "right",
      });
      parentAddChair(lastRowChair, columns, "right");

      parentAddRoworColumn({
        data: lastRowSpace,
        shape: "column-space-node",
        idt: `corridorColumnSpace-${columns - 1}`,
        idx: columns - 1,
        direction: "right",
      });

      // 设置所有行间隙高度
      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

      lastColumns.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x + MATRIX_OFFSET_DISTANCE, y);
      });

      // MatrixAllRowsOrColumns.setAllColumns = columns + 1;
      parent.setData({ columns: columns + 1 });

      // const nodesss = graph.getNodes();
      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
    },
    { target: rightRef }
  );

  useClickAway(() => {
    setShow(false);
  }, awayRef);

  return show ? (
    <div className="menu-dialog" ref={awayRef}>
      <div className="items" ref={upRef}>
        <ArrowUpOutlined /> 插入最上 1 行
      </div>
      <div className="items" ref={downRef}>
        <ArrowDownOutlined /> 插入最下 1 行
      </div>
      <div className="items" ref={leftRef}>
        <ArrowLeftOutlined /> 插入最左 1 列
      </div>
      <div className="items" ref={rightRef}>
        <ArrowRightOutlined /> 插入最右 1 列
      </div>
    </div>
  ) : (
    <></>
  );
});

const render = createRender(AddMenuNode);

register({
  shape: "add-menu-react-node",
  render,
  data: {
    nodeType: "menuNode",
  },
});
