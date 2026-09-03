import React from "react";
import { defaultAvatar } from "../../assets";

export const getPersonNode = (item: any) => {
  return (
    <div className="person-row" key={item.id} style={{ userSelect: "none" }}>
      <div className="person-node">
        <div className="avatar">
          <img src={defaultAvatar} />
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

export const getPersonLevel1Node = (name: string) => {
  return (
    <div className="person-row" style={{ userSelect: "none" }}>
      <span>{name}</span>
    </div>
  );
};
