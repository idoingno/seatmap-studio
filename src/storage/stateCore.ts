/**
 * 座位图存储状态核心
 *
 * 从原 src/api/mockData.ts 提取：所有存储后端共享的数据类型、种子数据
 * 和纯状态变更逻辑。后端（内存 / IndexedDB / 远程）各持有这些数据，
 * 通过本模块的纯函数完成变更，保证行为一致。
 */

export type SchemaItem = {
  id: string;
  pid?: string | null;
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  data: Record<string, any>;
  color?: string;
};

export type TemplateRecord = {
  id: string;
  name: string;
  s_hall_map: string;
  schema: SchemaItem[];
};

export type PersonRecord = {
  id: string;
  s_field_96bkqmtqbo: string;
  s_field_hhac39dspg: string;
  s_field_mi16acq0er: string;
  s_field_xxu9wjskm8: string;
  s_node_id?: string;
  s_node_name?: string;
  s_seat?: string;
  s_seat_english?: string;
};

export type SeatmapState = {
  currentSchema: SchemaItem[];
  templates: TemplateRecord[];
  people: PersonRecord[];
};

export const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const templatePreview =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220"><rect width="360" height="220" fill="#f7f4ef"/><rect x="42" y="38" width="276" height="144" rx="6" fill="#fff" stroke="#d8c7b4"/><g fill="#b39372"><circle cx="108" cy="92" r="12"/><circle cx="150" cy="92" r="12"/><circle cx="192" cy="92" r="12"/><circle cx="234" cy="92" r="12"/><circle cx="108" cy="132" r="12"/><circle cx="150" cy="132" r="12"/><circle cx="192" cy="132" r="12"/><circle cx="234" cy="132" r="12"/></g><text x="180" y="176" text-anchor="middle" font-size="16" fill="#5b4a3a">Demo Seatmap</text></svg>'
  );

const CHAIR_SIZE = 40;
const SPACE_SIZE = 10;
const PARENT_TOP_BOTTOM = 30;
const PARENT_LEFT_RIGHT = 60;
const AISLE_SIZE = 60;
const CHAIR_STEP = CHAIR_SIZE + SPACE_SIZE;

const makeSchemaItem = (
  item: Partial<SchemaItem> & Pick<SchemaItem, "id" | "name" | "type" | "x" | "y" | "w" | "h" | "data">
): SchemaItem => ({
  pid: null,
  ...item,
});

export const createMatrixTemplateSchema = (
  idPrefix: string,
  name: string,
  rows: number,
  columns: number,
  x = 240,
  y = 120
) => {
  const parentWidth = CHAIR_STEP * columns + SPACE_SIZE + PARENT_LEFT_RIGHT * 2;
  const parentHeight = CHAIR_STEP * rows + SPACE_SIZE + PARENT_TOP_BOTTOM * 2;
  const parentId = `${idPrefix}-matrix`;
  const chairBaseX = x + SPACE_SIZE + PARENT_LEFT_RIGHT;
  const rowTextX = x + SPACE_SIZE / 2;
  const rowTextEnX = x + PARENT_LEFT_RIGHT + CHAIR_STEP * columns;
  const topNumberY = y + SPACE_SIZE;
  const bottomNumberY = y + parentHeight - PARENT_TOP_BOTTOM - SPACE_SIZE;
  const rowBaseY = y + SPACE_SIZE + PARENT_TOP_BOTTOM;

  const schema: SchemaItem[] = [
    makeSchemaItem({
      id: parentId,
      name,
      type: "matrixContainer",
      x,
      y,
      w: parentWidth,
      h: parentHeight,
      data: {
        disableMove: false,
        nodeType: "matrixContainer",
        rows,
        columns,
      },
    }),
  ];

  for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
    const columnLabel = `${columnIndex + 1}`;
    const chairX = chairBaseX + columnIndex * CHAIR_STEP;

    schema.push(
      makeSchemaItem({
        id: `${idPrefix}-top-${columnIndex}`,
        pid: parentId,
        name: columnLabel,
        type: "matrixColumnTopNum",
        x: x + columnIndex * CHAIR_STEP + SPACE_SIZE + AISLE_SIZE,
        y: topNumberY,
        w: CHAIR_SIZE,
        h: PARENT_TOP_BOTTOM,
        data: {
          disableMove: true,
          nodeType: "matrixColumnTopNum",
          idx: columnIndex,
          idt: `matrixColumnTopNum-${columnIndex}`,
        },
      }),
      makeSchemaItem({
        id: `${idPrefix}-bottom-${columnIndex}`,
        pid: parentId,
        name: columnLabel,
        type: "matrixColumnBottomNum",
        x: chairX,
        y: bottomNumberY,
        w: CHAIR_SIZE,
        h: PARENT_TOP_BOTTOM,
        data: {
          disableMove: true,
          nodeType: "matrixColumnBottomNum",
          idx: columnIndex,
          idt: `matrixColumnBottomNum-${columnIndex}`,
        },
      })
    );
  }

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const rowLabel = `第${rowIndex + 1}排`;
    const rowLabelEn = `Row ${rowIndex + 1}`;
    const chairNameEn = `Row${rowIndex + 1}`;
    const rowY = rowBaseY + rowIndex * CHAIR_STEP;

    schema.push(
      makeSchemaItem({
        id: `${idPrefix}-row-${rowIndex}`,
        pid: parentId,
        name: rowLabel,
        type: "matrixRows",
        x: rowTextX,
        y: rowY,
        w: CHAIR_SIZE + 20,
        h: CHAIR_SIZE,
        data: {
          disableMove: true,
          nodeType: "matrixRows",
          idx: rowIndex,
          idt: `row-${rowIndex}`,
        },
      }),
      makeSchemaItem({
        id: `${idPrefix}-row-en-${rowIndex}`,
        pid: parentId,
        name: rowLabelEn,
        type: "matrixRowsEn",
        x: rowTextEnX,
        y: rowY,
        w: CHAIR_SIZE + 20,
        h: CHAIR_SIZE,
        data: {
          disableMove: true,
          nodeType: "matrixRowsEn",
          idx: rowIndex,
          idt: `rowEn-${rowIndex}`,
        },
      })
    );

    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const columnLabel = `${columnIndex + 1}`;
      schema.push(
        makeSchemaItem({
          id: `${idPrefix}-chair-${rowIndex}-${columnIndex}`,
          pid: parentId,
          name: "",
          type: "matrixChair",
          x: chairBaseX + columnIndex * CHAIR_STEP,
          y: rowY,
          w: CHAIR_SIZE,
          h: CHAIR_SIZE,
          data: {
            disableMove: true,
            nodeType: "matrixChair",
            visible: true,
            idx: rowIndex,
            idt: `${rowIndex}-${columnIndex}`,
            matrixChairName: rowLabel,
            matrixChairNameEn: chairNameEn,
            matrixChairTopName: columnLabel,
            matrixChairBottomName: columnLabel,
          },
        })
      );
    }
  }

  return schema;
};

