import { useSafeState, useUpdateEffect } from "ahooks";
import { Input, Spin } from "antd";
import React, { useEffect, useState } from "react";
import "./index.less";
import { Session, getGraph } from "../../../config";
import { updateNodeRegion } from "../../../utils/apiParams";
import { handleCpApi } from "../../../api";
import store from "../../../store";
import { findColor } from "../../../utils/util";
import { addDargAction } from "../../../store/actionCreators";
import { useSelector } from "react-redux";

export interface ColorItemType {
  org?: string;
  type?: string;
  value?: string;
  color?: string;
  name?: string;
  sel?: any;
}

const ColorEdit: React.FC<any> = ({ colorObj }) => {
  const [colorList, setColorList] = useSafeState<ColorItemType[]>([]);

  const [loading, setLoading] = useState(false);

  console.log("colorObj", colorObj);

  const updateData = (i: number, type: string, e?: any) => {
    if (type === "show") {
      setLoading(true);
    }

    // 获取场次Id
    const sessionId = Session.getDataId;

    let arr = colorList;
    arr[i].type = type;
    if (e && e.target) {
      arr[i].org = e.target.value;
    }

    setColorList([...arr]);

    setTimeout(async () => {
      setLoading(false);

      const graph = getGraph();
      let newNodes: any = [];
      arr.forEach((item) => {
        let nodes: any = [];
        item.sel.forEach((id: string) => {
          nodes.push(graph.getCellById(id));
        });
        let obj = {
          nodes,
          s_region: item.org,
          s_color: item.name,
        };
        nodes &&
          nodes.forEach((element: any) => {
            element.setData({ region: item.org, color: item.name });
          });
        newNodes.push(obj);
      });

      // 更新区域
      const nodeParams = updateNodeRegion(newNodes, sessionId);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
    }, 600);
  };

  const uniqueFunc = (arr: any[], uniId: string) => {
    const res = new Map();
    return arr.filter((item) => item[uniId] && !res.has(item[uniId]) && res.set(item[uniId], 1));
  };

  const equalsArr = (listA: string[], listB: string[]) => {
    return (
      listA.length === listB.length &&
      listA.every((a) => listB.some((b) => a === b)) &&
      listB.every((_b) => listA.some((_a) => _a === _b))
    );
  };

  useUpdateEffect(() => {
    console.log(colorList);

    const graph = getGraph();
    const nodes = graph.getNodes();
    const filtNode = nodes.filter(
      (item) =>
        item.data.nodeType.includes("Chair") &&
        item.attrs.rect &&
        item.attrs.rect.fill &&
        item.attrs.rect.fill !== "transparent"
    );

    // 获取所有过滤得id 进行对比
    const filtNodeIds = filtNode.map((item) => item.id);

    if (colorList && colorList.length > 0) {
      let arr = [];
      if (equalsArr(colorObj.sel, filtNodeIds)) {
        arr = [Object.assign({}, ...colorList, colorObj)];
      } else {
        arr = [...colorList, colorObj];
      }

      const uniqueColorList = uniqueFunc(arr, "name");

      // 对颜色列表进行过滤，颜色列表中没有选框得颜色就过滤掉
      let newColorList = uniqueColorList.filter((item) => {
        return filtNode.find((prop) => {
          return item.color == prop.attrs.rect.fill;
        });
      });

      setColorList(newColorList);
    } else {
      setColorList([colorObj]);
    }
  }, [colorObj]);

  const getFilterIds = (data: any, name: string) => {
    return data.filter((item: any) => item.data.color === name).map((item: any) => item.id);
  };

  const selectLoading = useSelector((state: any) => {
    console.log("=============", state.other.isLoad);
    return state.other.isLoad;
  });

  useUpdateEffect(() => {
    let currentValue: any;

    console.log("selectLoadingsselectLoadingsselectLoadings", selectLoading);

    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {

    let previousValue = currentValue;
    // currentValue = selectLoading(store.getState());
    currentValue = selectLoading;
    if (previousValue !== currentValue) {
      console.log("Some deep nested property changed from", previousValue, "to", currentValue);

      if (currentValue) {
        console.log("执行了几次");
        const graph = getGraph();
        const nodes = graph.getNodes();
        const filtNode = nodes.filter(
          (item) =>
            item.data.nodeType.includes("Chair") &&
            item.attrs.rect &&
            item.attrs.rect.fill &&
            item.attrs.rect.fill !== "transparent"
        );

        // 获取所有带区域的node
        const allRegion = filtNode.map((item) => {
          return {
            name: item.data.color,
            org: item.data.region,
          };
        });

        const uniqueRegion = uniqueFunc(allRegion, "name");

        let arr: any = [];
        uniqueRegion.forEach((item) => {
          let obj = {
            org: item.org,
            type: "show",
            color: findColor(item.name),
            name: item.name,
            sel: getFilterIds(filtNode, item.name),
          };
          arr.push(obj);
        });

        setColorList(arr);
      } else {
        setColorList([]);
      }
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectLoading]);

  // const selectLoading = (state: any) => {
  //   return state.other.isLoad;
  // };

  return (
    <div className="color-edit">
      <div className="color-edit-in">
        <Spin spinning={loading}>
          {colorList &&
            colorList.map((ite: ColorItemType, index: number) => {
              return (
                <div key={ite.color} className="color-edit-row">
                  <span
                    onClick={() => {
                      updateData(index, "edit");
                    }}
                    className="color-edit-square"
                    style={{ backgroundColor: `${ite.color}` }}
                  ></span>

                  {ite.type === "edit" ? (
                    <Input
                      style={{ width: "150px" }}
                      onBlur={(e) => {
                        updateData(index, "show", e);
                      }}
                      defaultValue={ite.org}
                    />
                  ) : (
                    <span
                      onClick={() => {
                        updateData(index, "edit");
                      }}
                    >
                      {ite.org}
                    </span>
                  )}
                </div>
              );
            })}
        </Spin>
      </div>
    </div>
  );
};

export default ColorEdit;
