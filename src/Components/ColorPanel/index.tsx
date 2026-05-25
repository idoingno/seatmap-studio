import { CheckOutlined } from "@ant-design/icons";
import { useSafeState, useUpdateEffect } from "ahooks";
import React, { useEffect, useState } from "react";
import { img_color, img_packup } from "../../assets/index";
import "./index.less";
import { ColorArr, Session, getGraph } from "../../config";
import { Node } from "@antv/x6";
import { ColorItemType } from "./ColorEdit";
import { Spin, message } from "antd";
import { updateNodeRegion } from "../../utils/apiParams";
import { handleCpApi } from "../../api";

interface ItemType {
  color?: string;
  selected?: boolean;
  name?: string;
}

interface ColorPanelProps {
  setColorObj: (colorList: ColorItemType) => void;
}

const ColorPanel: React.FC<ColorPanelProps> = ({ setColorObj }) => {
  const [colorData, setColorData] = useSafeState<ItemType[]>([]);
  const [panelType, setPanelType] = useSafeState<string>("packup");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const newArr = ColorArr.map((item, index) => {
      return { color: item.color, name: item.name, selected: index === 0 ? true : false };
    });

    setColorData(newArr);
  }, []);

  const packup = () => {
    setPanelType("packup");
  };
  const expand = () => {
    setPanelType("expand");
  };

  const changeCurColor = (item: ItemType) => {
    setLoading(true);

    setTimeout(async () => {
      const graph = getGraph();
      const cells = graph.getSelectedCells();
      if (cells && cells.length === 0) {
        message.error("请选择座位区域！");
        setLoading(false);
        return;
      }
      const cellsIds = cells.map((item) => item.id);

      const newColorData = colorData.map((ite) => {
        if (ite.color === item.color) {
          return { ...ite, selected: true };
        } else {
          return { ...ite, selected: false };
        }
      });

      // clear color block
      if (item.name === "A") {
        // 获取场次Id
        const sessionId = Session.getDataId;
        let arr = cellsIds;

        let newNodes: any = [];
        let nodes: any = [];
        arr.forEach((id) => {
          nodes.push(graph.getCellById(id));
        });

        nodes &&
          nodes.forEach((element: any) => {
            element.setData({ region: '--', color: 'A' });
          });

        newNodes.push({
          nodes,
          s_region: '--',
          s_color: 'A',
        });

        // 更新区域
        const nodeParams = updateNodeRegion(newNodes, sessionId);
        await handleCpApi({ params: nodeParams, code: "seat" }, true);
      }

      const newNodes = cells.filter((item) => item.data.nodeType.includes("Chair"));
      newNodes.forEach((ite: Node) => {
        ite.attr("rect/fill", item.color === "#FFFFFF" ? "transparent" : item.color);
      });

      setColorData(newColorData);

      setColorObj({ org: "", type: "edit", color: item.color === "#FFFFFF" ? "transparent" : item.color, name: item.name, sel: cellsIds });

      setLoading(false);
    }, 600);
  };

  return (
    <div className={panelType === "packup" ? "color-operate-panel packup" : "color-operate-panel expand"}>
      {panelType === "expand" ? (
        <div className="dv">
          <div className="title">
            <span>背景色</span>
            <img className="packupImg" onClick={packup} src={img_packup} />
          </div>

          <Spin spinning={loading}>
            <div className="content">
              {colorData.map((item: ItemType) => (
                <div
                  key={item.color}
                  onClick={() => changeCurColor(item)}
                  style={{
                    backgroundColor: `${item.color}`,
                    border: `1px solid ${item.color === "#FFFFFF" ? "#c2c2c2" : item.color}`,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {item.selected && <CheckOutlined />}
                </div>
              ))}
            </div>
          </Spin>
        </div>
      ) : (
        <div className="colorDv" onClick={expand}>
          <img className="color" src={img_color} />
          <span>背景色</span>
        </div>
      )}
    </div>
  );
};

export default ColorPanel;