export const orgList = [
  {
    fullPath: "|root|product|",
    id: "product",
    name: "Product",
    checked: false,
    subList: [
      {
        fullPath: "|root|product|design|",
        id: "design",
        name: "Design",
        checked: false,
      },
      {
        fullPath: "|root|product|research|",
        id: "research",
        name: "Research",
        checked: false,
      },
    ],
  },
  {
    fullPath: "|root|engineering|",
    id: "engineering",
    name: "Engineering",
    checked: false,
    subList: [
      {
        fullPath: "|root|engineering|frontend|",
        id: "frontend",
        name: "Frontend",
        checked: false,
      },
      {
        fullPath: "|root|engineering|platform|",
        id: "platform",
        name: "Platform",
        checked: false,
      },
    ],
  },
  {
    fullPath: "|root|guests|",
    id: "guests",
    name: "Guests",
    checked: false,
  },
];

export const peopleSeed: PersonRecord[] = [
  {
    id: "person-ada",
    s_field_96bkqmtqbo: "Ada Chen",
    s_field_hhac39dspg: "Product Designer",
    s_field_mi16acq0er: "ADA",
    s_field_xxu9wjskm8: "design",
  },
  {
    id: "person-ben",
    s_field_96bkqmtqbo: "Ben Lin",
    s_field_hhac39dspg: "Frontend Engineer",
    s_field_mi16acq0er: "BEN",
    s_field_xxu9wjskm8: "frontend",
  },
  {
    id: "person-claire",
    s_field_96bkqmtqbo: "Claire Zhou",
    s_field_hhac39dspg: "Research Lead",
    s_field_mi16acq0er: "CLAIRE",
    s_field_xxu9wjskm8: "research",
  },
  {
    id: "person-devon",
    s_field_96bkqmtqbo: "Devon Wu",
    s_field_hhac39dspg: "Platform Engineer",
    s_field_mi16acq0er: "DEVON",
    s_field_xxu9wjskm8: "platform",
  },
  {
    id: "guest-lee",
    s_field_96bkqmtqbo: "Lee Park",
    s_field_hhac39dspg: "Guest Speaker",
    s_field_mi16acq0er: "LEE",
    s_field_xxu9wjskm8: "guests",
  },
  {
    id: "guest-morgan",
    s_field_96bkqmtqbo: "Morgan Yu",
    s_field_hhac39dspg: "Guest",
    s_field_mi16acq0er: "MORGAN",
    s_field_xxu9wjskm8: "guests",
  },
];

