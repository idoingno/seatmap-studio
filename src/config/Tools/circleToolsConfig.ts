import { CellView, Graph, Node, NodeView } from "@antv/x6";
import { getGraph } from "../graphInstance";
import { Modal } from "antd";
import { CHAIR_SIZE, PARENT_EXTRA_SPACE } from "../../GlobalVar";
import { delGraphics, delNode, updateGraphics, updateNode } from "../../utils/apiParams";
import { handleCpApi } from "../../api";
import store from "../../store";
import { getRuntime } from "../../store/accessors";
import { addDargAction, subAction } from "../../store/actionCreators";
import { getNodeChildren } from "../../utils/util";
import { message } from "../../utils/message";
import { markLocalGraphMutation } from "../../utils/querySync";

interface ConfigProps {
  e?: Event | any;
  cell?: CellView;
  node?: Node | any;
  view: NodeView;
}

const circleToolsConfig = ({ e, node, view, cell }: ConfigProps) => {
  let nodeType = node.data.nodeType;
  if (nodeType === "circleContainer") {
    node.addTools({
      name: "button",
      args: {
        markup: [
          {
            tagName: "text",
            textContent: "+",
            attrs: {
              class: "circle_chair_increase_icon",
              fontSize: 20, //10
              cursor: "pointer",
              x: -75,
              fill: "#19766f",
              // textAnchor: 'middle',
              // pointerEvents: 'none',
            },
          },
          {
            tagName: "text",
            textContent: "-",
            attrs: {
              class: "circle_chair_decrease_icon",
              fontSize: 20,
              cursor: "pointer",
              x: -50,
              y: 0,
              fill: "#19766f",
            },
          },
          {
            tagName: "text",
            textContent: "✕",
            attrs: {
              class: "circle_chair_remove_icon",
              fontSize: 12,
              fontWeight: "bold",
              cursor: "pointer",
              x: -25,
              y: 0,
              fill: "#a64f48",
            },
          },
        ],
        x: "100%",
        y: 0,
        async onClick({ e, cell }: ConfigProps) {
          // 获取场次Id
          const sessionId = getRuntime().sessionId;

          const graph = getGraph();

          if (e.target.innerHTML === "+") {
            markLocalGraphMutation();
            let { circleChairNum } = node.data;
            if (circleChairNum >= 30) {
              message.warning("椅子最多30个");
              return;
            } else {
              const chair = graph.addNode({
                shape: "circle-chair-node",
              });

              node.addChild(chair);

              computeCirclePosition(graph, node, "add", circleChairNum);
              // 更新图形组 父节点
              const graphicsParams = updateGraphics(node, sessionId);
              await handleCpApi({ params: graphicsParams, code: "seat" }, true);

              // 更新子节点
              const nodeParams = updateNode(getNodeChildren(node), sessionId, node);
              await handleCpApi({ params: nodeParams, code: "seat" }, true);
            }
          } else if (e.target.innerHTML === "-") {
            markLocalGraphMutation();
            // let { x, y } = node.getPosition();

            let { circleChairNum } = node.data;
            if (circleChairNum == 1) {
              message.warning("椅子至少一个!");
              return;
            } else {
              const circleChairs = getNodeChildren(node).filter((child) => child.data?.nodeType === "circleChair");
              const lastChildren = circleChairs[circleChairs.length - 1];
              if (!lastChildren) {
                return;
              }

              node.removeChild(lastChildren);

              // 删除人员
              if (lastChildren.attrs.xnode) {
                store.dispatch(subAction(String(lastChildren.attrs.xnode.key)));
              }

              graph.removeNode(lastChildren.id);
              computeCirclePosition(graph, node, "minus", circleChairNum);

              // 删除节点
              const delNodeParams = delNode([lastChildren], sessionId);
              await handleCpApi({ params: delNodeParams, code: "seat" }, true);

              // 更新图形组 父节点
              const graphicsParams = updateGraphics(node, sessionId);
              await handleCpApi({ params: graphicsParams, code: "seat" }, true);

              // 更新子节点
              const nodeParams = updateNode(getNodeChildren(node), sessionId, node);
              await handleCpApi({ params: nodeParams, code: "seat" }, true);
            }
          } else if (e.target.innerHTML === "✕") {
            markLocalGraphMutation();
            let { tableName } = node.data;

            let modal = Modal.confirm({
              content: `确认删除${tableName}`,
              width: "300px",
              okText: "确认",
              cancelText: "取消",
              centered: true,
              async onOk() {
                message.success("删除成功");
                modal.destroy();

                const nodeParams = delGraphics(node);
                await handleCpApi({ params: nodeParams, code: "seat" }, true);

                const hasPeronArr = getNodeChildren(node).filter(
                  (item: any) => item.attrs.xnode && item.data.nodeType === "circleChair"
                );

                if (hasPeronArr && hasPeronArr.length > 0) {
                  // 人员删除
                  for (let i = 0; i < hasPeronArr.length; i++) {
                    const element: any = hasPeronArr[i];
                    store.dispatch(subAction(element.attrs.xnode.key));
                  }
                }

                const graph = getGraph();
                graph.removeNode(node.id);

                const nodes = graph.getNodes();
                const hasCircleContainer = nodes.filter((item: any) => item.data.nodeType === "circleContainer");
                if (hasCircleContainer && hasCircleContainer.length === 0) {
                  store.dispatch(addDargAction(""));
                }
              },
            });
          }

          const allGdom: any = document.querySelectorAll(".x6-graph-svg-stage > g");

          for (const iterator of allGdom) {
            iterator.classList.add("x6-transition");
          }
        },
      },
    });
  }
};

