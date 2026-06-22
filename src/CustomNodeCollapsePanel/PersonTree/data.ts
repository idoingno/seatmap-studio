export const tabItems = (orgCount: number | string, patternCount: number | string) => [
  {
    key: "org",
    label: `所属组织(${orgCount})`,
  },
  {
    key: "pattern",
    label: `全球合伙人(${patternCount})`,
  },
];

export const tabItems2 = [
  {
    key: "unArrange",
    label: "未排座",
  },
  {
    key: "hasArrange",
    label: "已排座",
  },
  {
    key: "notAttend",
    label: "不参加",
  },
];
