import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGraphState } from "x6-hooks/react";
// import { Button } from "antd";
import { Graph } from "x6-graph/react";
import { Snapline } from "@antv/x6-plugin-snapline";
import CustomNodeCollapsePanel from "./CustomNodeCollapsePanel";
import { GraphBehavior } from "./GraphBehavior";
import CanvasScaleToolbar from "./CanvasScaleToolbar";
import { scaling, mousewheel, interacting, Session, background, translating, CPForm } from "./config";
import { setGraphs } from "./config/index";
import "./CreateMatrix/RegisterNode/node";
import "./CreateMatrix/MenuNode/AddMenuNode";
import "./CreateMatrix/MenuNode/MinusMenuNode";
import toDrop from "./toDrop";
import { Selection } from "@antv/x6-plugin-selection";
import { Export } from "@antv/x6-plugin-export";
import { Transform } from "@antv/x6-plugin-transform";

import "antd/dist/antd.css";
// import "./style.less";
import { querySeatInfo } from "./utils/apiParams";
import { ResponseType, handleCpApi } from "./api";
import { renderGraph } from "./utils/graphUtils";
import CustomNodeHeader from "./CustomNodeHeader";
import { Spin } from "antd";
import store from "./store";
import { addDargAction, emptyAction, isLoadAction } from "./store/actionCreators";
import CircleUpdateName from "./Components/CircleUpdateName";
import ChairCard from "./Components/ChairCard";
import ColorPanel from "./Components/ColorPanel";
import ColorEdit, { ColorItemType } from "./Components/ColorPanel/ColorEdit";
// import SaveTemplate from "./Components/SaveTemplate";
import useFormModal from "./Components/useFormModal";
import SelectTemplateForm from "./Components/useFormModal/SelectTemplateForm";
import { useEventEmitter, useUpdateEffect } from "ahooks";
import { useSelector } from "react-redux";

const prefixCls = "clickpaas-customize-component-1691398243116";

interface AppProps {
  closeApp?: () => void;
}

const App = ({ closeApp }: AppProps) => {
  /** 当组件运行在 APaaS 基座应用时才存在 props 属性 */
  /** configurations 是组件的配置项信息 */
  // const { configurations, context, form } = props;
  // const { propName1: placeholder, propName2: width = 350, propName3: disabled } = configurations || {};
  // console.log("CP-----------> props", props);
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
  const customNodeCollapsePanelRef: any = React.createRef();

  const [, updateState] = useState<any>();
  const forceUpdate = useCallback(() => updateState({}), []);

  useEffect(() => {
    refresh && setTimeout(() => setRefresh(false));
  }, [refresh]);

  console.log("rendering...");

  // const { modalRef: UserModalRef, FormModal: UserModal } = useFormModal(
  //   { title: "模板配置" },
  //   React.forwardRef(UserForm)
  // );

  const { modalRef: SelectListRef, FormModal: SelectTemplateModal } = useFormModal(
    { title: "模板选择", width: "100%" },
    React.forwardRef(SelectTemplateForm)
  );

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
        gRef.current.fromJSON({ cells: newData });
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
      console.error("Failed to load seat layout", error);
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
  //     console.log("页面请求", previousValue, "to", currentValue);

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


  useEffect(() => {
    setGraphs(gRef.current);
    gRef.current.use(new Export());
    gRef.current.use(
      new Snapline({
        enabled: true,
        clean: false,
        filter: (a: any) => {
          return a.getData().snapline;
        },
      } as any)
    );

    gRef.current.use(
      new Selection({
        enabled: true,
        filter(node: any) {
          return (
            node.data &&
            ((node.data.nodeType === "matrixChair" && node.data.visible) ||
              (node.data.nodeType === "circleChair" && node.data.visible))
            // ||  node.data.nodeType === "circleContainer")
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
        // content: `<div class="frame-close-wrap"><div class="frame-close">
        //             <div class="frame-line1"></div>
        //             <div class="frame-line2"></div>
        //         </div></div>`,
      })
    );

    gRef.current.use(
      new Transform({
        resizing: {
          enabled(node: any) {
            console.log("======node====", node);
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

    if (sessionId) {
      query();
    } else {
      setLoading(false);
    }
  }, []);

  loadTree$.useSubscription(() => {
    query();
  });

  return (
    <div className={prefixCls} style={{ width: "100%", height: "100%" }}>
      <Spin spinning={loading} delay={500} wrapperClassName="spin-wrap" tip="努力加载数据中, 请稍后...">
        <>
          <CustomNodeHeader
            setPageLoading={setLoading}
            // setShowTemplate={() => UserModalRef.current?.open({ mapUrl })}
            // setMapUrl={setMapUrl}
            setRefresh={setRefresh}
            getData={getAllData}
            closeApp={closeApp}
          />

          <div style={{ display: "flex" }}>
            {refresh ? (
              <></>
            ) : (
              <CustomNodeCollapsePanel
                onRef={customNodeCollapsePanelRef}
                setShowSelectTemplate={() => SelectListRef.current?.open()}
                loadTree$={loadTree$}
              />
            )}
            <div ref={dropRef}>
              <Graph
                background={background}
                panning
                scaling={scaling}
                mousewheel={mousewheel}
                width={window.innerWidth - 260}
                height={window.innerHeight - 48}
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

        <CircleUpdateName />
        <ChairCard />
        <ColorPanel setColorObj={setColorObj} />
        <ColorEdit colorObj={colorObj} />
        {/* <UserModal /> */}
        <SelectTemplateModal getData={getAllData} setRefresh={setRefresh} />
      </Spin>
    </div>
  );
};

export default App;
