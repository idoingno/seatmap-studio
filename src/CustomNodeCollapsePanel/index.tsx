import React, { Suspense, useEffect, useImperativeHandle, useRef, useState } from "react";
// import { Graph } from "@antv/x6";


// import { useGraphInstance } from "x6-graph/react";
// import ReactDom from 'react-dom'
// import { NodeCollapseObj, nodes } from "../config";
// import { useDrop, useDrag } from "ahooks";
import DragMaterial from "./DragMaterial";
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
import AppIcon from "../Components/AppIcon";

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
        <div className="top-copy">
          <span className="panel-kicker">Studio Deck</span>
          <span className="panel-title">布局素材与排座</span>
        </div>
        <button type="button" className="panel-action-button" onClick={importTemplate}>
          <AppIcon name="importTemplate" className="panel-action-icon" />
          引入模板
        </button>
      </div>
      <div className="app-stencil">
        <div className="stencil-sections">
          <section className="stencil-section">
            <button type="button" className="section-header" onClick={() => toggleSection("layout")}>
              <span className="section-title-group">
                <span className="section-kicker">Canvas</span>
                <span>场景布局</span>
              </span>
              <AppIcon name="chevronRight" className={`section-chevron${sectionOpen("layout") ? " is-open" : ""}`} />
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
              <span className="section-title-group">
                <span className="section-kicker">Roster</span>
                <span>人员排座</span>
              </span>
              <AppIcon name="chevronRight" className={`section-chevron${sectionOpen("people") ? " is-open" : ""}`} />
            </button>
            {sectionOpen("people") ? (
              <div className="section-body">
                <Suspense fallback={<div className="person-tree-fallback" />}>
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
