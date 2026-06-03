import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useGraphState } from "x6-hooks/react";
// import { Button } from "antd";
import { Graph } from "x6-graph/react";
import { GraphBehavior } from "./GraphBehavior";
import CanvasScaleToolbar from "./CanvasScaleToolbar";
import { scaling, mousewheel, interacting, Session, background, translating, CPForm } from "./config";
import { setGraphs } from "./config/index";
import toDrop from "./toDrop";

// import "./style.less";
import { querySeatInfo } from "./utils/apiParams";
import { ResponseType, handleCpApi } from "./api";
import { renderGraph } from "./utils/graphUtils";
import { Spin } from "antd";
import store from "./store";
import { addDargAction, emptyAction, isLoadAction } from "./store/actionCreators";
import type { ColorItemType } from "./Components/ColorPanel/ColorEdit";
import { useEventEmitter, useUpdateEffect } from "ahooks";
import { useSelector } from "react-redux";
import { runGraphBatch } from "./utils/graphBatch";
import { syncGraphPerformanceMode } from "./utils/graphPerformance";
import { ensureEditorInteractionRuntime, ensureEditorNodeRuntime } from "./utils/editorRuntime";

const prefixCls = "clickpaas-customize-component-1691398243116";
const CustomNodeCollapsePanel = React.lazy(() => import("./CustomNodeCollapsePanel"));
const CustomNodeHeader = React.lazy(() => import("./CustomNodeHeader"));
const CircleUpdateName = React.lazy(() => import("./Components/CircleUpdateName"));
const ChairCard = React.lazy(() => import("./Components/ChairCard"));
const ColorPanel = React.lazy(() => import("./Components/ColorPanel"));
const ColorEdit = React.lazy(() => import("./Components/ColorPanel/ColorEdit"));

interface AppProps {
  closeApp?: () => void;
}

