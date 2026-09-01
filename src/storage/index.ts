/**
 * 存储后端入口
 *
 * 按 localStorage 的 seatmap-api-mode 选择后端（单例）：
 * - "remote" : 远程后端（INVOKING_IPAAS_CID）
 * - "mock"   : 纯内存（原 mockRequest，开发/E2E）
 * - 其他/缺省: IndexedDB（开源版默认，零后端、可持久化）
 */

import type { SeatmapStore, SeatmapStoreMode } from "./types";
import { createMemoryStore } from "./memoryStore";
import { createIndexedDbStore } from "./indexedDbStore";
import { createHttpStore } from "./httpStore";

export type { SeatmapStore, SeatmapStoreMode } from "./types";

const resolveMode = (): SeatmapStoreMode => {
  const mode = window.localStorage.getItem("seatmap-api-mode");
  if (mode === "remote" || mode === "mock") {
    return mode;
  }
  return "local";
};

let currentStore: SeatmapStore | null = null;

export const getSeatmapStore = (): SeatmapStore => {
  if (!currentStore) {
    const mode = resolveMode();
    currentStore =
      mode === "remote" ? createHttpStore() : mode === "mock" ? createMemoryStore() : createIndexedDbStore();
  }
  return currentStore;
};

/** 测试/切换后端时使用：丢弃当前单例，下次按 seatmap-api-mode 重建 */
export const resetSeatmapStore = (): void => {
  currentStore = null;
};
