/**
 * 存储后端接口
 *
 * 所有持久化只通过这一条窄缝进出：
 * 上层仍使用 handleCpApi({ params, code })，本模块按 (code, params.type)
 * 分发到语义化方法，由具体后端（内存 / IndexedDB / 远程）实现。
 *
 * - "local"  : IndexedDB，开源版默认，零后端可运行且刷新不丢数据
 * - "mock"   : 纯内存（原 mockRequest 行为），开发/E2E 用
 * - "remote" : 远程后端（INVOKING_IPAAS_CID 协议）
 */

import type { ResponseType } from "../api";

/** 与历史后端 wire 协议一致的请求参数包 */
export interface SeatmapRequest {
  params?: any;
  code?: string;
}

export const success = (response: any = {}): ResponseType => ({
  code: 200,
  subMsgType: "success",
  data: {
    response,
  },
});

/**
 * 存储后端的语义化操作集。
 * 实现方只需要保证与 mockData 时代完全一致的语义与返回形状。
 */
export interface SeatmapStore {
  querySeatmap(): Promise<ResponseType>;
  applyGraph(graphPayloadJson: string): Promise<ResponseType>;
  applyNodes(nodePayloadJson: string, isDelete?: string): Promise<ResponseType>;
  applyPersonnel(personnelJson?: string): Promise<ResponseType>;
  emptySeatmap(graphId?: string): Promise<ResponseType>;

  saveTemplate(name?: string, hallMap?: string): Promise<ResponseType>;
  findTemplates(hallJson?: string): Promise<ResponseType>;
  chooseTemplate(hallTemplateId?: string): Promise<ResponseType>;
  uploadAssignments(uploadDataJson?: string): Promise<ResponseType>;

  listPeople(): Promise<ResponseType>;
  listOrgs(): Promise<ResponseType>;

  /** 兜底聚合响应（未识别的 code），与历史行为保持一致 */
  aggregate(): Promise<ResponseType>;

  /**
   * 统一入口：按 (code, params.type) 分发到上面的语义方法。
   * api/index.ts 只调用此函数。
   */
  handle(request: SeatmapRequest): Promise<ResponseType>;
}

export type SeatmapStoreMode = "local" | "mock" | "remote";
