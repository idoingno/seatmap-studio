import { register } from "x6-html-shape";
import createRender from "x6-html-shape/dist/react17";
import React, { memo, useRef, useState } from "react";
import { MATRIX_OFFSET_DISTANCE, MATRIX_OFFSET_SIZE_DISTANCE } from "../../GlobalVar";
import { useClickAway, useEventListener } from "ahooks";
import { MatrixAllRowsOrColumns, MatrixSize, Session, getGraph } from "../../config";
import type { Node } from "@antv/x6";
import { resizeProscenium, resizeWindow, setAllCorridorColumnH } from "../../utils/util";
import SvgIcon from "../../Components/SvgIcon";
import { message } from "antd";
import { delNode, delPersonnel, updateGraphics, updateNode } from "../../utils/apiParams";
import { handleCpApi } from "../../api";
import store from "../../store/index";
import { subAction } from "../../store/actionCreators";

export const MinusMenuNode = memo(() => {
  const [show, setShow] = useState(true);
  const upRef = useRef(null);
  const downRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const awayRef = useRef(null);

  useEventListener(
    "click",
    async () => {
      console.log("删除最上 1 行");
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      console.log("获取所有节点----------->", nodes);

      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有行
      const rows = parent.data.rows;

      if (rows <= 2) {
        message.error("至少保留二行");
        return;
      }

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
      // 过滤出添加过人的节点
      const hasPeronArr = nodes.filter(
        (item) => item.attrs.xnode && item.data.nodeType === "matrixChair" && item.data.idt.split("-")[0] === "0"
      );

      const removeArr = [...firstRowText, ...firstRowEnText, ...firstRowChair, ...firstRowSpace];

      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      // 更改父节点高度
      const { width, height } = parent.size();
      const fs = firstRowSpace[0].size();
      const pHeight = height - (fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE);
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      // resizeWindow(pHeight);

      MatrixSize.setMh = pHeight;

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
      console.log("filterNode", filterNode);

      for (let i = 0; i < filterNode.length; i++) {
        const element = filterNode[i];
        let { x, y } = element.getPosition();
        const idArr = element.data.idt && element.data.idt.split("-");
        if (element.data.nodeType === "matrixRows") {
          // element.setProp({ label: `第${Number(idArr[1])}排` });
          element.setData({ idx: element.data.idx - 1, idt: `row-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixRowsEn") {
          // element.setProp({ label: `Row ${Number(idArr[1])}` });
          element.setData({ idx: element.data.idx - 1, idt: `rowEn-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          element.setData({ idx: element.data.idx - 1, idt: `${Number(idArr[0]) - 1}-${idArr[1]}` });
        } else if (element.data.nodeType === "aisleRowSpace") {
          element.setData({ idx: element.data.idx - 1, idt: `aisleRowSpace-${Number(idArr[1]) - 1}` });
        }

        element.position(x, y - (fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE));
      }

      // MatrixAllRowsOrColumns.setAllRows = rows - 1;
      parent.setData({
        rows: rows - 1,
      });

      // const nodesss = graph.getNodes();
      // console.log("获取所有节点----------->", nodesss);

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      // 删除节点
      const delNodeParams = delNode(removeArr, sessionId);
      await handleCpApi({ params: delNodeParams, code: "seat" }, true);

      if (hasPeronArr && hasPeronArr.length > 0) {
        // 人员删除
        // const personParams = delPersonnel(hasPeronArr);
        // handleCpApi({ params: personParams, code: "seat" }, true);

        for (let i = 0; i < hasPeronArr.length; i++) {
          const element: any = hasPeronArr[i];
          store.dispatch(subAction(element.attrs.xnode.key));
        }
      }
    },
    { target: upRef }
  );

  useEventListener(
    "click",
    async () => {
      console.log("删除最下 1 行");
      // 获取场次Id
      const sessionId = Session.getDataId;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      console.log("获取所有节点----------->", nodes);

      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有行
      const rows = parent.data.rows;

      if (rows <= 2) {
        message.error("至少保留二行");
        return;
      }

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

      // 过滤出添加过人的节点
      const hasPeronArr = nodes.filter(
        (item) =>
          item.attrs.xnode &&
          item.data.nodeType === "matrixChair" &&
          item.data.idt.split("-")[0] === (rows - 1).toString()
      );

      const removeArr = [...lastRowText, ...lastRowEnText, ...lastRowChair, ...lastRowSpace];

      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      // 更改父节点高度
      const { width, height } = parent.size();
      const fs = lastRowSpace[0].size();
      const pHeight = height - (fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE);
      parent.setProp({
        size: {
          width: width,
          height: pHeight,
        },
      });

      // resizeWindow(pHeight);

      MatrixSize.setMh = pHeight;

      // 设置所有列间隙高度
      setAllCorridorColumnH(nodes, "corridorColumnSpace", pHeight);

      lastMatrixBottomNum.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x, y - (fs.height > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE));
      });

      // MatrixAllRowsOrColumns.setAllRows = rows - 1;
      parent.setData({
        rows: rows - 1,
      });

      // const nodesss = graph.getNodes();
      // console.log("获取所有节点----------->", nodesss);

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      // 删除节点
      const delNodeParams = delNode(removeArr, sessionId);
      await handleCpApi({ params: delNodeParams, code: "seat" }, true);

      if (hasPeronArr && hasPeronArr.length > 0) {
        // 人员删除
        // const personParams = delPersonnel(hasPeronArr);
        // handleCpApi({ params: personParams, code: "seat" }, true);

        for (let i = 0; i < hasPeronArr.length; i++) {
          const element: any = hasPeronArr[i];
          store.dispatch(subAction(element.attrs.xnode.key));
        }
      }
    },
    { target: downRef }
  );

  useEventListener(
    "click",
    async () => {
      console.log("删除最左 1 行");
      // 获取场次Id
      const sessionId = Session.getDataId;

      // const columns = MatrixAllRowsOrColumns.getAllColumns;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      console.log("获取所有节点----------->", nodes);

      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];

      // 获取所有列
      const columns = parent.data.columns;

      if (columns <= 2) {
        message.error("至少保留2列");
        return;
      }

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

      // 过滤出添加过人的节点
      const hasPeronArr = nodes.filter(
        (item) => item.attrs.xnode && item.data.nodeType === "matrixChair" && item.data.idt.split("-")[1] === "0"
      );

      const removeArr = [...firstColumnTopText, ...firstColumnBottomText, ...firstColumnChair, ...firstColumnsSpace];

      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      // 更改父节点高度
      const { width, height } = parent.size();
      const fs = firstColumnsSpace[0].size();
      const pWidth = width - (fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE);
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      // resizeProscenium(pWidth);

      MatrixSize.setMw = pWidth;

      const filterNode = nodes.filter((ite: Node) => {
        return (
          ite.data &&
          ite.data.idt &&
          ite.data.nodeType !== "matrixRows" &&
          ite.data.nodeType !== "matrixContainer" &&
          !ite.data.idt.includes("aisleRowSpace")
        );
      });
      console.log("filterNode", filterNode);
      for (let i = 0; i < filterNode.length; i++) {
        const element = filterNode[i];
        let { x, y } = element.getPosition();
        const idArr = element.data.idt && element.data.idt.split("-");

        if (element.data.nodeType === "matrixColumnTopNum") {
          // element.setProp({ label: `${Number(idArr[1])}` });
          element.setData({ idx: element.data.idx - 1, idt: `matrixColumnTopNum-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixColumnBottomNum") {
          // element.setProp({ label: `${Number(idArr[1])}` });
          element.setData({ idx: element.data.idx - 1, idt: `matrixColumnBottomNum-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "matrixChair") {
          console.log("idArr", idArr);
          element.setData({ idx: element.data.idx - 1, idt: `${idArr[0]}-${Number(idArr[1]) - 1}` });
        } else if (element.data.nodeType === "corridorColumnSpace") {
          element.setData({ idx: element.data.idx - 1, idt: `corridorColumnSpace-${Number(idArr[1]) - 1}` });
        }

        element.position(x - (fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE), y);
      }

      // 设置所有行间隙高度
      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

      // MatrixAllRowsOrColumns.setAllColumns = columns - 1;
      parent.setData({ columns: columns - 1 });

      // const nodesss = graph.getNodes();
      // console.log("获取所有节点----------->", JSON.stringify(nodesss));

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      // 删除节点
      const delNodeParams = delNode(removeArr, sessionId);
      await handleCpApi({ params: delNodeParams, code: "seat" }, true);

      if (hasPeronArr && hasPeronArr.length > 0) {
        // 人员删除
        // const personParams = delPersonnel(hasPeronArr);
        // handleCpApi({ params: personParams, code: "seat" }, true);

        for (let i = 0; i < hasPeronArr.length; i++) {
          const element: any = hasPeronArr[i];
          store.dispatch(subAction(element.attrs.xnode.key));
        }
      }
    },
    { target: leftRef }
  );

  useEventListener(
    "click",
    async () => {
      console.log("删除最右 1 行");
      // 获取场次Id
      const sessionId = Session.getDataId;

      // const columns = MatrixAllRowsOrColumns.getAllColumns;

      const graph = getGraph();

      // 获取所有节点
      const nodes = graph.getNodes();
      console.log("获取所有节点----------->", nodes);

      const parent = nodes.filter((ite: Node) => ite.data.nodeType === "matrixContainer")[0];
      // 获取所有列
      const columns = parent.data.columns;

      if (columns <= 2) {
        message.error("至少保留2列");
        return;
      }

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
      // 过滤出添加过人的节点
      const hasPeronArr = nodes.filter(
        (item) =>
          item.attrs.xnode &&
          item.data.nodeType === "matrixChair" &&
          item.data.idt.split("-")[1] === (columns - 1).toString()
      );

      const removeArr = [...lastColumnsTopText, ...lastColumnsBottomText, ...lastRowChair, ...lastRowSpace];

      for (let i = 0; i < removeArr.length; i++) {
        const element = removeArr[i];
        parent.removeChild(element);
      }

      // 更改父节点高度
      const { width, height } = parent.size();
      const fs = lastRowSpace[0].size();
      const pWidth = width - (fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE);
      parent.setProp({
        size: {
          width: pWidth,
          height: height,
        },
      });

      // resizeProscenium(pWidth);

      MatrixSize.setMw = pWidth;

      // 设置所有行间隙高度
      setAllCorridorColumnH(nodes, "aisleRowSpace", pWidth);

      lastColumns.forEach((element) => {
        const { x, y } = element.getPosition();
        element.position(x - (fs.width > 6 ? MATRIX_OFFSET_SIZE_DISTANCE : MATRIX_OFFSET_DISTANCE), y);
      });

      // MatrixAllRowsOrColumns.setAllColumns = columns - 1;
      parent.setData({ columns: columns - 1 });

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      // 更新子节点
      const nodeParams = updateNode(parent.children, sessionId, parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      // 删除节点
      const delNodeParams = delNode(removeArr, sessionId);
      await handleCpApi({ params: delNodeParams, code: "seat" }, true);

      if (hasPeronArr && hasPeronArr.length > 0) {
        // 人员删除
        // const personParams = delPersonnel(hasPeronArr);
        // handleCpApi({ params: personParams, code: "seat" }, true);

        for (let i = 0; i < hasPeronArr.length; i++) {
          const element: any = hasPeronArr[i];
          store.dispatch(subAction(element.attrs.xnode.key));
        }
      }
    },
    { target: rightRef }
  );

  useClickAway(() => {
    setShow(false);
  }, awayRef);

  return show ? (
    <div className="menu-dialog" ref={awayRef}>
      <div className="items" ref={upRef}>
        <SvgIcon svgName="del-top" color="#000000" /> 删除最上 1 行
      </div>
      <div className="items" ref={downRef}>
        <SvgIcon svgName="del-bottom" color="#000000" /> 删除最下 1 行
      </div>
      <div className="items" ref={leftRef}>
        <SvgIcon svgName="del-left" color="#000000" /> 删除最左 1 列
      </div>
      <div className="items" ref={rightRef}>
        <SvgIcon svgName="del-right" color="#000000" /> 删除最右 1 列
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
  data: {
    nodeType: "menuNode",
  },
});
