import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
// import { Graph } from "@antv/x6";


// import { useGraphInstance } from "x6-graph/react";
// import ReactDom from 'react-dom'
// import { NodeCollapseObj, nodes } from "../config";
// import { useDrop, useDrag } from "ahooks";
import DragMaterial from "./DragMaterial";
import { CaretRightOutlined } from "@ant-design/icons";
import { Button, Collapse } from "antd";
import { getGraph, panelArr, panelType } from "../config";
// import Draggable from "react-draggable";
// import { HTML5Backend } from 'react-dnd-html5-backend'
// import { DndProvider } from 'react-dnd'
import "./index.less";
import PersonTree from "./PersonTree";
import store from "../store";
import { addDargAction } from "../store/actionCreators";
import { useSelector } from "react-redux";
import { EventEmitter } from "ahooks/lib/useEventEmitter";

const { Panel } = Collapse;

// const normalizeNodePosition = (nodes: any) => {
//   nodes.forEach((node: any) => {
//     node.x -= node.size.width / 2;
//     node.y -= node.size.height / 2;
//   });
// };
interface PersonTreeType {
  onRef: any;
  setShowSelectTemplate: () => void;
  loadTree$: EventEmitter<void>;
}

const CustomNodeCollapsePanel: React.FC<PersonTreeType> = ({ onRef, setShowSelectTemplate, loadTree$ }) => {
  // const CustomNodeCollapsePanel = ({}) => {
  // const graph = getGraph();
  const dndContainerRef = useRef<HTMLDivElement>();
  const [list, setList] = useState([]);

  const innerRef: any = React.createRef();

  // function selectDrag(state: any) {
  //   return state.other.isDrag;
  // }

  const selectDrag = useSelector((state: any) => state.other.isDrag);

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
    setShowSelectTemplate();
  };

  return (
    <div className="stencil-app" ref={dndContainerRef}>
      <div className="top">
        <span>布局</span>
        <Button style={{ color: "#b39372" }} onClick={importTemplate}>
          引入模板
        </Button>
      </div>
      <div className="app-stencil">
        <Collapse
          bordered={false}
          defaultActiveKey={["1", "2"]}
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          className="site-collapse-custom-collapse"
        >
          <Panel header="场景布局" key="1" className="site-collapse-custom-panel">
            <div className="grid-list">
              {list &&
                list.map((m: panelType) => {
                  return <DragMaterial key={m.id} child={m} />;
                })}
            </div>
          </Panel>
          <Panel header="人员排座" key="2" className="site-collapse-custom-panel">
            <PersonTree onRef={innerRef} loadTree$={loadTree$} />
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default CustomNodeCollapsePanel;
