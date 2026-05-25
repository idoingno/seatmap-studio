import { useDrop, useDrag } from "ahooks";
import React, { useEffect, useRef, useState } from "react";
import {
  initMatrix,
  handleOffsetCorridor,
  handleOffsetAisle,
  initProscenium,
  initWindow,
  initDoor,
} from "../../CreateMatrix";
import { IsDragElement, MatrixSize, getGraph, panelType, setDragNodeType } from "../../config";
import store from "../../store";
import { addDargAction } from "../../store/actionCreators";
// import { initCircle } from "../../CreateCircle";
import useFormModal from "../../Components/useFormModal";
import InitMatrixForm from "../../Components/useFormModal/InitMatrixForm";
import InitCircleForm from "../../Components/useFormModal/InitCircleForm";

interface IMyProps {
  child: {
    id?: string;
    name?: string;
    img?: string;
    list?: panelType[];
    nodeType?: string;
    draggable?: boolean;
  };
}

const DragItem: React.FC<IMyProps> = ({ child }) => {
  const dragRef = useRef(null);

  const { modalRef: matrixModalRef, FormModal: MatrixFormModal } = useFormModal(
    { title: "矩阵配置" },
    React.forwardRef(InitMatrixForm)
  );
  const { modalRef: circleModalRef, FormModal: CircleFormModal } = useFormModal(
    { title: "圆桌配置" },
    React.forwardRef(InitCircleForm)
  );

  useDrag(child, dragRef, {
    onDragStart: (e) => {
      setDragNodeType(child.nodeType);
    },

    onDragEnd: (e) => {
      const graph = getGraph();
      const { x, y } = e as React.DragEvent<Element> & { x: number; y: number };

      const p1 = graph.pageToLocal(x, y);
      if (child.nodeType === "Matrix") {
        matrixModalRef.current?.open({ matrix: { x: p1.x, y: p1.y, graph } });
        // initMatrix(p1.x, p1.y, graph);
      } else if (child.nodeType === "Round") {
        // initCircle(p1.x, p1.y, graph);
        circleModalRef.current?.open({ circle: { x: p1.x, y: p1.y, graph } });
      } else if (child.nodeType === "Corridor") {
        handleOffsetCorridor("add");
      } else if (child.nodeType === "Aisle") {
        handleOffsetAisle("add");
      } else if (child.nodeType === "Proscenium") {
        initProscenium(p1.x, p1.y, graph);
      } else if (child.nodeType === "Window") {
        initWindow(p1.x, p1.y, graph);
      } else if (child.nodeType === "Door") {
        initDoor(p1.x, p1.y, graph);
      }
    },
  });

  return (
    <div>
      <div key={child.id} ref={dragRef} id={child.nodeType} draggable={child.draggable}>
        <img src={child.img} title={child.name} node-type={child.nodeType} draggable={child.draggable} />
      </div>
      <MatrixFormModal matrix={null} />
      <CircleFormModal circle={null} />
    </div>
  );
};

export default DragItem;
