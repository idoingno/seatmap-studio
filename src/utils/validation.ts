/**
 * 数据验证工具函数
 * 使用 Zod 进行运行时类型验证
 */

import { z } from "zod";
import {
  NodeDataSchema,
  NodeIdSchema,
  NodeTypeSchema,
  ChairIdtSchema,
  MatrixChairDataSchema,
  CircleChairDataSchema,
  ResponseTypeSchema,
} from "../types";

/**
 * 安全解析数据，返回解析结果或默认值
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown, defaultValue: T): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

/**
 * 安全解析数据，返回解析结果或抛出详细错误
 */
export function strictParse<T>(schema: z.ZodType<T>, data: unknown, context: string = "Data validation"): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.path.join(".") + ": " + e.message).join("; ");
    throw new Error(context + " failed: " + errors);
  }
  return result.data;
}

/**
 * 验证节点 ID
 */
export function validateNodeId(id: unknown): id is string {
  return NodeIdSchema.safeParse(id).success;
}

/**
 * 验证节点类型
 */
export function validateNodeType(type: unknown): boolean {
  return NodeTypeSchema.safeParse(type).success;
}

/**
 * 验证椅子 ID 格式，返回行和列索引
 */
export function parseChairIdt(idt: string): { row: number; column: number } | null {
  if (!idt || typeof idt !== "string") {
    console.warn("Invalid chair idt: " + idt + ", expected string");
    return null;
  }

  const parts = idt.split("-");
  if (parts.length !== 2) {
    console.warn("Invalid chair idt format: " + idt + ", expected 'row-column'");
    return null;
  }

  const validFormat = /^\d+-\d+$/.test(idt);
  if (!validFormat) {
    console.warn("Invalid chair idt format: " + idt + ", must be digits separated by -");
    return null;
  }

  const [rowStr, columnStr] = parts;
  const row = parseInt(rowStr, 10);
  const column = parseInt(columnStr, 10);

  if (isNaN(row) || isNaN(column)) {
    console.warn("Invalid chair idt numbers: " + idt);
    return null;
  }

  try {
    ChairIdtSchema.parse(idt);
    return { row, column };
  } catch (error) {
    console.warn("Chair idt validation failed: " + idt, error);
    return null;
  }
}

/**
 * 验证并提取椅子行列信息
 */
export function extractChairIndices(node: {
  data?: { idt?: string };
}): { rowIndex: number; columnIndex: number } | null {
  const idt = node?.data?.idt;
  const parsed = parseChairIdt(idt || "");
  if (!parsed) return null;

  return {
    rowIndex: parsed.row,
    columnIndex: parsed.column,
  };
}

/**
 * 验证节点数据
 */
export function validateNodeData(data: unknown): boolean {
  return NodeDataSchema.safeParse(data).success;
}

/**
 * 验证矩阵椅子数据
 */
export function validateMatrixChairData(data: unknown): boolean {
  return MatrixChairDataSchema.safeParse(data).success;
}

/**
 * 验证圆桌椅子数据
 */
export function validateCircleChairData(data: unknown): boolean {
  return CircleChairDataSchema.safeParse(data).success;
}

/**
 * 验证 API 响应
 */
export function validateAPIResponse<T>(response: unknown, schema: z.ZodType<T>, context: string = "API response"): T {
  const basicResponse = safeParse(ResponseTypeSchema, response, { code: 500, message: "Invalid response" });

  if (basicResponse.code && basicResponse.code !== 200) {
    throw new Error("API error [" + basicResponse.code + "]: " + basicResponse.message);
  }

  if (basicResponse.data !== undefined) {
    return strictParse(schema, basicResponse.data, context);
  }

  throw new Error(context + ": No data in response");
}

/**
 * 安全地从对象中获取属性，带默认值
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const value = path.split(".").reduce((acc, key) => acc?.[key], obj);
    return value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 批量验证数据数组
 */
export function validateArray<T>(schema: z.ZodType<T>, items: unknown[], context: string = "Array validation"): T[] {
  const validItems: T[] = [];
  const errors: string[] = [];

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      const error = result.error.errors.map((e) => e.message).join(", ");
      errors.push("[" + index + "]: " + error);
    }
  });

  if (errors.length > 0) {
    console.warn(context + " - Failed items:\n" + errors.join("\n"));
  }

  return validItems;
}

/**
 * 创建带验证的节点创建函数
 */
export function createValidatedNode<T extends { id: string }>(
  schema: z.ZodType<T>,
  nodeData: unknown,
  context: string = "Node creation"
): T {
  return strictParse(schema, nodeData, context);
}

/**
 * 验证并转换位置数据
 */
export function validatePosition(data: unknown): { x: number; y: number } | null {
  const schema = z.object({
    x: z.number(),
    y: z.number(),
  });

  const result = schema.safeParse(data);

  if (!result.success) {
    return null;
  }

  const { x, y } = result.data;
  // 确保返回非可选的类型
  if (typeof x !== "number" || typeof y !== "number") {
    return null;
  }

  return { x, y };
}

/**
 * 验证并转换尺寸数据
 */
export function validateSize(data: unknown): { width: number; height: number } | null {
  const schema = z.object({
    width: z.number(),
    height: z.number(),
  });

  const result = schema.safeParse(data);

  if (!result.success) {
    return null;
  }

  const { width, height } = result.data;
  // 确保返回非可选的类型
  if (typeof width !== "number" || typeof height !== "number") {
    return null;
  }

  return { width, height };
}

/**
 * 类型守卫：检查是否为 X6 节点
 */
export function isX6Node(obj: any): obj is { id: string; getData(): unknown } {
  return typeof obj?.id === "string" && typeof obj?.getData === "function";
}

/**
 * 类型守卫：检查是否为 X6 图
 */
export function isX6Graph(obj: any): obj is { getNodes(): any[]; getCells(): any[] } {
  return typeof obj?.getNodes === "function" && typeof obj?.getCells === "function";
}

/**
 * 获取验证报告（用于调试）
 */
export function generateValidationReport<T>(
  schema: z.ZodType<T>,
  data: unknown
): { valid: boolean; data: T | null; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      valid: true,
      data: result.data,
      errors: [],
    };
  }

  return {
    valid: false,
    data: null,
    errors: result.error.errors.map((e) => e.path.join(".") + ": " + e.message),
  };
}