const computeCirclePosition = (graph: Graph, node: Node, type: string, circleChairNum: number) => {
  let curremtCircleChairNum: number = 0;
  if (type === "add") {
    curremtCircleChairNum = circleChairNum + 1;
  } else {
    curremtCircleChairNum = circleChairNum - 1;
  }

  const { x, y } = node.getPosition();
  const nodes = graph.getNodes();

  const filterNode = nodes.filter((ite: Node) => ite.data.nodeType === "circleChair" && ite.parent.id === node.id);

  const findTable = nodes.find((ite: Node) => ite.data.nodeType === "circleTable" && ite.parent.id === node.id);

  node.setData({ circleChairNum: curremtCircleChairNum });
  const parentSize = (curremtCircleChairNum / 2) * CHAIR_SIZE + PARENT_EXTRA_SPACE;
  node.setSize({ width: parentSize, height: parentSize });
  node.position(x, y);

  const minChairNUm = curremtCircleChairNum > 10 ? curremtCircleChairNum : 10;
  node.setProp({
    width: (minChairNUm / 2) * CHAIR_SIZE + PARENT_EXTRA_SPACE,
    height: (minChairNUm / 2) * CHAIR_SIZE + PARENT_EXTRA_SPACE,
  });
  findTable.setProp({
    width: (minChairNUm / 2) * CHAIR_SIZE,
    height: (minChairNUm / 2) * CHAIR_SIZE,
  });
  findTable.setMarkup([
    {
      tagName: "circle",
      attrs: {
        cx: ((minChairNUm / 2) * CHAIR_SIZE) / 2,
        cy: ((minChairNUm / 2) * CHAIR_SIZE) / 2,
        r: ((minChairNUm / 2) * CHAIR_SIZE) / 2,
        text: node.data.tableName,
        fill: "rgba(25, 118, 111, 0.05)",
        stroke: "rgba(25, 118, 111, 0.26)",
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
  ]);

  const { width } = findTable.size();
  const { x: fx, y: fy } = findTable.position();

  const CHAIR_ANGLE_STEP = 360 / curremtCircleChairNum;
  for (let i = 0; i < filterNode.length; i++) {
    const angle = (0 + CHAIR_ANGLE_STEP * i) * (Math.PI / 180);
    const curentEle = filterNode[i];
    curentEle.setData({
      idx: i,
      tableName: curentEle.parent.data.tableName,
      tableNameEn: curentEle.parent.data.tableNameEn,
    });

    const chairRadius = width / 2 + CHAIR_SIZE / 2 + 5; // 椅子距离圆桌的半径
    curentEle.position(
      fx + width / 2 - CHAIR_SIZE / 2 + Math.cos(angle) * chairRadius,
      fy + width / 2 - CHAIR_SIZE / 2 + Math.sin(angle) * chairRadius
    );
  }
};

export default circleToolsConfig;
