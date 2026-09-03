import type { Graph } from "@antv/x6";

type EditorInteractionRuntime = {
  Selection: new (...args: any[]) => any;
  Snapline: new (...args: any[]) => any;
  Transform: new (...args: any[]) => any;
};

let editorNodeRuntimePromise: Promise<void> | undefined;
let editorInteractionRuntimePromise: Promise<EditorInteractionRuntime> | undefined;
const initializedNodeGraphs = new WeakSet<Graph>();
const initializedInteractionGraphs = new WeakSet<Graph>();

export const loadEditorNodeRuntime = () => {
  if (!editorNodeRuntimePromise) {
    editorNodeRuntimePromise = Promise.all([
      import("../CreateMatrix/RegisterNode/node"),
      import("../CreateMatrix/MenuNode/AddMenuNode"),
      import("../CreateMatrix/MenuNode/MinusMenuNode"),
    ]).then(() => undefined);
  }

  return editorNodeRuntimePromise;
};

export const loadEditorInteractionRuntime = () => {
  if (!editorInteractionRuntimePromise) {
    editorInteractionRuntimePromise = Promise.all([
      import("@antv/x6-plugin-selection"),
      import("@antv/x6-plugin-snapline"),
      import("@antv/x6-plugin-transform"),
    ]).then(([selectionModule, snaplineModule, transformModule]) => ({
      Selection: (selectionModule as any).Selection,
      Snapline: (snaplineModule as any).Snapline,
      Transform: (transformModule as any).Transform,
    }));
  }

  return editorInteractionRuntimePromise;
};

export const ensureEditorNodeRuntime = async (graph: Graph) => {
  if (initializedNodeGraphs.has(graph)) {
    return;
  }

  await loadEditorNodeRuntime();
  initializedNodeGraphs.add(graph);
};

export const ensureEditorInteractionRuntime = async (graph: Graph) => {
  if (initializedInteractionGraphs.has(graph)) {
    return;
  }

  const { Selection, Snapline, Transform } = await loadEditorInteractionRuntime();

  graph.use(
    new Snapline({
      enabled: true,
      clean: false,
      filter: (node: any) => {
        return node.getData().snapline;
      },
    } as any)
  );

  const selection = new Selection({
    enabled: true,
    filter(node: any) {
      return (
        node.data &&
        ((node.data.nodeType === "matrixChair" && node.data.visible) ||
          (node.data.nodeType === "circleChair" && node.data.visible))
      );
    },
    multiple: true,
    modifiers: ["ctrl", "meta"],
    multipleSelectionModifiers: ["ctrl", "meta"],
    strict: true,
    pointerEvents: "none",
    rubberband: true,
    movable: true,
    showNodeSelectionBox: true,
  });

  graph.use(selection);

  const selectionPlugin = graph.getPlugin?.("selection") as
    | {
        allowRubberband?: (event?: MouseEvent, strict?: boolean) => boolean;
        __seatmapSafeAllowRubberband__?: boolean;
      }
    | undefined;

  if (selectionPlugin && !selectionPlugin.__seatmapSafeAllowRubberband__ && selectionPlugin.allowRubberband) {
    const originalAllowRubberband = selectionPlugin.allowRubberband.bind(selectionPlugin);
    selectionPlugin.allowRubberband = (event?: MouseEvent, strict?: boolean) => {
      if (!event) {
        return false;
      }

      return originalAllowRubberband(event, strict);
    };
    selectionPlugin.__seatmapSafeAllowRubberband__ = true;
  }

  graph.use(
    new Transform({
      resizing: {
        enabled(node: any) {
          const arr = ["windowNode", "doorNode", "prosceniumNode"];
          if (arr.includes(node.data.nodeType)) {
            return true;
          }
        },
        minHeight: 48,
        minWidth: 48,
      },
    })
  );

  initializedInteractionGraphs.add(graph);
};
