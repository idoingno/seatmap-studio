// import { getGraph } from ".";
import { CellView, Node, NodeView } from "@antv/x6";
import { syncSvg } from "../Markup/syncIcon";
import { getGraph } from "../graphInstance";
import { handleOffsetAisle, handleOffsetCorridor } from "../../CreateMatrix";
import { chairSvg } from "../Markup/chair";
import store from "../../store/index";
import { getRuntime } from "../../store/accessors";
import { runtimeActions } from "../../store/runtimeSlice";
import { subAction } from "../../store/actionCreators";
import { delGraphics, delPersonnel, updateNode } from "../../utils/apiParams";
import { handleCpApi } from "../../api";
import { patternSeat } from "../../assets";

interface ConfigProps {
  e?: Event | any;
  cell?: CellView;
  node?: Node;
  view: NodeView;
}

const removeToolsConfig = ({ e, node }: ConfigProps) => {
  const { nodeType, visible } = node.data;
  if ((nodeType === "matrixChair" && visible) || (nodeType === "circleChair" && visible)) {
    // 显示节点删除按钮
    node.addTools({
      name: "button-remove",
      args: {
        x: "100%",
        y: 0,
        offset: { x: -5, y: 5 },
        async onClick({ view, e }: any) {
          const node = view.cell;
          // 获取场次Id
          const sessionId = getRuntime().sessionId;
          if (node.attrs.xnode) {
            store.dispatch(subAction(node.attrs.xnode.key));

            // 人员删除
            const nodeParams = delPersonnel([{ id: node.attrs.xnode.key }], sessionId);
            await handleCpApi({ params: nodeParams, code: "seat" }, true);

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

            // delete node.attrs.xnode;

            node.removeAttrByPath("xnode");
          } else {
            node.setMarkup([
              {
                tagName: "rect",
                attrs: {
                  width: "40px",
                  height: "40px",
                },
              },
              syncSvg,
            ]);
            node.attr("svg/fill", "rgba(0, 0, 0, 0.25)");

            node.data = {
              // ...node.data,
              disableMove: true,
              nodeType: nodeType,
              visible: false,
            };

            const graph = getGraph();
            graph.unselect(node);

            // 更新子节点
            const nodeParams = updateNode([node], sessionId, node.parent);
            await handleCpApi({ params: nodeParams, code: "seat" }, true);
          }

          if (node.hasTool("button-remove")) {
            node.removeTool("button-remove");
          }
        },
      },
    });
  }

  if (nodeType === "prosceniumNode" || nodeType === "windowNode" || nodeType === "doorNode") {
    node.addTools({
      name: "button-remove",
      args: {
        x: "100%",
        y: 0,
        offset: { x: -10, y: 10 },
        async onClick({ view, e }: any) {
          const node = view.cell;

          const nodeParams = delGraphics(node);
          await handleCpApi({ params: nodeParams, code: "seat" }, true);

          const graph = getGraph();
          graph.removeNode(node.id);
        },
      },
    });
  }

  if (nodeType === "corridorColumnSpace") {
    const size = node.size();
    if (size.width > 6) {
      node.addTools({
        name: "button-remove",
        args: {
          x: "100%",
          y: 0,
          offset: { x: -10, y: 10 },
          onClick({ view, e }: any) {
            const node = view.cell;
            const { height } = node.size();
            node.setProp({
              size: {
                width: 6,
                height: height,
              },
            });

            store.dispatch(runtimeActions.setCurrentColumn(node.data.idx));
            node.data.isExist = false;
            handleOffsetCorridor("del");

            if (node.hasTool("button-remove")) {
              node.removeTool("button-remove");
            }
          },
        },
      });
    }
  }

  if (nodeType === "aisleRowSpace") {
    const size = node.size();
    if (size.height > 6) {
      node.addTools({
        name: "button-remove",
        args: {
          x: "100%",
          y: 0,
          offset: { x: -10, y: 10 },
          onClick({ view, e }: any) {
            const node = view.cell;
            const { width } = node.size();
            node.setProp({
              size: {
                width: width,
                height: 6,
              },
            });

            node.data.isExist = false;
            node.attr("label/text", "");

            store.dispatch(runtimeActions.setCurrentRow(node.data.idx));
            handleOffsetAisle("del");

            if (node.hasTool("button-remove")) {
              node.removeTool("button-remove");
            }
          },
        },
      });
    }
  }
};

export default removeToolsConfig;
