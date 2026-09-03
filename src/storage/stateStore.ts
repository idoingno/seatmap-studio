/**
 * 基于 SeatmapState 的 SeatmapStore 实现工厂。
 *
 * 内存后端与 IndexedDB 后端共享同一份操作语义：
 * 先变更内存态，再通过 onChange 钩子持久化。
 */

import type { ResponseType } from "../api";
import { type SeatmapRequest, type SeatmapStore, success } from "./types";
import {
  SeatmapState,
  addTemplate,
  applyPersonnelUpdates,
  applyUploadAssignments,
  deepClone,
  deleteSchemaItems,
  emptySeatmapState,
  findTemplateById,
  findTemplatesByKeyword,
  orgList,
  upsertSchemaItems,
} from "./stateCore";

export interface StateStoreOptions {
  /** 状态发生变更后调用（IndexedDB 后端在此写入持久层） */
  onChange?: () => void | Promise<void>;
}

export const createStateStore = (state: SeatmapState, options: StateStoreOptions = {}): SeatmapStore => {
  const changed = async () => {
    await options.onChange?.();
  };

  const store: SeatmapStore = {
    async querySeatmap(): Promise<ResponseType> {
      return success({ schema: deepClone(state.currentSchema) });
    },

    async applyGraph(graphPayloadJson: string): Promise<ResponseType> {
      const payload = JSON.parse(graphPayloadJson || "[]");
      upsertSchemaItems(state, payload);
      await changed();
      return success();
    },

    async applyNodes(nodePayloadJson: string, isDelete?: string): Promise<ResponseType> {
      if (isDelete === "true") {
        const ids = (JSON.parse(nodePayloadJson || "[]") as Array<{ id: string }>).map((item) => item.id);
        deleteSchemaItems(state, ids);
        await changed();
        return success();
      }

      const payload = JSON.parse(nodePayloadJson || "[]");
      upsertSchemaItems(state, payload);
      await changed();
      return success();
    },

    async applyPersonnel(personnelJson?: string): Promise<ResponseType> {
      if (!personnelJson) {
        state.people = state.people.map((person) => ({
          ...person,
          s_node_id: undefined,
          s_node_name: undefined,
          s_seat: undefined,
          s_seat_english: undefined,
        }));
        await changed();
        return success();
      }

      const payload = JSON.parse(personnelJson || "[]");
      applyPersonnelUpdates(state, payload);
      await changed();
      return success();
    },

    async emptySeatmap(graphId?: string): Promise<ResponseType> {
      emptySeatmapState(state, graphId);
      await changed();
      return success();
    },

    async saveTemplate(name?: string, hallMap?: string): Promise<ResponseType> {
      const id = addTemplate(state, name, hallMap);
      await changed();
      return success({ id });
    },

    async findTemplates(hallJson?: string): Promise<ResponseType> {
      const parsedHall = hallJson ? JSON.parse(hallJson) : {};
      const dataList = findTemplatesByKeyword(state, parsedHall.name);
      return success({
        dataList: dataList.map(({ schema, ...item }) => item),
        total: dataList.length,
      });
    },

    async chooseTemplate(hallTemplateId?: string): Promise<ResponseType> {
      const selected = findTemplateById(state, hallTemplateId);
      state.currentSchema = deepClone(selected?.schema ?? []);
      await changed();
      return success({ id: selected?.id || hallTemplateId });
    },

    async uploadAssignments(uploadDataJson?: string): Promise<ResponseType> {
      const uploadData = JSON.parse(uploadDataJson || "[]");
      applyUploadAssignments(state, uploadData);
      await changed();
      return success({ count: uploadData.length });
    },

    async listPeople(): Promise<ResponseType> {
      return success({ result: deepClone(state.people) });
    },

    async listOrgs(): Promise<ResponseType> {
      return success({ subList: deepClone(orgList) });
    },

    async aggregate(): Promise<ResponseType> {
      return success({
        result: deepClone(state.people),
        subList: deepClone(orgList),
        dataList: state.templates.map(({ schema, ...item }) => item),
        total: state.templates.length,
        schema: deepClone(state.currentSchema),
      });
    },

    handle(request: SeatmapRequest): Promise<ResponseType> {
      const { params = {}, code } = request;
      const type = params?.type;

      if (code === "seat" && type === "query") return store.querySeatmap();
      if (code === "seat" && type === "graph") return store.applyGraph(params?.graph || "[]");
      if (code === "seat" && type === "node") return store.applyNodes(params?.node || "[]", params?.isDelete);
      if (code === "seat" && type === "personnel") return store.applyPersonnel(params?.personnel);
      if (code === "seat" && type === "empty") return store.emptySeatmap(params?.graphId);

      if (code === "template" && type === "save") return store.saveTemplate(params?.name, params?.hallMap);
      if (code === "template" && type === "find") return store.findTemplates(params?.hall);
      if (code === "template" && type === "choose") return store.chooseTemplate(params?.hallTemplateId);
      if (code === "template" && type === "upload") return store.uploadAssignments(params?.uploadData);

      if (code === "person") return store.listPeople();
      if (code === "org") return store.listOrgs();

      return store.aggregate();
    },
  };

  return store;
};
