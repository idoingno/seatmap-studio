import { CellView, Node, NodeView } from "@antv/x6";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useGraphInstance } from "x6-graph/react";
import matrixToolsConfig from "./config/Tools/matrixToolsConfig";
import removeToolsConfig from "./config/Tools/removeToolsConfig";
import circleToolsConfig from "./config/Tools/circleToolsConfig";
import { chairSvg } from "./config/Markup/chair";
import { generatePersonnel } from "./utils/apiParams";
import { updateGraphicsForParent, updateNodesForParent } from "./services/graphService";
import { handleCpApi } from "./api";
import { patternSeat } from "./assets";
import store from "./store";
import { showCircleUpdateAction } from "./store/actionCreators";
import { showCard } from "./Components/ChairCard";
import { changeSeatChair, getNodeChildren, isOutChair, sliceText } from "./utils/util";
import { isLargeGraphMode, syncGraphPerformanceMode } from "./utils/graphPerformance";
import { message } from "./utils/message";
import { markLocalGraphMutation } from "./utils/querySync";

type C = {
  e?: Event | any;
  b?: number;
  node?: Node | any;
  view?: NodeView;
  cell?: CellView;
  current?: any;
  previous?: any;
};

type MatrixNodeIndex = {
  chairsByColumn: Map<number, Node[]>;
  chairsByRow: Map<number, Node[]>;
  columnBottomTextByIdx: Map<number, Node>;
  columnTopTextByIdx: Map<number, Node>;
  rowTextByIdx: Map<number, Node>;
  rowTextEnByIdx: Map<number, Node>;
};

const buildMatrixNodeIndex = (parent: Node | null | undefined): MatrixNodeIndex => {
  const index: MatrixNodeIndex = {
    chairsByColumn: new Map(),
    chairsByRow: new Map(),
    columnBottomTextByIdx: new Map(),
    columnTopTextByIdx: new Map(),
    rowTextByIdx: new Map(),
    rowTextEnByIdx: new Map(),
  };

  const children = getNodeChildren(parent);
  for (const child of children) {
    const childNode = child as Node;
    const nodeData = childNode.data;
    const idx = Number(nodeData?.idx);

    switch (nodeData?.nodeType) {
      case "matrixRows":
        index.rowTextByIdx.set(idx, childNode);
        break;
      case "matrixRowsEn":
        index.rowTextEnByIdx.set(idx, childNode);
        break;
      case "matrixColumnTopNum":
        index.columnTopTextByIdx.set(idx, childNode);
        break;
      case "matrixColumnBottomNum":
        index.columnBottomTextByIdx.set(idx, childNode);
        break;
      case "matrixChair": {
        const [rowKey, columnKey] = String(nodeData.idt ?? "-").split("-");
        const rowIndex = Number(rowKey);
        const columnIndex = Number(columnKey);

        if (!Number.isNaN(rowIndex)) {
          const currentRow = index.chairsByRow.get(rowIndex) ?? [];
          currentRow.push(childNode);
          index.chairsByRow.set(rowIndex, currentRow);
        }

        if (!Number.isNaN(columnIndex)) {
          const currentColumn = index.chairsByColumn.get(columnIndex) ?? [];
          currentColumn.push(childNode);
          index.chairsByColumn.set(columnIndex, currentColumn);
        }
        break;
      }
      default:
        break;
    }
  }

  return index;
};

