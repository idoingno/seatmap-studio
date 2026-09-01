/**
 * IndexedDB 存储后端（开源版默认，seatmap-api-mode = "local"）
 *
 * 零后端可运行：座位图结构、模板、人员名单全部持久化在浏览器 IndexedDB，
 * 刷新/重开页面数据不丢；首次打开用内置演示种子初始化。
 *
 * 实现策略：操作语义与内存后端完全一致（共享 createStateStore），
 * 内存态作为读写工作区，每次变更后整体写回 IndexedDB。
 * 座位图数据量（数百节点级）下整体写回的代价可以忽略，
 * 换来的是与 mock 后端逐行一致的行为。
 */

import Dexie, { Table } from "dexie";
import type { ResponseType } from "../api";
import type { SeatmapRequest, SeatmapStore } from "./types";
import { createSeedState, SeatmapState, deepClone } from "./stateCore";
import { createStateStore } from "./stateStore";

const DB_NAME = "seatmap-studio";
const STATE_KEY = "current";

interface StateRow {
  id: string;
  state: SeatmapState;
}

class SeatmapDatabase extends Dexie {
  seatmapState!: Table<StateRow, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      // 单行整张快照表：id 恒为 "current"
      seatmapState: "id",
    });
  }
}

export const createIndexedDbStore = (): SeatmapStore => {
  const db = new SeatmapDatabase();
  let ready: Promise<SeatmapStore> | null = null;

  const hydrate = async (): Promise<SeatmapStore> => {
    let state: SeatmapState;
    try {
      const row = await db.seatmapState.get(STATE_KEY);
      state = row?.state
        ? {
            currentSchema: row.state.currentSchema || [],
            templates: row.state.templates || [],
            people: row.state.people || [],
          }
        : createSeedState();
    } catch (error) {
      console.warn("indexedDbStore: failed to read persisted state, falling back to seed state", error);
      state = createSeedState();
    }

    const persist = async () => {
      try {
        await db.seatmapState.put({ id: STATE_KEY, state: deepClone(state) });
      } catch (error) {
        console.warn("indexedDbStore: failed to persist state", error);
      }
    };

    if (!(await db.seatmapState.get(STATE_KEY))) {
      await persist();
    }

    return createStateStore(state, { onChange: persist });
  };

  const ensureReady = (): Promise<SeatmapStore> => {
    if (!ready) {
      ready = hydrate();
    }
    return ready;
  };

  const dispatch = (method: (store: SeatmapStore) => Promise<ResponseType>): Promise<ResponseType> =>
    ensureReady().then(method);

  return {
    handle(request: SeatmapRequest): Promise<ResponseType> {
      return dispatch((store) => store.handle(request));
    },
    querySeatmap: () => dispatch((store) => store.querySeatmap()),
    applyGraph: (graphPayloadJson) => dispatch((store) => store.applyGraph(graphPayloadJson)),
    applyNodes: (nodePayloadJson, isDelete) => dispatch((store) => store.applyNodes(nodePayloadJson, isDelete)),
    applyPersonnel: (personnelJson) => dispatch((store) => store.applyPersonnel(personnelJson)),
    emptySeatmap: (graphId) => dispatch((store) => store.emptySeatmap(graphId)),
    saveTemplate: (name, hallMap) => dispatch((store) => store.saveTemplate(name, hallMap)),
    findTemplates: (hallJson) => dispatch((store) => store.findTemplates(hallJson)),
    chooseTemplate: (hallTemplateId) => dispatch((store) => store.chooseTemplate(hallTemplateId)),
    uploadAssignments: (uploadDataJson) => dispatch((store) => store.uploadAssignments(uploadDataJson)),
    listPeople: () => dispatch((store) => store.listPeople()),
    listOrgs: () => dispatch((store) => store.listOrgs()),
    aggregate: () => dispatch((store) => store.aggregate()),
  };
};
