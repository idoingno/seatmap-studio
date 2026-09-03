import { getPersonLevel1Node, getPersonNode } from "./Person";
import type { ItemType, OrgInfoProps, TreeDataType } from "./types";

export const personDataMap = (data: any) => {
  return data.map((ite: any) => {
    return {
      title: ite.s_field_96bkqmtqbo,
      subTitle: ite.s_field_hhac39dspg,
      name: ite.s_field_96bkqmtqbo,
      dataType: "person",
      nodeType: "Tree",
      otherName: ite.s_field_mi16acq0er,
      hasSeat: !!ite.s_seat,
      id: ite.id,
      key: ite.id,
      pid: ite.s_field_xxu9wjskm8,
      hasChildOrg: true,
      checked: false,
      nodeId: ite.s_node_id,
      nodeName: ite.s_node_name,
      s_seat: ite.s_seat,
      s_seat_english: ite.s_seat_english,
    };
  });
};

const personDataHandle = (data: any[]) => {
  return data.map((item) => {
    return {
      ...item,
      titleDv: getPersonNode(item),
    };
  });
};

const personDataFilter = (data: any[], id: string) => {
  const hdata = personDataHandle(data);
  return hdata.filter((item: any) => item.pid === id);
};

export const computePersonObj = (list: OrgInfoProps[], personInfo: any) => {
  let arr: TreeDataType[] = [];
  for (let i = 0; i < list.length; i++) {
    let obj = {};
    const org = list[i];
    const filterData = personDataFilter(personInfo, org.id);
    obj = {
      children: filterData,
      fullPath: org.fullPath,
      id: org.id,
      name: org.name,
      orgLevel: "firstLevel",
      dataType: "level",
      nodeType: "Tree",
      key: org.id,
      title: org.name,
      checked: false,
      titleDv: getPersonLevel1Node(org.name),
      checkedHalf: false,
      hasChildOrg: org.subList || filterData.length > 0 ? true : false,
    };
    arr.push(obj);

    if (org.subList && org.subList.length) {
      for (let j = 0; j < org.subList.length; j++) {
        let objs = {};
        const sub = org.subList[j];
        const subfilterData = personDataFilter(personInfo, sub.id);

        objs = {
          children: subfilterData,
          fullPath: sub.fullPath,
          id: sub.id,
          name: sub.name,
          orgLevel: "twoLevel",
          dataType: "level",
          nodeType: "Tree",
          key: sub.id,
          title: sub.name,
          checked: false,
          titleDv: getPersonLevel1Node(sub.name),
          checkedHalf: false,
          hasChildOrg: subfilterData.length > 0 ? true : false,
        };
        arr[i].children.push(objs);
      }
      const length = arr[i].children.filter((item: any) => item.hasChildOrg).length;
      arr[i].hasChildOrg = length > 0 ? true : false;
    }
  }
  return arr;
};

export function filterTree(arr: any[]) {
  return arr
    .filter((item) => item.hasChildOrg)
    .map((item) => {
      item = Object.assign({}, item);
      if (item.children) {
        item.children = filterTree(item.children);
      }
      return item;
    });
}

export function hasDuplicates(arr1: any, arr2: any) {
  return arr1.filter((item: any) => {
    if (arr2.indexOf(item) > -1) {
      return item;
    }
  });
}

export type { ItemType, OrgInfoProps, TreeDataType };
