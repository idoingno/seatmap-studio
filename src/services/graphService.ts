/**
 * Graph Service Layer
 *
 * 封装图相关的 API 写操作，替代调用方直接拼装 apiParams + handleCpApi 的模式。
 * 只保留当前存在真实调用点的两个操作；新增能力应在出现调用点后再添加。
 */

import type { Node } from "@antv/x6";
import { updateGraphics, updateNode, querySeatInfo } from "../utils/apiParams";
import { handleCpApi, ResponseType } from "../api";
import type { SchemaItem } from "../storage/stateCore";

export interface UpdateGraphicsResult {
  success: boolean;
  graphicsParams?: any;
  error?: Error;
}

export interface UpdateNodeResult {
  success: boolean;
  nodeParams?: any;
  error?: Error;
}

/**
 * 更新父节点（matrix/circle 容器或空间元素）的图形参数
 */
export async function updateGraphicsForParent(parent: Node, sessionId: string): Promise<UpdateGraphicsResult> {
  try {
    const graphicsParams = updateGraphics(parent, sessionId);
    await handleCpApi({ params: graphicsParams, code: "seat" }, true);
    return { success: true, graphicsParams };
  } catch (error) {
    console.error("Error updating graphics:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * 批量更新子节点参数（椅子、行列文本等）
 */
export async function updateNodesForParent(
  children: Node[],
  sessionId: string,
  parent: Node
): Promise<UpdateNodeResult> {
  try {
    const nodeParams = updateNode(children, sessionId, parent);
    await handleCpApi({ params: nodeParams, code: "seat" }, true);
    return { success: true, nodeParams };
  } catch (error) {
    console.error("Error updating nodes:", error);
    return { success: false, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// 布局 JSON 导入导出（open-source 独立面）
// 序列化格式与存储后端 query 响应一致（{ schema: SchemaItem[] }），
// 与模板互操作：导出产物可以作为模板 schema 直接复用。
// ---------------------------------------------------------------------------

export interface LayoutExport {
  schema: SchemaItem[];
}

/** 轻量结构校验：schema 必须是含 id/type 字符串的对象数组 */
export const validateLayoutExport = (value: any): value is LayoutExport => {
  const schema = value?.schema ?? (Array.isArray(value) ? value : undefined);
  return (
    Array.isArray(schema) &&
    schema.every(
      (item) => item && typeof item === "object" && typeof item.id === "string" && typeof item.type === "string"
    )
  );
};

/** 导出当前布局为可下载的 JSON 结构；画布为空时返回 null */
export const exportLayout = async (sessionId: string): Promise<LayoutExport | null> => {
  const { code, data, subMsgType }: ResponseType = await handleCpApi({
    params: querySeatInfo(sessionId),
    code: "seat",
  });
  if (code !== 200 || subMsgType !== "success") {
    return null;
  }
  const schema: SchemaItem[] = data?.response?.schema || [];
  return schema.length ? { schema } : null;
};

const toGraphUpdate = (item: SchemaItem) => ({
  update: {
    id: item.id,
    name: item.name,
    s_type: item.type,
    s_x_axis: item.x,
    s_y_axis: item.y,
    s_w: item.w,
    s_h: item.h,
    s_data: item.data,
  },
});

const toNodeUpdate = (item: SchemaItem, sessionId: string) => ({
  update: {
    id: item.id,
    name: item.name,
    s_type: item.type,
    s_x_axis: item.x,
    s_y_axis: item.y,
    s_session: sessionId,
    s_graph: item.pid,
    s_w: item.w,
    s_h: item.h,
    s_visible: item.data?.visible,
    s_data: item.data,
    ...(item.color ? { s_color: item.color } : {}),
  },
});

/**
 * 将外部 JSON 布局写入当前存储后端（先清空现有内容）。
 * 与远程协议保持一致：容器/空间元素走 graph 操作，子节点走 node 操作。
 * 返回 true 表示写入成功。
 */
export const importLayout = async (layout: LayoutExport, sessionId: string): Promise<boolean> => {
  const schema = layout.schema;
  if (!validateLayoutExport(layout)) {
    return false;
  }

  try {
    await handleCpApi({ params: { type: "empty", sessionId }, code: "seat" }, true);

    const containers = schema.filter((item) => !item.pid);
    if (containers.length) {
      await handleCpApi(
        {
          params: {
            type: "graph",
            sessionId,
            asyncOrNot: false,
            graph: JSON.stringify(containers.map(toGraphUpdate)),
          },
          code: "seat",
        },
        true
      );
    }

    const childrenByParent = new Map<string, SchemaItem[]>();
    schema
      .filter((item) => item.pid)
      .forEach((item) => {
        const list = childrenByParent.get(item.pid as string) ?? [];
        list.push(item);
        childrenByParent.set(item.pid as string, list);
      });

    for (const [parentId, children] of childrenByParent) {
      if (!containers.some((item) => item.id === parentId)) {
        console.warn(`importLayout: skipping nodes whose parent is missing (${parentId})`);
        continue;
      }
      await handleCpApi(
        {
          params: {
            type: "node",
            sessionId,
            asyncOrNot: false,
            node: JSON.stringify(children.map((item) => toNodeUpdate(item, sessionId))),
          },
          code: "seat",
        },
        true
      );
    }

    return true;
  } catch (error) {
    console.error("importLayout failed:", error);
    return false;
  }
};
