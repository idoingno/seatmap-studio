// 拖拽素材表（左侧面板「布局素材」）及其可见性规则。
// panelArr 为只读源数据；可拖拽状态由 materialsForDragState 派生，禁止就地改 panelArr。

import {
  img_matrix_layout,
  img_round_layout,
  img_transverse_corridor,
  img_vertical_corridor,
  img_window,
  img_proscenium,
  img_door,
} from "../assets/index";

export interface panelType {
  id?: string;
  name?: string;
  img?: string;
  nodeType?: string;
  list?: panelType[];
  draggable?: boolean;
}

export const panelArr: panelType[] = [
  {
    id: "1-1",
    name: "矩阵布局",
    img: img_matrix_layout,
    nodeType: "Matrix",
  },
  {
    id: "1-2",
    name: "圆桌布局",
    img: img_round_layout,
    nodeType: "Round",
  },
  {
    id: "1-3",
    name: "横向走廊",
    img: img_transverse_corridor,
    nodeType: "Aisle",
  },
  {
    id: "1-4",
    name: "竖向走廊",
    img: img_vertical_corridor,
    nodeType: "Corridor",
  },
  {
    id: "1-5",
    name: "舞台",
    img: img_proscenium,
    nodeType: "Proscenium",
  },
  {
    id: "1-6",
    name: "窗户",
    img: img_window,
    nodeType: "Window",
  },
  {
    id: "1-7",
    name: "门",
    img: img_door,
    nodeType: "Door",
  },
];

// 根据当前画布拖拽状态派生素材可用性：
// 已有矩阵时禁止再拖矩阵/圆桌；已有圆桌时禁止矩阵/走廊类；其余全部可拖。
export const materialsForDragState = (dragState: string): panelType[] =>
  panelArr.map((child) => {
    const disabled =
      dragState === "Matrix"
        ? child.nodeType === "Matrix" || child.nodeType === "Round"
        : dragState === "Round"
        ? child.nodeType === "Matrix" || child.nodeType === "Corridor" || child.nodeType === "Aisle"
        : false;
    return { ...child, draggable: !disabled };
  });
