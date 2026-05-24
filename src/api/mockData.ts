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

const people = [
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

const templates = [
  {
    id: "template-boardroom",
    name: "Boardroom Demo",
    s_hall_map: templatePreview,
  },
  {
    id: "template-workshop",
    name: "Workshop Demo",
    s_hall_map: templatePreview,
  },
  {
    id: "template-roundtable",
    name: "Roundtable Demo",
    s_hall_map: templatePreview,
  },
];

export const mockRequest = ({ params }: AxiosRequestConfig = {}): Promise<ResponseType> => {
  const type = params?.type;

  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (type === "query") {
        resolve(success({ schema: [] }));
        return;
      }

      if (type === "find") {
        const parsedHall = params?.hall ? JSON.parse(params.hall) : {};
        const keyword = String(parsedHall.name || "").trim().toLowerCase();
        const dataList = keyword ? templates.filter((item) => item.name.toLowerCase().includes(keyword)) : templates;

        resolve(success({ dataList, total: dataList.length }));
        return;
      }

      resolve(success({ result: people, subList: orgList, dataList: templates, total: templates.length }));
    }, 350);
  });
};
