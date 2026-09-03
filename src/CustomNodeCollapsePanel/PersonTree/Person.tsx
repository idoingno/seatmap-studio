import React from "react";
import type { TreeDataType } from "./types";
import { defaultAvatar, sitOutAvatar, patternPerson, patternSitOutAvatar } from "../../assets";

const getAvatar = (item: any) => {
  if (item.orgType === "org") {
    // 未参加
    // 已排座 参加
    // 已排座 未参加
    // 未排座 参加
    if (!item.isAttend) {
      return sitOutAvatar;
    } else if (item.hasSeat && item.isAttend) {
      return defaultAvatar;
    } else if (item.hasSeat && !item.isAttend) {
      return sitOutAvatar;
    } else {
      return defaultAvatar;
    }
  } else {
    if (!item.isAttend) {
      return patternSitOutAvatar;
    } else if (item.hasSeat && item.isAttend) {
      return patternPerson;
    } else if (item.hasSeat && !item.isAttend) {
      return patternSitOutAvatar;
    } else {
      return patternPerson;
    }
  }
};

export const getPersonNode = (item: any, arrangeKey: string, orgKey: string) => {
  return (
    <div className="person-row" key={item.id} style={{ userSelect: "none" }}>
      {/* {arrangeKey === "unArrange" && <Checkbox checked={item.checked} />} */}
      <div className={orgKey === "org" ? "person-node" : "person-node pattern-node"}>
        <div className="avatar">
          <img src={getAvatar(item)} />
        </div>
        <div className="title-row">
          <div className="main-title" data-name={item.title}>
            {item.title}
          </div>
          <div className="sub-title" title={item.subTitle}>
            {item.subTitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export const getPersonLevel1Node = (name: string, item: TreeDataType, arrangeKey: string) => {
  return (
    // <div className={levelType === "level2" ? "person-row person-row-level2" : "person-row"}>
    <div className="person-row" style={{ userSelect: "none" }}>
      <span>{name}</span>
    </div>
  );
};
