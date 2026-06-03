import React, { Suspense, useEffect, useImperativeHandle, useRef, useState } from "react";
// import { Graph } from "@antv/x6";


// import { useGraphInstance } from "x6-graph/react";
// import ReactDom from 'react-dom'
// import { NodeCollapseObj, nodes } from "../config";
// import { useDrop, useDrag } from "ahooks";
import DragMaterial from "./DragMaterial";
import { CaretRightOutlined } from "@ant-design/icons";
import { getGraph, panelArr, panelType } from "../config";
// import Draggable from "react-draggable";
// import { HTML5Backend } from 'react-dnd-html5-backend'
// import { DndProvider } from 'react-dnd'
import "./index.less";
import store from "../store";
import { addDargAction } from "../store/actionCreators";
import { useSelector } from "react-redux";
import { EventEmitter } from "ahooks/lib/useEventEmitter";
import useFormModal from "../Components/useFormModal";
import { lazyForm } from "../Components/useFormModal/lazyForm";

const PersonTree = React.lazy(() => import("./PersonTree"));
const SelectTemplateForm = lazyForm(() => import("../Components/useFormModal/SelectTemplateForm"));

// const normalizeNodePosition = (nodes: any) => {
//   nodes.forEach((node: any) => {
//     node.x -= node.size.width / 2;
//     node.y -= node.size.height / 2;
//   });
// };
interface PersonTreeType {
  onRef: any;
  loadTree$: EventEmitter<void>;
  getData: () => void;
  setRefresh: (value: boolean) => void;
}

const CustomNodeCollapsePanel: React.FC<PersonTreeType> = ({ onRef, loadTree$, getData, setRefresh }) => {
  // const CustomNodeCollapsePanel = ({}) => {
  // const graph = getGraph();
  const dndContainerRef = useRef<HTMLDivElement>();
  const [list, setList] = useState([]);
  const [openSections, setOpenSections] = useState<string[]>(["layout", "people"]);

  const innerRef: any = React.createRef();

  // function selectDrag(state: any) {
  //   return state.other.isDrag;
  // }

  const selectDrag = useSelector((state: any) => state.other.isDrag);
  const { modalRef: selectTemplateModalRef, FormModal: SelectTemplateModal } = useFormModal(
    { title: "模板选择", width: "100%" },
    SelectTemplateForm
  );

  useImperativeHandle(onRef, () => ({
    getData: () => {
      innerRef.current.reload();
    },
  }));

  useEffect(() => {
    let currentValue: any;
    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {
    let previousValue = currentValue;
    // currentValue = selectDrag(store.getState());
    currentValue = selectDrag;

    if (previousValue !== currentValue) {
      if (currentValue === "Matrix") {
        panelArr.forEach((child) => {
          if (child.nodeType === "Matrix" || child.nodeType === "Round") {
            child.draggable = false;
          } else {
            child.draggable = true;
          }
        });
      } else if (currentValue === "Round") {
        panelArr.forEach((child) => {
          if (child.nodeType === "Matrix" || child.nodeType === "Corridor" || child.nodeType === "Aisle") {
            child.draggable = false;
          } else {
            child.draggable = true;
          }
        });
      } else {
        panelArr.forEach((child) => {
          child.draggable = true;
        });
      }

      setList([...panelArr]);
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectDrag]);

  const importTemplate = () => {
    selectTemplateModalRef.current?.open();
  };

  const toggleSection = (key: string) => {
    setOpenSections((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const sectionOpen = (key: string) => openSections.includes(key);

  return (
    <div className="stencil-app" ref={dndContainerRef}>
      <div className="top">
        <span>布局</span>
        <button type="button" className="panel-action-button" onClick={importTemplate}>
          引入模板
        </button>
      </div>
      <div className="app-stencil">
        <div className="stencil-sections">
          <section className="stencil-section">
            <button type="button" className="section-header" onClick={() => toggleSection("layout")}>
              <span>场景布局</span>
              <CaretRightOutlined rotate={sectionOpen("layout") ? 90 : 0} />
            </button>
            {sectionOpen("layout") ? (
              <div className="section-body">
            <div className="grid-list">
              {list &&
                list.map((m: panelType) => {
                  return <DragMaterial key={m.id} child={m} />;
                })}
            </div>
              </div>
            ) : null}
          </section>
          <section className="stencil-section">
            <button type="button" className="section-header" onClick={() => toggleSection("people")}>
              <span>人员排座</span>
              <CaretRightOutlined rotate={sectionOpen("people") ? 90 : 0} />
            </button>
            {sectionOpen("people") ? (
              <div className="section-body">
                <Suspense fallback={<div style={{ minHeight: 320, background: "#fff" }} />}>
                  <PersonTree onRef={innerRef} loadTree$={loadTree$} />
                </Suspense>
              </div>
            ) : null}
          </section>
        </div>
      </div>
      <SelectTemplateModal getData={getData} setRefresh={setRefresh} />
    </div>
  );
};

export default CustomNodeCollapsePanel;
