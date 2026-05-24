import React, { FC } from "react";
import "./index.less";

interface SvgIconProps {
  svgName: string; // svg名字
  svgClass?: string; // 自定义类名
  color?: string; // 填充颜色
}

const SvgIcon: FC<SvgIconProps> = (props) => {
  const { svgName, color, svgClass } = props;
  return (
    <i aria-hidden="true" style={{ verticalAlign: "sub", height: "0", display: "inline-block" }}>
      <svg className={`svg-class ${svgClass}`}>
        <use xlinkHref={"#icon-" + svgName} fill={color} />
      </svg>
    </i>
  );
};

export default SvgIcon;
