/**
 * 纯内存存储后端（原 mockRequest 行为）
 *
 * 状态只活在当前页面生命周期内，刷新即重置为种子数据。
 * 供本地开发与 E2E 使用（seatmap-api-mode = "mock"）。
 */

import type { ResponseType } from "../api";
import type { SeatmapRequest, SeatmapStore } from "./types";
import { createSeedState } from "./stateCore";
import { createStateStore } from "./stateStore";

const MOCK_LATENCY_MS = 350;

export const createMemoryStore = (): SeatmapStore => {
  const inner = createStateStore(createSeedState());

  return {
    ...inner,
    handle(request: SeatmapRequest): Promise<ResponseType> {
      return new Promise((resolve) => {
        window.setTimeout(() => {
          inner.handle(request).then(resolve);
        }, MOCK_LATENCY_MS);
      });
    },
  };
};