export const templateSeed: TemplateRecord[] = [
  {
    id: "template-boardroom",
    name: "Boardroom Demo",
    s_hall_map: templatePreview,
    schema: createMatrixTemplateSchema("boardroom", "Boardroom Demo", 2, 4, 240, 120),
  },
  {
    id: "template-workshop",
    name: "Workshop Demo",
    s_hall_map: templatePreview,
    schema: createMatrixTemplateSchema("workshop", "Workshop Demo", 4, 5, 220, 100),
  },
  {
    id: "template-roundtable",
    name: "Roundtable Demo",
    s_hall_map: templatePreview,
    schema: createMatrixTemplateSchema("roundtable", "Roundtable Demo", 3, 3, 260, 140),
  },
];

export const createSeedState = (): SeatmapState => ({
  currentSchema: [],
  templates: deepClone(templateSeed),
  people: deepClone(peopleSeed),
});

// ---------------------------------------------------------------------------
// 纯状态变更逻辑（所有后端共享）
// ---------------------------------------------------------------------------

const toSchemaItem = (update: any): SchemaItem => ({
  id: update.id,
  pid: update.s_graph || null,
  name: update.name || "",
  type: update.s_type,
  x: update.s_x_axis,
  y: update.s_y_axis,
  w: update.s_w,
  h: update.s_h,
  data: update.s_data || {},
  color: update.s_color,
});

export const upsertSchemaItems = (state: SeatmapState, payload: any[]): void => {
  const schemaById = new Map(state.currentSchema.map((item) => [item.id, item]));
  payload.forEach((entry) => {
    const update = entry.update || entry;
    if (!update?.id) {
      return;
    }
    schemaById.set(update.id, toSchemaItem(update));
  });
  state.currentSchema = [...schemaById.values()];
};

export const clearPeopleSeatState = (state: SeatmapState): void => {
  state.people = state.people.map((person) => ({
    ...person,
    s_node_id: undefined,
    s_node_name: undefined,
    s_seat: undefined,
    s_seat_english: undefined,
  }));
};

export const applyPersonnelUpdates = (state: SeatmapState, payload: any[]): void => {
  const byPersonId = new Map(state.people.map((person) => [person.id, person]));
  payload.forEach((entry) => {
    const id = entry?.query?.id;
    const current = byPersonId.get(id);
    if (!current) {
      return;
    }
    const update = entry.update || {};
    byPersonId.set(id, {
      ...current,
      s_node_id: update.s_node_id,
      s_node_name: update.s_node_name,
      s_seat: update.s_seat,
      s_seat_english: update.s_seat_english,
    });
  });
  state.people = [...byPersonId.values()];
};

export const applyUploadAssignments = (
  state: SeatmapState,
  uploadData: Array<{ name: string; idt: string; seat: string }>
): void => {
  clearPeopleSeatState(state);
  const schemaByIdt = new Map(
    state.currentSchema
      .filter((item) => item.type === "matrixChair" && item.data?.idt)
      .map((item) => [String(item.data.idt), item])
  );

  state.people = state.people.map((person) => {
    const assignment = uploadData.find((item) => item.name === person.s_field_96bkqmtqbo);
    if (!assignment) {
      return person;
    }

    const node = schemaByIdt.get(assignment.idt);
    return {
      ...person,
      s_node_id: node?.id,
      s_node_name: person.s_field_96bkqmtqbo,
      s_seat: assignment.seat,
      s_seat_english: assignment.seat,
    };
  });
};

export const deleteSchemaItems = (state: SeatmapState, ids: string[]): void => {
  const removeIds = new Set(ids);
  state.currentSchema = state.currentSchema.filter((item) => !removeIds.has(item.id));
};

export const emptySeatmapState = (state: SeatmapState, graphId?: string): void => {
  if (graphId) {
    state.currentSchema = state.currentSchema.filter((item) => item.id !== graphId && item.pid !== graphId);
  } else {
    state.currentSchema = [];
    clearPeopleSeatState(state);
  }
};

export const addTemplate = (state: SeatmapState, name?: string, hallMap?: string): string => {
  const templateName = String(name || "").trim() || `Template ${state.templates.length + 1}`;
  const preview = typeof hallMap === "string" && hallMap ? hallMap : templatePreview;
  const id = `template-${Date.now()}`;

  state.templates.unshift({
    id,
    name: templateName,
    s_hall_map: preview,
    schema: deepClone(state.currentSchema),
  });

  return id;
};

export const findTemplateById = (state: SeatmapState, id?: string): TemplateRecord | undefined => {
  return state.templates.find((item) => item.id === id);
};

export const findTemplatesByKeyword = (state: SeatmapState, keyword?: string) => {
  const normalized = String(keyword || "")
    .trim()
    .toLowerCase();
  return normalized ? state.templates.filter((item) => item.name.toLowerCase().includes(normalized)) : state.templates;
};
