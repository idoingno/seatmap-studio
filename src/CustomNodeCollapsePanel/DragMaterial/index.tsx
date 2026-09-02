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
import { getGraph } from "../../config/graphInstance";
import { panelType } from "../../config/materials";
import store from "../../store";
import { runtimeActions } from "../../store/runtimeSlice";
import { addDargAction } from "../../store/actionCreators";
import useFormModal from "../../Components/useFormModal";
import { lazyForm } from "../../Components/useFormModal/lazyForm";
import AppIcon from "../../Components/AppIcon";
import { markLocalGraphMutation } from "../../utils/querySync";

const InitMatrixForm = lazyForm(() => import("../../Components/useFormModal/InitMatrixForm"));
const InitCircleForm = lazyForm(() => import("../../Components/useFormModal/InitCircleForm"));

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
    InitMatrixForm
  );
  const { modalRef: circleModalRef, FormModal: CircleFormModal } = useFormModal(
    { title: "圆桌配置" },
    InitCircleForm
  );

  useDrag(child, dragRef, {
    onDragStart: (e) => {
      store.dispatch(runtimeActions.setDragNodeType(child.nodeType));
    },

    onDragEnd: (e) => {
      if (!child.draggable) {
        return;
      }

      const graph = getGraph();
      const dragEvent = e as React.DragEvent<Element> & { x?: number; y?: number };
      const x = Number.isFinite(dragEvent.clientX) ? dragEvent.clientX : dragEvent.x;
      const y = Number.isFinite(dragEvent.clientY) ? dragEvent.clientY : dragEvent.y;
      const stage = document.querySelector(".seatmap-stage-shell");
      const stageRect = stage?.getBoundingClientRect();
      const inStage = Boolean(
        graph &&
          stageRect &&
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          x >= stageRect.left &&
          x <= stageRect.right &&
          y >= stageRect.top &&
          y <= stageRect.bottom
      );

      if (
        !inStage
      ) {
        return;
      }

      markLocalGraphMutation();
      const p1 = graph.pageToLocal(x, y);
      if (child.nodeType === "Matrix") {
        matrixModalRef.current?.open({ matrix: { x: p1.x, y: p1.y, graph } });
      } else if (child.nodeType === "Round") {
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
    <div className="material-card">
      <div
        key={child.id}
        ref={dragRef}
        id={child.nodeType}
        draggable={child.draggable}
        className={`material-card-inner${child.draggable ? "" : " is-disabled"}`}
        aria-disabled={!child.draggable}
        aria-label={`${child.name}${child.draggable ? "，拖入画布" : "，当前布局不可添加"}`}
      >
        <span className="material-card-tag" aria-hidden="true">
          <AppIcon name="drag" className="material-card-tag-icon" />
          拖入
        </span>
        <img
          src={child.img}
          alt=""
          title={child.draggable ? `${child.name}，拖入画布` : `${child.name}，当前布局不可添加`}
          node-type={child.nodeType}
          draggable={child.draggable}
        />
      </div>
      <span className="material-card-label">{child.name}</span>
      <MatrixFormModal matrix={null} />
      <CircleFormModal circle={null} />
    </div>
  );
};

export default DragItem;
