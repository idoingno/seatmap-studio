/**
 * 远程后端存储（INVOKING_IPAAS_CID 协议）
 *
 * 即原 src/api/index.ts 中的远程分支，原样搬入存储层，
 * 由 seatmap-api-mode = "remote" 激活。连接信息全部来自 localStorage：
 * - seatmap-api-url   : 网关地址（默认 <当前路径>api/seatmap/invoke）
 * - seatmap-api-codes : { [code]: 远程接口编码 } JSON
 * - seatmap-api-crumb : 鉴权 crumb
 */

import type { ResponseType } from "../api";
import type { SeatmapRequest, SeatmapStore } from "./types";

const resolveHost = () =>
  window.location.pathname === "/"
    ? "/"
    : /\/$/.test(window.location.pathname)
      ? window.location.pathname
      : `${window.location.pathname}/`;

const getUrl = () => window.localStorage.getItem("seatmap-api-url") || `${resolveHost()}api/seatmap/invoke`;

const getRemoteCodes = (): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem("seatmap-api-codes") || "{}");
  } catch (error) {
    return {};
  }
};

const errorResponse = (message: string): ResponseType => ({
  code: 500,
  subMsgType: "error",
  data: {
    response: null,
    message,
  },
});

export const createHttpStore = (): SeatmapStore => {
  const invoke = async ({ params, code }: SeatmapRequest): Promise<ResponseType> => {
    const body = {
      code: getRemoteCodes()[code as string],
      invokeType: "INVOKING_IPAAS_CID",
      _crumb: window.localStorage.getItem("seatmap-api-crumb") || "",
      invokeParam: params,
      connectTimeout: 600000,
      socketTimeout: 600000,
    };

    try {
      const response = await fetch(getUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Seatmap API request failed with status ${response.status}`);
      }

      return text ? JSON.parse(text) : {};
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Seatmap API request failed");
    }
  };

  // 远程协议以 (code, type) 为粒度，无语义化本地实现；
  // 语义方法全部委托给统一入口。
  const notImplemented = (): Promise<ResponseType> =>
    Promise.resolve(errorResponse("httpStore: semantic methods are not called directly"));

  return {
    handle: invoke,
    querySeatmap: notImplemented,
    applyGraph: notImplemented,
    applyNodes: notImplemented,
    applyPersonnel: notImplemented,
    emptySeatmap: notImplemented,
    saveTemplate: notImplemented,
    findTemplates: notImplemented,
    chooseTemplate: notImplemented,
    uploadAssignments: notImplemented,
    listPeople: notImplemented,
    listOrgs: notImplemented,
    aggregate: notImplemented,
  };
};
