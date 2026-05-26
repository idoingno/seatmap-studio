import { Cell, CellView, Node, NodeView } from "@antv/x6";
import { useEffect, useMemo } from "react";
import { useGraphInstance } from "x6-graph/react";
import matrixToolsConfig from "./config/Tools/matrixToolsConfig";
import removeToolsConfig from "./config/Tools/removeToolsConfig";
import circleToolsConfig from "./config/Tools/circleToolsConfig";
import { chairSvg } from "./config/Markup/chair";
import { generatePersonnel, updateGraphics, updateNode } from "./utils/apiParams";
import { handleCpApi } from "./api";
import { Session, getGraph } from "./config";
import { patternSeat } from "./assets";
import store from "./store";
import { showCircleUpdateAction } from "./store/actionCreators";
import { showCard } from "./Components/ChairCard";
import { changeSeatChair, isOutChair, sliceText } from "./utils/util";
import { message } from "antd";

type C = {
  e?: Event | any;
  b?: number;
  node?: Node | any;
  view?: NodeView;
  cell?: CellView;
  current?: any;
  previous?: any;
};

export const GraphBehavior = (): any => {
  const graph = useGraphInstance();
  // 获取场次Id
  const sessionId = Session.getDataId;

  // TODO 这里拿到graph对象处理自己的逻辑（例如使用后端数据初始化画布，增加事件监听...）
  useMemo(() => {
    const added = (): void => undefined;
    const removed = (): void => undefined;

    graph.on("cell:removed", removed);

    graph.on("node:change:size", ({ node, options }) => {
      if (options.skipParentHandler) {
        return;
      }

      const children = node.getChildren();
      if (children && children.length) {
        node.prop("originSize", node.getSize());
      }
    });

    graph.on("node:mousedown", ({ e, node, view }: C) => {
      graph.disablePanning();
      // e.dataTransfer.effectAllowed = "copy";
      if (node.hasTool("button-remove")) {
        node.removeTool("button-remove");
      }
    });

    let pendingTransitionCleanup = false;
    graph.on("node:mousemove", ({ e, node, view }: C) => {
      if (pendingTransitionCleanup) return;

      pendingTransitionCleanup = true;
      requestAnimationFrame(() => {
        const allGdom: any = document.querySelectorAll(".x6-graph-svg-stage > g");

        for (const iterator of allGdom) {
          iterator.classList.remove("x6-transition");
        }
        pendingTransitionCleanup = false;
      });
    });

    const nodeResized = async ({ node }: C) => {
      // 更新图形组 父节点
      const graphicsParams = updateGraphics(node, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);
    };

    const change = async ({ node, current, previous }: C) => {
      if (!current.text.text) return;
      if (
        node.data.nodeType == "matrixRows" ||
        node.data.nodeType == "matrixRowsEn" ||
        node.data.nodeType == "matrixColumnTopNum" ||
        node.data.nodeType == "matrixColumnBottomNum"
      ) {
        const graph = getGraph();
        const nodes = graph.getNodes();

        const { nodeType } = node.data;

        // 更新文字
        // const nodeParams = updateNode([node], sessionId, node.parent);
        // await handleCpApi({ params: nodeParams, code: "seat" }, true);

        if (node.data.nodeType == "matrixRows" || node.data.nodeType == "matrixRowsEn") {
          const currentMatrixRows = nodes.filter(
            (ite: Node) => ite.data.nodeType === "matrixRows" && ite.data.idx === node.data.idx
          );
          const currentMatrixRowsEn = nodes.filter(
            (ite: Node) => ite.data.nodeType === "matrixRowsEn" && ite.data.idx === node.data.idx
          );
          // 单行
          const currentRowChair = nodes.filter(
            (item) => item.data.nodeType === "matrixChair" && item.data.idt.split("-")[0] === String(node.data.idx)
          );
          // let rowColumnArr = node.data.idt.split("-");

          let arr: any = [];
          currentRowChair.forEach((element) => {
            element.setData(getatrixSideName(node, nodeType));
            if (element.attrs.xnode) {
              const obj = {
                id: element.attrs.xnode.key,
                name: element.attrs.xnode.title,
                node: element,
              };
              arr.push(obj);
            }
          });

          if (arr.length > 0) {
            // 添加人员
            const personParams = generatePersonnel(arr);
            await handleCpApi({ params: personParams, code: "seat" }, true);
          }

          const allUpdateNode = [...currentRowChair, ...currentMatrixRows, ...currentMatrixRowsEn];

          // 更新文字
          const otherNodeParams = updateNode(allUpdateNode, sessionId, node.parent);
          await handleCpApi({ params: otherNodeParams, code: "seat" }, true);
        } else if (node.data.nodeType == "matrixColumnTopNum" || node.data.nodeType == "matrixColumnBottomNum") {
          const currentColumnChair: any[] = nodes.filter(
            (ite: Node) => ite.data.nodeType === "matrixChair" && ite.data.idt.split("-")[1] === String(node.data.idx)
          );

          // if (node.data.nodeType == "matrixColumnTopNum") {
          const currentColumnBottomText = nodes.find(
            (ite: Node) => ite.data.nodeType === "matrixColumnBottomNum" && ite.data.idx === node.data.idx
          );

          currentColumnBottomText.attr("text/text", node.attrs.text.text);
          // } else {
          const currentColumnTopText = nodes.find(
            (ite: Node) => ite.data.nodeType === "matrixColumnTopNum" && ite.data.idx === node.data.idx
          );

          currentColumnTopText.attr("text/text", node.attrs.text.text);
          // }

          let arr: any = [];
          currentColumnChair.forEach((element) => {
            element.setData(getatrixTopBotName(node));
            if (element.attrs.xnode) {
              const obj = {
                id: element.attrs.xnode.key,
                name: element.attrs.xnode.title,
                node: element,
              };
              arr.push(obj);
            }
          });

          if (arr.length > 0) {
            // 添加人员
            const personParams = generatePersonnel(arr);
            await handleCpApi({ params: personParams, code: "seat" }, true);
          }

          const allUpdateNode = [currentColumnBottomText, currentColumnTopText, ...currentColumnChair];
          // 更新文字
          const otherNodeParams = updateNode(allUpdateNode, sessionId, node.parent);
          await handleCpApi({ params: otherNodeParams, code: "seat" }, true);
        }
      } else if (
        node.data.nodeType == "windowNode" ||
        node.data.nodeType == "doorNode" ||
        node.data.nodeType == "prosceniumNode"
      ) {
        // 更新图形组 父节点
        const graphicsParams = updateGraphics(node, sessionId);
        await handleCpApi({ params: graphicsParams, code: "seat" }, true);
      }
    };

    const getatrixSideName = (node: Node, nodeType: string) => {
      if (nodeType === "matrixRows") {
        return { matrixChairName: node.attrs.text.text };
      } else {
        return { matrixChairNameEn: node.attrs.text.text };
      }
    };

    const getatrixTopBotName = (node: Node) => {
      return { matrixChairTopName: node.attrs.text.text, matrixChairBottomName: node.attrs.text.text };
    };

    const nodeClick = async ({ e, node, view }: C) => {
      if (!node || !node.data) return;
      const { nodeType, visible } = node.data;

      if ((nodeType === "matrixChair" && !visible) || (nodeType === "circleChair" && !visible)) {
        node.setMarkup([
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
        ]);

        node.attr("svg/fill", "#FFFFFF");
        node.attr("svg/style", "display:block");
        node.attr("image", {
          width: 40,
          y: 3,
          style: {
            display: "none",
          },
          "xlink:href": patternSeat,
        });

        node.data = {
          disableMove: true,
          nodeType: nodeType,
          visible: true,
        };

        // 更新子节点节点
        const nodeParams = updateNode([node], sessionId, node.parent);
        await handleCpApi({ params: nodeParams, code: "seat" }, true);
      }

      if (nodeType && nodeType.includes("Chair") && node.attrs.text.text) {
        if (node.attrs && node.attrs.xnode && node.attrs.xnode.key) {
          let seatData = "";
          // let rowColumnArr = nodeType === "matrixChair" ? node.data.idt.split("-") : [];
          if (node.data.nodeType === "circleChair") {
            seatData = node.parent.data.tableName || node.data.tableName;
          } else if (node.data.nodeType === "matrixChair") {
            seatData = `${node.data.matrixChairName} - ${node.data.matrixChairTopName}座 / ${node.data.matrixChairNameEn} - ${node.data.matrixChairBottomName}`;
          }

          const scale = graph.zoom();
          const { tx, ty } = graph.translate();

          showCard({
            left: `${node.getPosition().x * scale + tx + 256}px`,
            top: `${(node.getPosition().y + 40) * scale + ty + 48}px`,
            title: (node.attrs && node.attrs.xnode && node.attrs.xnode.title) || "姓名",
            subTitle: (node.attrs && node.attrs.xnode && node.attrs.xnode.subTitle) || "职业",
            otherName: node.attrs.xnode.otherName || "",
            seatData: seatData,
          });
        }
      }
    };

    const nodeMouseenter = ({ e, node, view, cell }: C) => {
      if (!node || !node.data) return;
      const { nodeType, visible } = node.data;
      matrixToolsConfig({ e, node, view, cell });
      removeToolsConfig({ e, node, view, cell });
      circleToolsConfig({ e, node, view, cell });

      if (nodeType === "matrixContainer" || nodeType === "circleContainer") {
        node.attr("body/stroke", "#c2c2c250");
        node.attr("body/fill", "#ffffff50");
      }
    };

    const nodeMouseup = async ({ e, node, view }: C) => {
      const nodeType = node.data.nodeType;
      graph.enablePanning();

      if (nodeType === "circleChair" || nodeType === "matrixChair") {
        if (!node.attrs.xnode) return;

        const nodes = graph.getNodes();
        const p1 = graph.pageToLocal(e.clientX, e.clientY);
        const chairArr = nodes.filter(
          (item: Node) => item.data.nodeType === "matrixChair" || item.data.nodeType === "circleChair"
        );
        const { flag, element }: any = isOutChair(p1, chairArr);

        if (flag) {
          if (element.data.visible) {
            if (element.attrs.xnode) {
              if (element.attrs.xnode.key === node.attrs.xnode.key) return;

              const newElementXnode: any = { ...element.attrs.xnode };
              const newElementSvg = { ...element.attrs.svg };
              const newElementImage = { ...element.attrs.image };

              const newNodeXnode = { ...node.attrs.xnode };
              const newNodeSvg = { ...node.attrs.svg };
              const newNodeImage = { ...node.attrs.image };

              node.attr({
                xnode: newElementXnode,
                text: {
                  text: sliceText(newElementXnode.title),
                  fill: "#FFFFFF",
                },
                svg: newElementSvg,
                image: newElementImage,
              });
              element.attr({
                xnode: newNodeXnode,
                text: {
                  text: sliceText(newNodeXnode.title),
                  fill: "#FFFFFF",
                },
                svg: newNodeSvg,
                image: newNodeImage,
              });

              const arr: any = [
                {
                  id: newElementXnode.key,
                  node: node,
                },
                {
                  id: newNodeXnode.key,
                  node: element,
                },
              ];

              // 添加人员
              const nodeParams = generatePersonnel(arr);
              await handleCpApi({ params: nodeParams, code: "seat" }, true);
            } else {
              // 换到空位置
              changeSeatChair(element, node.attrs.xnode);

              graph.unselect(element);

              node.setMarkup([
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
              ]);

              node.attr("svg/fill", "#FFFFFF");
              node.attr("svg/style", "display:block");
              node.attr("image", {
                width: 40,
                y: 3,
                style: {
                  display: "none",
                },
                "xlink:href": patternSeat,
              });
              node.attr("text/text", "");

              node.data = {
                disableMove: true,
                nodeType: nodeType,
                visible: true,
              };

              const arr: any = [
                {
                  id: node.attrs.xnode.key,
                  name: node.attrs.xnode.title,
                  node: element,
                },
              ];

              // 添加人员
              const nodeParams = generatePersonnel(arr);
              await handleCpApi({ params: nodeParams, code: "seat" }, true);

              node.removeAttrByPath("xnode");
            }
          } else {
            message.error("此位置不能添加位置！");
          }
        }
      }
    };

    const nodeMoved = async ({ e, node, view }: C) => {
      // 移动图形组
      if (node.data.nodeType === "matrixContainer" || node.data.nodeType === "circleContainer") {
        // 更新图形组 父节点
        const graphicsParams = updateGraphics(node, sessionId);
        await handleCpApi({ params: graphicsParams, code: "seat" }, true);

        // 更新子节点
        const nodeParams = updateNode(node.children, sessionId, node);
        await handleCpApi({ params: nodeParams, code: "seat" }, true);
      } else if (
        node.data.nodeType === "windowNode" ||
        node.data.nodeType === "prosceniumNode" ||
        node.data.nodeType === "doorNode"
      ) {
        // 更新图形组 窗户/舞台
        const graphicsParams = updateGraphics(node, sessionId);
        await handleCpApi({ params: graphicsParams, code: "seat" }, true);
      }
    };

    const nodeMouseleave = ({ node }: C) => {
      if (!node || !node.data) return;
      // const { nodeType, visible } = node.data;
      // const nodeType = node.data.nodeType;
      // if (nodeType === "matrixChair") {
      //   node.removeTools();
      // }
      if (node.hasTool("button-remove")) {
        node.removeTool("button-remove");
      }
      if (node.hasTool("button")) {
        node.removeTool("button");
      }

      // if (nodeType && nodeType.includes("RowSpace")) {
      //   // if (nodeType === "Aisle") {
      //   node.attr("body/fill", "transparent");
      //   let idx = node.data.idx;
      //   //     setSpaceIdx(idx)
      //   // } else {
      //   //     setSpaceIdx('')
      //   // }
      // }
    };

    const nodeDblClick = ({ e, node, view, cell }: C) => {
      if (node.data && node.data.nodeType === "circleTable") {
        store.dispatch(
          showCircleUpdateAction({
            show: true,
            tableName: node.data.tableName,
            tableNameEn: `Table ${node.data.tableName.replace("号桌", "")}`,
            nodeType: node.data.nodeType,
            id: node.id,
          })
        );
      }
    };

    // graph.on("node:added", nodeAdded);
    graph.on("node:click", nodeClick);
    graph.on("node:mouseenter", nodeMouseenter);
    graph.on("node:mouseup", nodeMouseup);
    graph.on("node:mouseleave", nodeMouseleave);
    graph.on("node:change:parent", () => {});
    graph.on("node:moved", nodeMoved);
    graph.on("node:change:attrs", change);
    graph.on("node:dblclick", nodeDblClick);
    graph.on("node:resized", nodeResized);

    // 移除监听
    return () => {
      graph.off("cell:added", added);
      graph.off("cell:removed", removed);
      // graph.off("cell:change:*", change);
      // graph.off("node:added", nodeAdded);
      graph.off("node:click", nodeClick);
      graph.off("node:mouseenter", nodeMouseenter);
      graph.off("node:mouseup", nodeMouseup);
      graph.off("node:mouseleave", nodeMouseleave);
      graph.off("node:moved", nodeMoved);
      graph.off("node:change:attrs", change);
      graph.off("node:resized", nodeResized);
    };
  }, []);
  return null;
};
