/**
 * 统一的类型定义和 Zod Schema
 * 用于运行时类型验证
 */

import { z } from "zod";

// ============================================================================
// 基础类型
// ============================================================================

export const NodeIdSchema = z.string();
export type NodeId = z.infer<typeof NodeIdSchema>;

export const SessionIdSchema = z.string().optional();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});
export type Size = z.infer<typeof SizeSchema>;

// ============================================================================
// 节点类型 Schema
// ============================================================================

export const NodeTypeSchema = z.enum([
  "matrixContainer",
  "matrixChair",
  "matrixRows",
  "matrixRowsEn",
  "matrixColumnTopNum",
  "matrixColumnBottomNum",
  "aisleRowSpace",
  "corridorColumnSpace",
  "circleContainer",
  "circleChair",
  "circleTable",
  "prosceniumNode",
  "windowNode",
  "doorNode",
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

// 椅子标识符格式: "row-column" 例如 "0-1"
export const ChairIdtSchema = z.string().regex(/^\d+-\d+$/, "Invalid chair idt format, expected 'row-column'");
export type ChairIdt = z.infer<typeof ChairIdtSchema>;

// ============================================================================
// 矩阵节点 Schema
// ============================================================================

export const MatrixChairDataSchema = z.object({
  nodeType: z.literal("matrixChair"),
  idt: ChairIdtSchema,
  matrixChairName: z.string(),
  matrixChairNameEn: z.string(),
  matrixChairTopName: z.string(),
  matrixChairBottomName: z.string(),
  visible: z.boolean().default(true),
  disableMove: z.boolean().default(true),
});

export const MatrixContainerDataSchema = z.object({
  nodeType: z.literal("matrixContainer"),
  disableMove: z.boolean().default(false),
  tableNameIdx: z.number().optional(),
});

export const MatrixTextDataSchema = z.union([
  z.object({
    nodeType: z.literal("matrixRows"),
    idx: z.number(),
    idt: z.string(),
    disableMove: z.boolean().default(true),
  }),
  z.object({
    nodeType: z.literal("matrixRowsEn"),
    idx: z.number(),
    idt: z.string(),
    disableMove: z.boolean().default(true),
  }),
  z.object({
    nodeType: z.literal("matrixColumnTopNum"),
    idx: z.number(),
    disableMove: z.boolean().default(true),
  }),
  z.object({
    nodeType: z.literal("matrixColumnBottomNum"),
    idx: z.number(),
    disableMove: z.boolean().default(true),
  }),
]);

export const AisleSpaceSchema = z.object({
  nodeType: z.literal("aisleRowSpace"),
  idx: z.number(),
  idt: z.string(),
  isExist: z.boolean().default(false),
  disableMove: z.boolean().default(true),
});

export const CorridorSpaceSchema = z.object({
  nodeType: z.literal("corridorColumnSpace"),
  idx: z.number(),
  idt: z.string(),
  disableMove: z.boolean().default(true),
});

// ============================================================================
// 圆桌节点 Schema
// ============================================================================

export const CircleContainerDataSchema = z.object({
  nodeType: z.literal("circleContainer"),
  circleChairNum: z.number(),
  tableName: z.string(),
  tableNameEn: z.string(),
  tableNameIdx: z.number(),
  disableMove: z.boolean().default(false),
});

export const CircleTableDataSchema = z.object({
  nodeType: z.literal("circleTable"),
  tableName: z.string(),
  tableNameEn: z.string(),
  tableNameIdx: z.number(),
  disableMove: z.boolean().default(true),
});

export const CircleChairDataSchema = z.object({
  nodeType: z.literal("circleChair"),
  tableName: z.string(),
  tableNameEn: z.string(),
  idx: z.number(),
  visible: z.boolean().default(true),
  disableMove: z.boolean().default(true),
});

// ============================================================================
// 空间元素 Schema
// ============================================================================

export const SpaceElementDataSchema = z.union([
  z.object({
    nodeType: z.literal("prosceniumNode"),
    disableMove: z.boolean().default(false),
  }),
  z.object({
    nodeType: z.literal("windowNode"),
    disableMove: z.boolean().default(false),
  }),
  z.object({
    nodeType: z.literal("doorNode"),
    disableMove: z.boolean().default(false),
  }),
]);

// ============================================================================
// 通用节点数据 Schema
// ============================================================================

export const NodeDataSchema = z.union([
  MatrixChairDataSchema,
  MatrixContainerDataSchema,
  MatrixTextDataSchema,
  AisleSpaceSchema,
  CorridorSpaceSchema,
  CircleContainerDataSchema,
  CircleTableDataSchema,
  CircleChairDataSchema,
  SpaceElementDataSchema,
  z.object({
    nodeType: NodeTypeSchema,
    // 允许其他扩展字段
  }).passthrough(),
]);
export type NodeData = z.infer<typeof NodeDataSchema>;

// ============================================================================
// 节点 Schema
// ============================================================================

export const NodeAttributeSchema = z.object({
  // 文本属性
  text: z.object({
    text: z.string().optional(),
    fill: z.string().optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    fontStyle: z.string().optional(),
    textAnchor: z.string().optional(),
    textVerticalAnchor: z.string().optional(),
  }).optional(),
  
  // 主体属性
  body: z.object({
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    rx: z.number().optional(),
    ry: z.number().optional(),
  }).optional(),
  
  // SVG 属性
  svg: z.object({
    fill: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    style: z.string().optional(),
  }).optional(),
  
  // 图片属性
  image: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    style: z.string().optional(),
    "xlink:href": z.string().optional(),
  }).optional(),
  
  // 标签属性
  label: z.object({
    text: z.string().optional(),
    fill: z.string().optional(),
    refY: z.number().optional(),
  }).optional(),
  
  // 圆桌特殊属性
  circle: z.object({}).optional(),
  text1: z.object({
    text: z.string().optional(),
    fontSize: z.number().optional(),
    fill: z.string().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    letterSpacing: z.number().optional(),
  }).optional(),
  text2: z.object({
    text: z.string().optional(),
    fontSize: z.number().optional(),
    fill: z.string().optional(),
    y: z.number().optional(),
  }).optional(),
  
  // XNode 属性（人员信息）
  xnode: z.object({
    key: z.string(),
    title: z.string(),
    subTitle: z.string().optional(),
    otherName: z.string().optional(),
    orgType: z.string().optional(),
    row: z.number().optional(),
    column: z.number().optional(),
    circleChairName: z.string().optional(),
    circleChairNameEn: z.string().optional(),
  }).optional(),
  
  // 允许其他扩展属性
}).passthrough();

