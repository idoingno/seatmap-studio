import React, { Suspense, useEffect, useImperativeHandle, useRef, useState } from "react";
import DragMaterial from "./DragMaterial";
import { getGraph } from "../config/graphInstance";
import { materialsForDragState, panelType } from "../config/materials";
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

interface PersonTreeType {
  onRef: any;
  loadTree$: EventEmitter<void>;
  getData: () => void | Promise<void>;
  setRefresh: (value: boolean) => void;
}

const CustomNodeCollapsePanel: React.FC<PersonTreeType> = ({ onRef, loadTree$, getData, setRefresh }) => {
  const dndContainerRef = useRef<HTMLDivElement>();
  const [list, setList] = useState<panelType[]>(() => materialsForDragState(""));
  const [openSections, setOpenSections] = useState<string[]>(["layout", "people"]);

  const innerRef: any = React.createRef();

  const selectDrag = useSelector((state: any) => state.other.isDrag);
  const { modalRef: selectTemplateModalRef, FormModal: SelectTemplateModal } = useFormModal(
    { title: "模板选择", width: 1080 },
    SelectTemplateForm
  );

  useImperativeHandle(onRef, () => ({
    getData: () => {
      innerRef.current.reload();
    },
  }));

  useEffect(() => {
    // 监听state的变化，派生素材可拖拽状态（panelArr 为只读源数据，不再就地改写）
    setList(materialsForDragState(selectDrag));
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
          <span className="panel-title">空间资源</span>
        </div>
        <button type="button" className="panel-action-button" onClick={importTemplate}>
          <AppIcon name="importTemplate" className="panel-action-icon" />
          引入模板
        </button>
      </div>
      <div className="app-stencil">
        <div className="stencil-sections">
          <section className="stencil-section">
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection("layout")}
              aria-expanded={sectionOpen("layout")}
            >
              <span className="section-title-group">
                <span>布局素材</span>
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
            <button
              type="button"
              className="section-header"
              onClick={() => toggleSection("people")}
              aria-expanded={sectionOpen("people")}
            >
              <span className="section-title-group">
                <span>人员与座位</span>
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