const App = ({ closeApp }: AppProps) => {
  /** 当组件运行在 APaaS 基座应用时才存在 props 属性 */
  /** configurations 是组件的配置项信息 */
  // const { configurations, context, form } = props;
  // const { propName1: placeholder, propName2: width = 350, propName3: disabled } = configurations || {};
  // Session.setDataId = context.dataId;
  // CPForm.setForm = form

  const sessionId = Session.getDataId;

  const { nodes, setNodes, edges, setEdges, graph: gRef, setGraph } = useGraphState();

  const [loading, setLoading] = useState<boolean>(true);
  // const colorEditRef = useRef(null);
  const [colorObj, setColorObj] = useState<ColorItemType>();

  // const [showTemplate, setShowTemplate] = useState<boolean>(false);
  // const [mapUrl, setMapUrl, getMapUrl] = useGetState<string>("");

  const [refresh, setRefresh] = useState<boolean>(false);
  const customNodeCollapsePanelRef = useRef<{ getData?: () => void } | null>(null);

  const [, updateState] = useState<any>();
  const forceUpdate = useCallback(() => updateState({}), []);

  useEffect(() => {
    refresh && setTimeout(() => setRefresh(false));
  }, [refresh]);
  const loadTree$ = useEventEmitter();

  // 拖拽
  const dropRef = useRef(null);
  toDrop(dropRef);

  const query = async () => {
    setLoading(true);

    const params = querySeatInfo(sessionId);
    try {
      const { code, data, subMsgType }: ResponseType = await handleCpApi({ params, code: "seat" });
      setLoading(false);

      if (code === 200 && subMsgType === "success") {
        const schema = data?.response?.schema || [];

        const newData = renderGraph(schema);
        runGraphBatch(gRef.current, "load-seatmap", () => {
          gRef.current.fromJSON({ cells: newData }, { async: true });
        });
        syncGraphPerformanceMode(gRef.current, newData.length);
        gRef.current.centerContent(); // 将画布中元素居中展示

        const findMatrixContainer = schema && schema.findIndex((item: any) => item.type === "matrixContainer");
        const findRoundContainer = schema && schema.findIndex((item: any) => item.type === "circleContainer");

        if (findMatrixContainer !== undefined && findMatrixContainer > -1) {
          store.dispatch(addDargAction("Matrix"));
        } else if (findMatrixContainer !== undefined && findRoundContainer > -1) {
          store.dispatch(addDargAction("Round"));
        } else {
          store.dispatch(addDargAction(""));
        }

        store.dispatch(isLoadAction(true));
      }
    } catch (error) {
      setLoading(false);
    }
  };

  // const selectFullScreenLoading = useSelector((state: any) => {
  //   return state.other.showFullScreenLoading
  // });

  // useUpdateEffect(() => {
  //   let currentValue: any;
  //   let previousValue = currentValue;
  //   currentValue = selectFullScreenLoading;

  //   if (previousValue !== currentValue) {
  //     setLoading(currentValue);
  //   }
  // }, [selectFullScreenLoading])

  const getAllData = () => {
    setLoading(true);
    store.dispatch(emptyAction());
    store.dispatch(isLoadAction(false));
    store.dispatch(addDargAction(""));

    query();
    forceUpdate();
  };

  const refreshPeopleTree = useCallback(() => {
    customNodeCollapsePanelRef.current?.getData?.();
  }, []);


  useEffect(() => {
    const graph = gRef.current;
    let cancelled = false;
    let interactionTimer: number | undefined;

    setGraphs(graph);

    (async () => {
      try {
        await ensureEditorNodeRuntime(graph);
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      if (cancelled) {
        return;
      }

      if (sessionId) {
        query();
      } else {
        setLoading(false);
        syncGraphPerformanceMode(graph, 0);
      }

      interactionTimer = window.setTimeout(() => {
        ensureEditorInteractionRuntime(graph).catch(() => undefined);
      }, 0);
    })();

    return () => {
      cancelled = true;
      if (interactionTimer) {
        window.clearTimeout(interactionTimer);
      }
    };
  }, []);

  loadTree$.useSubscription(() => {
    query();
  });

  return (
    <div className={prefixCls} style={{ width: "100%", height: "100%" }}>
      <Spin spinning={loading} delay={500} wrapperClassName="spin-wrap" tip="努力加载数据中, 请稍后...">
        <>
          <Suspense fallback={<div style={{ height: 48, borderBottom: "1px solid #eee", background: "#fff" }} />}>
            <CustomNodeHeader
              setPageLoading={setLoading}
              // setShowTemplate={() => UserModalRef.current?.open({ mapUrl })}
              // setMapUrl={setMapUrl}
              setRefresh={setRefresh}
              getData={getAllData}
              refreshPeople={refreshPeopleTree}
              closeApp={closeApp}
            />
          </Suspense>

          <div style={{ display: "flex" }}>
            {refresh ? (
              <></>
            ) : (
              <Suspense fallback={<div style={{ width: 260, flex: "0 0 260px", background: "#fff" }} />}>
                <CustomNodeCollapsePanel
                  onRef={customNodeCollapsePanelRef}
                  loadTree$={loadTree$}
                  getData={getAllData}
                  setRefresh={setRefresh}
                />
              </Suspense>
            )}
            <div ref={dropRef}>
              <Graph
                background={background}
                panning
                scaling={scaling}
                mousewheel={mousewheel}
                width={window.innerWidth - 260}
                height={window.innerHeight - 48}
                async={true}
                virtual={true}
                interacting={interacting}
                translating={translating}
                // embedding={embedding}
                // virtual={true}
                autoResize={true}
                ref={gRef}
              >
                <GraphBehavior />
                <CanvasScaleToolbar />
              </Graph>
            </div>
          </div>
        </>

        <Suspense fallback={null}>
          <CircleUpdateName />
        </Suspense>
        <Suspense fallback={null}>
          <ChairCard />
        </Suspense>
        <Suspense fallback={null}>
          <ColorPanel setColorObj={setColorObj} />
        </Suspense>
        <Suspense fallback={null}>
          <ColorEdit colorObj={colorObj} />
        </Suspense>
      </Spin>
    </div>
  );
};

export default App;
