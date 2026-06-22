import { Cell, CellView, Node, NodeView } from "@antv/x6";
import { getGraph } from "..";
import addSvg from "../Markup/addIcon";
import minusSvg from "../Markup/minusIcon";

export interface ConfigProps {
  e?: Event | any;
  cell?: CellView;
  node?: Node;
  view: NodeView;
}

const matrixToolsConfig = ({ e, node }: ConfigProps) => {
  let nodeType = node.data.nodeType;
  if (nodeType === "matrixContainer") {
    node.addTools({
      name: "button",
      args: {
        markup: [
          {
            tagName: "rect",
            attrs: {
              class: "matrix-add-tool-hitbox",
              width: "24px",
              height: "24px",
              fill: "transparent",
              stroke: "transparent",
              x: -60,
              y: -20,
              cursor: "pointer",
            },
          },
          addSvg,
        ],
        x: "100%",
        y: 0,
        // offset: { x: 20, y: 20 },
        onClick({ e, cell }: any) {
          const graph = getGraph();
          graph
            .getNodes()
            .filter((item: Node) => item.data?.nodeType === "menuNode")
            .forEach((item: Node) => {
              graph.removeNode(item.id);
            });
          const p1 = graph.clientToLocal(e.clientX, e.clientY);

          graph.addNode({
            shape: "add-menu-react-node",
            x: p1.x,
            y: p1.y,
          });

          const allGdom: any = document.querySelectorAll(".x6-graph-svg-stage > g");

          for (const iterator of allGdom) {
            iterator.classList.add("x6-transition");
          }
        },
      },
    });

    node.addTools({
      name: "button",
      args: {
        markup: [
          {
            tagName: "rect",
            attrs: {
              class: "matrix-minus-tool-hitbox",
              width: "24px",
              height: "24px",
              fill: "transparent",
              stroke: "transparent",
              x: -30,
              y: -20,
              cursor: "pointer",
            },
          },
          minusSvg,
        ],
        x: "100%",
        y: 0,
        // offset: { x: 20, y: 20 },
        onClick({ e, cell }: any) {
          const graph = getGraph();
          graph
            .getNodes()
            .filter((item: Node) => item.data?.nodeType === "menuNode")
            .forEach((item: Node) => {
              graph.removeNode(item.id);
            });
          const p1 = graph.clientToLocal(e.clientX, e.clientY);

          graph.addNode({
            shape: "minus-menu-react-node",
            x: p1.x,
            y: p1.y,
          });

          const allGdom: any = document.querySelectorAll(".x6-graph-svg-stage > g");

          for (const iterator of allGdom) {
            iterator.classList.add("x6-transition");
          }
        },
      },
    });
  }
};

export default matrixToolsConfig;