export const BaseNodeSchema = z.object({
  id: NodeIdSchema,
  shape: z.string().optional(),
  position: PositionSchema.optional(),
  size: SizeSchema.optional(),
  parent: NodeIdSchema.nullable().optional(),
  children: z.array(NodeIdSchema).optional(),
  data: NodeDataSchema.optional(),
  attrs: z.record(z.any()).optional(), // 暂时使用 any，后续细化
  markup: z.array(z.any()).optional(),
  tools: z.array(z.any()).optional(),
  label: z.string().optional(),
  zIndex: z.number().optional(),
});

export type BaseNode = z.infer<typeof BaseNodeSchema>;

// ============================================================================
// API 响应 Schema
// ============================================================================

export const ResponseTypeSchema = z.object({
  code: z.number().optional(),
  subMsgType: z.string().optional(),
  data: z.any().optional(),
  message: z.string().optional(),
});
export type ResponseType = z.infer<typeof ResponseTypeSchema>;

export const PaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// ============================================================================
// 人员 Schema
// ============================================================================

export const PersonSchema = z.object({
  id: z.string(),
  nodeId: z.string().optional(),
  title: z.string(),
  subTitle: z.string().optional(),
  otherName: z.string().optional(),
  orgType: z.enum(["org", "pattern"]),
  avatar: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(["未排座", "已排座", "不参加"]).default("未排座"),
  seatName: z.string().optional(),
  seatNameEn: z.string().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

export const PersonTreeItemSchema: any = z.object({
  id: z.string(),
  title: z.string(),
  key: z.string(),
  children: z.lazy(() => z.array(z.any())).optional(),
  isLeaf: z.boolean().optional(),
  person: PersonSchema.optional(),
});
export type PersonTreeItem = z.infer<typeof PersonTreeItemSchema>;

// ============================================================================
// API 请求 Schema
// ============================================================================

export const UpdateNodeRequestSchema = z.object({
  type: z.literal("node"),
  sessionId: SessionIdSchema,
  asyncOrNot: z.boolean().default(false),
  node: z.string(), // JSON string
});

export const UpdateGraphicsRequestSchema = z.object({
  type: z.literal("graph"),
  sessionId: SessionIdSchema,
  asyncOrNot: z.boolean().default(false),
  graph: z.string(), // JSON string
});

export const DeleteNodeRequestSchema = z.object({
  type: z.literal("node"),
  sessionId: SessionIdSchema,
  isDelete: z.literal("true"),
  node: z.string(), // JSON string
});

export const PersonnelRequestSchema = z.object({
  type: z.literal("personnel"),
  sessionId: SessionIdSchema.optional(),
  asyncOrNot: z.boolean().default(true),
  personnel: z.string(), // JSON string
});

export const QuerySeatRequestSchema = z.object({
  type: z.literal("query"),
  sessionId: SessionIdSchema,
});

export const EmptyGraphRequestSchema = z.object({
  type: z.literal("empty"),
  sessionId: SessionIdSchema,
  graphId: z.string().optional(),
});

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 安全解析椅子 ID，提取行和列
 *
 * 注意：唯一实现位于 ../utils/validation.ts（校验更严格）；
 * 此处只做 re-export 以保持 `types` 作为类型/辅助函数入口的对外面，避免双实现漂移。
 */
export { parseChairIdt } from "../utils/validation";

/**
 * 验证节点数据
 */
export function validateNodeData(data: unknown, expectedNodeType: NodeType): NodeData | null {
  try {
    // 根据预期的节点类型进行验证
    switch (expectedNodeType) {
      case "matrixChair":
        return MatrixChairDataSchema.parse(data) as NodeData;
      case "matrixContainer":
        return MatrixContainerDataSchema.parse(data) as NodeData;
      case "circleContainer":
        return CircleContainerDataSchema.parse(data) as NodeData;
      case "circleChair":
        return CircleChairDataSchema.parse(data) as NodeData;
      default:
        return NodeDataSchema.parse(data) as NodeData;
    }
  } catch (error) {
    console.error(`Failed to validate node data for type ${expectedNodeType}:`, error);
    return null;
  }
}

/**
 * 创建类型守卫函数
 */
export function isMatrixChair(data: unknown): data is z.infer<typeof MatrixChairDataSchema> {
  const result = MatrixChairDataSchema.safeParse(data);
  return result.success;
}

export function isCircleChair(data: unknown): data is z.infer<typeof CircleChairDataSchema> {
  const result = CircleChairDataSchema.safeParse(data);
  return result.success;
}

export function isMatrixContainer(data: unknown): data is z.infer<typeof MatrixContainerDataSchema> {
  const result = MatrixContainerDataSchema.safeParse(data);
  return result.success;
}