export const GraphBehavior = (): any => {
  const graph = useGraphInstance();
  // 获取场次Id（响应式订阅：宿主切换场次时下方 effect 会随依赖重绑事件）
  const sessionId = useSelector((state: any) => state.runtime.sessionId);

  // TODO 这里拿到graph对象处理自己的逻辑（例如使用后端数据初始化画布，增加事件监听...）
  useEffect(() => {
    let pendingPerformanceSync = false;

    const schedulePerformanceSync = () => {
      if (pendingPerformanceSync) {
        return;
      }

      pendingPerformanceSync = true;
      requestAnimationFrame(() => {
        pendingPerformanceSync = false;
        syncGraphPerformanceMode(graph);
      });
    };
    const handleNodeChangeSize = ({ node, options }: any) => {
      if (options.skipParentHandler) {
        return;
      }

      const children = node.getChildren();
      if (children && children.length) {
        node.prop("originSize", node.getSize());
      }
    };

    const handleNodeMouseDown = ({ e, node, view }: C) => {
      // e.dataTransfer.effectAllowed = "copy";
      if (node.hasTool("button-remove")) {
        node.removeTool("button-remove");
      }
    };

    // x6-html-shape 的两个位置同步缺口：
    // 1) htmlContainer 矩阵只在 translate/scale/node:change:position 时同步，
    //    首个 HTML 节点挂载瞬间若画布已平移/缩放，菜单会出现在错误位置直到下次交互。
    // 2) 组件容器初次挂载时（confirmUpdate）组件还没创建，updateContainerStyle 没有执行过，
    //    挂载后 CSS transform 缺失，直到下一次视图更新才跳回正确位置。
    // 这里在节点加入后兜底同步图层矩阵并强制刷新所有 HTML 视图。
    // 递归定时的句柄保存在 htmlLayerSyncTimer，useEffect 卸载时统一清理，避免卸载后持续刷新。
    let pendingHtmlLayerSync = false;
    let htmlLayerSyncTimer: number | undefined;
    const refreshHtmlViews = () => {
      for (const htmlNode of graph.getNodes()) {
        if ((htmlNode as any).view === "html-shape-view") {
          const htmlView = graph.findViewByCell(htmlNode) as any;
          htmlView?.updateTransform?.();
        }
      }
    };

    const syncHtmlLayer = (remaining = 8) => {
      const htmlContainer = (graph as any).htmlContainer as HTMLElement | undefined;
      if (htmlContainer) {
        const matrix = graph.transform.getMatrix();
        const zoom = graph.transform.getZoom();
        const { offsetWidth, offsetHeight } = graph.container;
        htmlContainer.style.transform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e}, ${matrix.f})`;
        htmlContainer.style.width = zoom !== 1 ? `${offsetWidth / zoom}px` : "100%";
        htmlContainer.style.height = zoom !== 1 ? `${offsetHeight / zoom}px` : "100%";
      }
      refreshHtmlViews();

      if (remaining > 0) {
        // 组件挂载是异步的（react render），多刷几轮覆盖挂载完成的时机
        htmlLayerSyncTimer = window.setTimeout(() => syncHtmlLayer(remaining - 1), 60);
      } else {
        htmlLayerSyncTimer = undefined;
        pendingHtmlLayerSync = false;
      }
    };

    const scheduleHtmlLayerSync = ({ node }: C) => {
      if (pendingHtmlLayerSync || (node as any)?.view !== "html-shape-view") {
        return;
      }
      pendingHtmlLayerSync = true;
      syncHtmlLayer();
    };

    let pendingTransitionCleanup = false;
    const handleNodeMouseMove = ({ e, node, view }: C) => {
      if (pendingTransitionCleanup || isLargeGraphMode(graph)) return;

      pendingTransitionCleanup = true;
      requestAnimationFrame(() => {
        const allGdom: any = document.querySelectorAll(".x6-graph-svg-stage > g");

        for (const iterator of allGdom) {
          iterator.classList.remove("x6-transition");
        }
        pendingTransitionCleanup = false;
      });
    };

    // PanningManager 默认同时监听 node/edge:unhandled:mousedown，
    // 会让不可移动节点（座位）上的左键手势触发画布平移，抢占换座/拖拽手势。
    // 仅保留 blank:mousedown 平移，节点上的左键手势交还给节点事件。
    const panningManager = (graph as any).panning;
    if (panningManager?.onMouseDown) {
      graph.off("node:unhandled:mousedown", panningManager.onMouseDown, panningManager);
      graph.off("edge:unhandled:mousedown", panningManager.onMouseDown, panningManager);
    }

    graph.on("cell:added", schedulePerformanceSync);
    graph.on("cell:removed", schedulePerformanceSync);
    graph.on("node:added", scheduleHtmlLayerSync);
    graph.on("node:change:size", handleNodeChangeSize);
    graph.on("node:mousedown", handleNodeMouseDown);
    graph.on("node:mousemove", handleNodeMouseMove);

    const nodeResized = async ({ node }: C) => {
      markLocalGraphMutation();
      // 更新图形组 父节点
      await updateGraphicsForParent(node, sessionId);
    };

    const change = async ({ node, current, previous }: C) => {
      if (!current.text.text) return;
      if (
        node.data.nodeType == "matrixRows" ||
        node.data.nodeType == "matrixRowsEn" ||
        node.data.nodeType == "matrixColumnTopNum" ||
        node.data.nodeType == "matrixColumnBottomNum"
      ) {
        const { nodeType } = node.data;
        const parentNode = (node.parent as Node | undefined) ?? null;
        const matrixIndex = buildMatrixNodeIndex(parentNode);

        if (node.data.nodeType == "matrixRows" || node.data.nodeType == "matrixRowsEn") {
          const rowIndex = Number(node.data.idx);
          const currentMatrixRow = matrixIndex.rowTextByIdx.get(rowIndex);
          const currentMatrixRowEn = matrixIndex.rowTextEnByIdx.get(rowIndex);
          const currentRowChair = matrixIndex.chairsByRow.get(rowIndex) ?? [];

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

          const allUpdateNode = [currentMatrixRow, currentMatrixRowEn, ...currentRowChair].filter(Boolean) as Node[];

          // 更新文字
          await updateNodesForParent(allUpdateNode, sessionId, node.parent);
        } else if (node.data.nodeType == "matrixColumnTopNum" || node.data.nodeType == "matrixColumnBottomNum") {
          const columnIndex = Number(node.data.idx);
          const currentColumnChair = matrixIndex.chairsByColumn.get(columnIndex) ?? [];

          const currentColumnBottomText = matrixIndex.columnBottomTextByIdx.get(columnIndex);

          currentColumnBottomText?.attr("text/text", node.attrs.text.text);
          const currentColumnTopText = matrixIndex.columnTopTextByIdx.get(columnIndex);

          currentColumnTopText?.attr("text/text", node.attrs.text.text);

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

          const allUpdateNode = [currentColumnBottomText, currentColumnTopText, ...currentColumnChair].filter(
            Boolean
          ) as Node[];
          // 更新文字
          await updateNodesForParent(allUpdateNode, sessionId, node.parent);
        }
      } else if (
        node.data.nodeType == "windowNode" ||
        node.data.nodeType == "doorNode" ||
        node.data.nodeType == "prosceniumNode"
      ) {
        // 更新图形组 父节点
        await updateGraphicsForParent(node, sessionId);
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
        await updateNodesForParent([node], sessionId, node.parent);
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

          const cardAnchor = graph.localToClient(
            node.getPosition().x + node.getSize().width / 2,
            node.getPosition().y + node.getSize().height
          );
          const cardWidth = 260;
          const cardHeight = 132;

          showCard({
            left: `${Math.min(Math.max(12, cardAnchor.x - 20), window.innerWidth - cardWidth - 12)}px`,
            top: `${Math.min(Math.max(12, cardAnchor.y + 8), window.innerHeight - cardHeight - 12)}px`,
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
      const { nodeType } = node.data;
      matrixToolsConfig({ e, node, view, cell });
      removeToolsConfig({ e, node, view, cell });
      circleToolsConfig({ e, node, view, cell });

      if (nodeType === "matrixContainer") {
        node.attr("body/stroke", "rgba(25, 118, 111, 0.46)");
      } else if (nodeType === "circleContainer") {
        node.attr("body/stroke", "rgba(25, 118, 111, 0.34)");
        node.attr("body/fill", "rgba(25, 118, 111, 0.035)");
      }
    };

    const nodeMouseup = async ({ e, node, view }: C) => {
      const nodeType = node.data.nodeType;

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
      markLocalGraphMutation();
      // 移动图形组
      if (node.data.nodeType === "matrixContainer" || node.data.nodeType === "circleContainer") {
        // 更新图形组 父节点
        await updateGraphicsForParent(node, sessionId);

        // 更新子节点
        await updateNodesForParent(getNodeChildren(node), sessionId, node);
      } else if (
        node.data.nodeType === "windowNode" ||
        node.data.nodeType === "prosceniumNode" ||
        node.data.nodeType === "doorNode"
      ) {
        // 更新图形组 窗户/舞台
        await updateGraphicsForParent(node, sessionId);
      }
    };

    const nodeMouseleave = ({ node }: C) => {
      if (!node || !node.data) return;
      const { nodeType } = node.data;
      if (nodeType === "matrixContainer") {
        node.attr("body/stroke", "rgba(25, 118, 111, 0.22)");
        node.attr("body/fill", "rgba(25, 118, 111, 0.035)");
      } else if (nodeType === "circleContainer") {
        node.attr("body/stroke", "transparent");
        node.attr("body/fill", "rgba(25, 118, 111, 0.02)");
      }
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
    graph.on("node:moved", nodeMoved);
    graph.on("node:change:attrs", change);
    graph.on("node:dblclick", nodeDblClick);
    graph.on("node:resized", nodeResized);

    // 移除监听
    return () => {
      // 清理 syncHtmlLayer 递归定时器，防止卸载后继续刷新视图
      if (htmlLayerSyncTimer !== undefined) {
        window.clearTimeout(htmlLayerSyncTimer);
        htmlLayerSyncTimer = undefined;
      }
      pendingHtmlLayerSync = false;
      graph.off("cell:added", schedulePerformanceSync);
      graph.off("cell:removed", schedulePerformanceSync);
      graph.off("node:added", scheduleHtmlLayerSync);
      graph.off("node:change:size", handleNodeChangeSize);
      graph.off("node:mousedown", handleNodeMouseDown);
      graph.off("node:mousemove", handleNodeMouseMove);
      // graph.off("cell:change:*", change);
      // graph.off("node:added", nodeAdded);
      graph.off("node:click", nodeClick);
      graph.off("node:mouseenter", nodeMouseenter);
      graph.off("node:mouseup", nodeMouseup);
      graph.off("node:mouseleave", nodeMouseleave);
      graph.off("node:moved", nodeMoved);
      graph.off("node:change:attrs", change);
      graph.off("node:dblclick", nodeDblClick);
      graph.off("node:resized", nodeResized);
    };
  }, [sessionId]);
  return null;
};
