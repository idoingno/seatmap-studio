import type { AxiosRequestConfig, ResponseType } from ".";

const success = (response: any = {}): ResponseType => ({
  code: 200,
  subMsgType: "success",
  data: {
    response,
  },
});

const templatePreview =
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

type MockSchemaItem = {
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

type MockTemplate = {
  id: string;
  name: string;
  s_hall_map: string;
  schema: MockSchemaItem[];
};

type MockPerson = {
  id: string;
  s_field_96bkqmtqbo: string;
  s_field_hhac39dspg: string;
  s_field_mi16acq0er: string;
  s_field_xxu9wjskm8: string;
  s_field_f39ex5pcvp: boolean;
  s_whether_to_attend: boolean;
  s_node_id?: string;
  s_node_name?: string;
  s_seat?: string;
  s_seat_english?: string;
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const makeSchemaItem = (item: Partial<MockSchemaItem> & Pick<MockSchemaItem, "id" | "name" | "type" | "x" | "y" | "w" | "h" | "data">): MockSchemaItem => ({
  pid: null,
  ...item,
});

const createMatrixTemplateSchema = (
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

  const schema: MockSchemaItem[] = [
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

const orgList = [
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

const peopleSeed: MockPerson[] = [
  {
    id: "person-ada",
    s_field_96bkqmtqbo: "Ada Chen",
    s_field_hhac39dspg: "Product Designer",
    s_field_mi16acq0er: "ADA",
    s_field_xxu9wjskm8: "design",
    s_field_f39ex5pcvp: false,
    s_whether_to_attend: true,
  },
  {
    id: "person-ben",
    s_field_96bkqmtqbo: "Ben Lin",
    s_field_hhac39dspg: "Frontend Engineer",
    s_field_mi16acq0er: "BEN",
    s_field_xxu9wjskm8: "frontend",
    s_field_f39ex5pcvp: false,
    s_whether_to_attend: true,
  },
  {
    id: "person-claire",
    s_field_96bkqmtqbo: "Claire Zhou",
    s_field_hhac39dspg: "Research Lead",
    s_field_mi16acq0er: "CLAIRE",
    s_field_xxu9wjskm8: "research",
    s_field_f39ex5pcvp: false,
    s_whether_to_attend: true,
  },
  {
    id: "person-devon",
    s_field_96bkqmtqbo: "Devon Wu",
    s_field_hhac39dspg: "Platform Engineer",
    s_field_mi16acq0er: "DEVON",
    s_field_xxu9wjskm8: "platform",
    s_field_f39ex5pcvp: false,
    s_whether_to_attend: true,
  },
  {
    id: "guest-lee",
    s_field_96bkqmtqbo: "Lee Park",
    s_field_hhac39dspg: "Guest Speaker",
    s_field_mi16acq0er: "LEE",
    s_field_xxu9wjskm8: "guests",
    s_field_f39ex5pcvp: true,
    s_whether_to_attend: true,
  },
  {
    id: "guest-morgan",
    s_field_96bkqmtqbo: "Morgan Yu",
    s_field_hhac39dspg: "Guest",
    s_field_mi16acq0er: "MORGAN",
    s_field_xxu9wjskm8: "guests",
    s_field_f39ex5pcvp: true,
    s_whether_to_attend: false,
  },
];

const templateSeed: MockTemplate[] = [
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

let currentSchema: MockSchemaItem[] = [];
let templates: MockTemplate[] = deepClone(templateSeed);
let people: MockPerson[] = deepClone(peopleSeed);

const toSchemaItem = (update: any): MockSchemaItem => ({
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

const upsertSchemaItems = (payload: any[], parser: (update: any) => MockSchemaItem) => {
  const schemaById = new Map(currentSchema.map((item) => [item.id, item]));
  payload.forEach((entry) => {
    const update = entry.update || entry;
    if (!update?.id) {
      return;
    }
    schemaById.set(update.id, parser(update));
  });
  currentSchema = [...schemaById.values()];
};

const clearPeopleSeatState = () => {
  people = people.map((person) => ({
    ...person,
    s_node_id: undefined,
    s_node_name: undefined,
    s_seat: undefined,
    s_seat_english: undefined,
  }));
};

const applyPersonnelUpdates = (payload: any[]) => {
  const byPersonId = new Map(people.map((person) => [person.id, person]));
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
  people = [...byPersonId.values()];
};

const applyUploadAssignments = (uploadData: Array<{ name: string; idt: string; seat: string }>) => {
  clearPeopleSeatState();
  const schemaByIdt = new Map(
    currentSchema
      .filter((item) => item.type === "matrixChair" && item.data?.idt)
      .map((item) => [String(item.data.idt), item])
  );

  people = people.map((person) => {
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

export const mockRequest = ({ params, code }: AxiosRequestConfig = {}): Promise<ResponseType> => {
  const type = params?.type;

  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (code === "seat" && type === "query") {
        resolve(success({ schema: deepClone(currentSchema) }));
        return;
      }

      if (code === "seat" && type === "graph") {
        const payload = JSON.parse(params?.graph || "[]");
        upsertSchemaItems(payload, toSchemaItem);
        resolve(success());
        return;
      }

      if (code === "seat" && type === "node") {
        if (params?.isDelete === "true") {
          const removeIds = new Set((JSON.parse(params?.node || "[]") as Array<{ id: string }>).map((item) => item.id));
          currentSchema = currentSchema.filter((item) => !removeIds.has(item.id));
          resolve(success());
          return;
        }

        const payload = JSON.parse(params?.node || "[]");
        upsertSchemaItems(payload, toSchemaItem);
        resolve(success());
        return;
      }

      if (code === "seat" && type === "personnel") {
        if (!params?.personnel) {
          clearPeopleSeatState();
          resolve(success());
          return;
        }

        const payload = JSON.parse(params.personnel || "[]");
        applyPersonnelUpdates(payload);
        resolve(success());
        return;
      }

      if (code === "seat" && type === "empty") {
        if (params?.graphId) {
          currentSchema = currentSchema.filter((item) => item.id !== params.graphId && item.pid !== params.graphId);
        } else {
          currentSchema = [];
          clearPeopleSeatState();
        }
        resolve(success());
        return;
      }

      if (code === "template" && type === "save") {
        const templateName = String(params?.name || "").trim() || `Template ${templates.length + 1}`;
        const hallMap = typeof params?.hallMap === "string" && params.hallMap ? params.hallMap : templatePreview;

        templates.unshift({
          id: `template-${Date.now()}`,
          name: templateName,
          s_hall_map: hallMap,
          schema: deepClone(currentSchema),
        });

        resolve(success({ id: templates[0].id }));
        return;
      }

      if (code === "template" && type === "find") {
        const parsedHall = params?.hall ? JSON.parse(params.hall) : {};
        const keyword = String(parsedHall.name || "").trim().toLowerCase();
        const dataList = keyword
          ? templates.filter((item) => item.name.toLowerCase().includes(keyword))
          : templates;

        resolve(
          success({
            dataList: dataList.map(({ schema, ...item }) => item),
            total: dataList.length,
          })
        );
        return;
      }

      if (code === "template" && type === "choose") {
        const selected = templates.find((item) => item.id === params?.hallTemplateId);
        currentSchema = deepClone(selected?.schema || []);
        resolve(success({ id: selected?.id || params?.hallTemplateId }));
        return;
      }

      if (code === "template" && type === "upload") {
        const uploadData = JSON.parse(params?.uploadData || "[]");
        applyUploadAssignments(uploadData);
        resolve(success({ count: uploadData.length }));
        return;
      }

      if (code === "person") {
        resolve(success({ result: deepClone(people) }));
        return;
      }

      if (code === "org") {
        resolve(success({ subList: deepClone(orgList) }));
        return;
      }

      resolve(
        success({
          result: deepClone(people),
          subList: deepClone(orgList),
          dataList: templates.map(({ schema, ...item }) => item),
          total: templates.length,
          schema: deepClone(currentSchema),
        })
      );
    }, 350);
  });
};
