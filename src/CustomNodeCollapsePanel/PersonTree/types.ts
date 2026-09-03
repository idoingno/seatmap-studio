export interface OrgInfoProps {
  fullPath: string;
  id: string;
  name: string;
  subList?: OrgInfoProps[];
}

export interface ItemType {
  title: string;
  subTitle: string;
  name: string;
  dataType: string;
  otherName: string;
  hasSeat: boolean;
  id: string;
  key: string;
  pid: string;
  hasChildOrg: boolean;
  checked: boolean;
}

export interface TreeDataType {
  children?: any;
  fullPath?: string;
  id?: string;
  name?: string;
  orgLevel?: string;
  dataType?: string;
  key?: string;
  title?: string;
  titleDv?: Element | React.ReactNode;
  subOrg?: any;
  checked?: boolean;
  checkedHalf?: boolean;
  hasSeat?: boolean;
  s_seat?: boolean;
  hasChildOrg?: boolean;
}
