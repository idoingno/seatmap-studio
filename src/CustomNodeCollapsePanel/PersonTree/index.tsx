import { Checkbox, Input, Tree, message } from "antd";
import React, { useEffect, useImperativeHandle, useState } from "react";
import "./index.less";
import { tabItems, tabItems2 } from "./data";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import {
  computePersonObj,
  filterTree,
  hasDuplicates,
  personDataMap,
} from "./treeData";
import type { ItemType, OrgInfoProps, TreeDataType } from "./types";
import { isOutChair, setChairPerson } from "../../utils/util";
import { AllPersonArr, Session, getGraph, setDragNodeType } from "../../config";
import { SearchOutlined } from "@ant-design/icons";

import { Node } from "@antv/x6";
import store from "../../store/index";
import { addAction, addsAction } from "../../store/actionCreators";
import { ResponseType, handleCpApi } from "../../api";
import { generatePersonnel } from "../../utils/apiParams";
import { defaultAvatar } from "../../assets";
import { useUpdateEffect } from "ahooks";
import { useSelector } from "react-redux";
import { EventEmitter } from "ahooks/lib/useEventEmitter";

const getArrangeSeat = (item: any, key: string) => {
  if (key === "hasArrange") {
    // 已排座 确认参加/或者未响应
    return item.hasSeat;
  } else if (key === "unArrange") {
    // 未排座 确认参加/或者未响应
    return !item.hasSeat && item.isAttend;
  } else {
    // 未参加
    return !item.isAttend;
  }
};

interface PersonTreeType {
  onRef: any;
  loadTree$: EventEmitter<void>;
}

const PersonTree: React.FC<PersonTreeType> = ({ onRef, loadTree$ }) => {
  // const PersonTree = forwardRef((props) => {
  const [treeData, setTreeData] = useState([]);
  const [arrangeKey, setArrangeKey] = useState<string>("unArrange");
  const [orgKey, setOrgKey] = useState<string>("org");
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(false);
  // const [allPersonNum, setAllPersonNum] = useState<number>(0);
  const [inputSearchValue, setInputSearchValue] = useState<string>("");

  // 原始数据
  const [personList, setPersonList] = useState([]);
  const [orgList, setOrgList] = useState([]);
  const [allList, setAllList] = useState([]);
  const [checkedListLength, setCheckedListLength] = useState(0);
  // const [hasSeatArr, setHasSeatArr] = useState<any>([]);

  // 监听并生成人员树
  useEffect(() => {
    // const newPersonList = personList.filter((item: ItemType) => !item.hasSeat);
    if (orgList.length > 0) {
      const data = computePersonObj(orgList, personList, arrangeKey, orgKey);
      const filterData = filterTree(data);
      setTreeData(filterData);
    }
  }, [orgList, personList]);

  // 监听过滤条件
  useEffect(() => {
    const filterArr = allList.filter(
      (item: any) =>
        item.orgType === orgKey && getArrangeSeat(item, arrangeKey) && item.title.includes(inputSearchValue)
    );
    setPersonList(filterArr);
  }, [arrangeKey, orgKey, inputSearchValue]);

  const selectSeat = useSelector((state: any) => state.seater.seatSet);

  useUpdateEffect(() => {
    let currentValue: any;
    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {
    let previousValue = currentValue;
    // currentValue = selectSeat(store.getState());
    currentValue = selectSeat;

    if (previousValue !== currentValue) {
      if (allList && allList.length > 0) {
        handleLeftTree([...new Set(currentValue)]);
      }
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectSeat]);

  useImperativeHandle(onRef, () => ({
    reload: () => {
      queryOrgInfo();
      queryPersonInfo();
    },
  }));

  useEffect(() => {
    queryOrgInfo();
    queryPersonInfo();
  }, []);

  const handleLeftTree = (hasSeatArr: any) => {
    const newData = allList.map((item: ItemType) => {
      return {
        ...item,
        // hasSeatArr.has(item.id)
        hasSeat: hasSeatArr.findIndex((i: string) => i === item.id) > -1 ? true : false,
      };
    });

    const newPersonList = newData.filter(
      (item: ItemType) => item.orgType === orgKey && getArrangeSeat(item, arrangeKey)
    );

    setPersonList(newPersonList);
    setAllList([...newData]);
    setIndeterminate(false);
    setCheckAll(false);
  };

  const getPersonCount = (data: any[], key: string) => {
    return data.filter((item) => item.orgType === key).length;
  };

  const queryPersonInfo = async () => {
    // 获取场次Id
    const sessionId = Session.getDataId;
    const params = { sessionId };
    const { code, data, subMsgType }: ResponseType = await handleCpApi({ params, code: "person" });
    if (code === 200 && subMsgType === "success") {
      const result = data.response.result;
      const handleData = personDataMap(result);
      // 初始化过滤
      // if (arrangeKey === "unArrange" && orgKey === "org") {
      const initData = handleData.filter((item: any) => item.orgType === orgKey && getArrangeSeat(item, arrangeKey));
      setPersonList(initData);
      setAllList([...handleData]);
      // setAllPersonNum(initData.length);
      // }

      const hasSeatArr = handleData.filter((item: any) => !!item.hasSeat).map((item: any) => item.id);
      // hasSeatSize.forEach((item: any) => {
      //   store.dispatch(addAction(item.id));
      // });
      store.dispatch(addsAction(hasSeatArr));

      AllPersonArr.setArr = handleData;
      loadTree$.emit();
    }
  };

  const queryOrgInfo = async () => {
    const params = { pid: "K139686" };
    const { code, data, subMsgType }: ResponseType = await handleCpApi({ params, code: "org" });
    if (code === 200 && subMsgType === "success") {
      const orgList = data.response.subList;
      if (orgList && orgList.length) {
        setOrgList(orgList);
      }
    }
  };

  const orgOnChange = (key: string) => {
    setCheckedListLength(0);
    setCheckedList([]);
    setIndeterminate(false);
    setCheckAll(false);
    setOrgKey(key);
  };

  const arrangeSeatOnChange = (key: string) => {
    setArrangeKey(key);
  };

  const allCheckboxOnChange = (e: CheckboxChangeEvent) => {
    const filterList = personList.filter(
      (item: any) =>
        item.orgType === orgKey && getArrangeSeat(item, "unArrange") && item.title.includes(inputSearchValue)
    );

    const allId: any = filterList.map((item: ItemType) => item.id);
    const newData = allList.map((item: ItemType) => {
      return {
        ...item,
        checked: e.target.checked,
      };
    });

    setAllList([...newData]);

    setCheckedList(e.target.checked ? allId : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    setCheckedListLength(e.target.checked ? allId.length : 0);
  };

  const onCheck = (checkedKeysValue: string[], e: any) => {
    const allId = personList.map((item: ItemType) => item.id);
    const isSelectLength = hasDuplicates(allId, checkedKeysValue).length;

    const newData = allList.map((item: ItemType) => {
      return {
        ...item,
        checked: checkedKeysValue.includes(item.id) ? true : false,
      };
    });

    setAllList([...newData]);

    setCheckedList(checkedKeysValue);
    setCheckedListLength(isSelectLength);
    setIndeterminate(!!isSelectLength && isSelectLength < allId.length);
    setCheckAll(isSelectLength === allId.length);
  };

  const inputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSearchValue(e.target.value);
  };

  const getLeftPersonSelection = () => {
    // let { myTreeData, orgKey } = this.state
    // const list = personDataMap(personInfo);
    let selectPersonArr: any = [];
    allList.forEach((ite: any) => {
      if (ite.checked && getArrangeSeat(ite, "unArrange") && orgKey === ite.orgType) {
        selectPersonArr.push({ ...ite, avatar: defaultAvatar });
      }
    });
    return selectPersonArr;
  };

  const onDragEnd = async ({ event, node }: any) => {
    // const nodeType = getDragNodeType();
    // tree 三种形态
    // 1、拖动人未被选择
    // 2、拖动人已选择
    // 3、拖动level未选择
    // 4、拖动level已选择

    const graph: any = getGraph();
    const p1 = graph.pageToLocal(event.clientX, event.clientY);
    const seatArr = graph.getSelectedCells().filter((item: Node) => !item.attrs.xnode);
    // const filterSeatArr =  seatArr.filter((item: Node)=> !item.attrs.xnode)
    const personArr = getLeftPersonSelection();
    if (node.dataType === "level" && personArr.length === 0) {
      message.error("请先选择人员！");
      return;
    }

    if ((node.dataType === "person" && personArr.length > 0) || (node.dataType === "level" && personArr.length > 0)) {
      if (seatArr.length === 0) {
        message.error("请先框选座位！");
        return;
      }

      const { flag, element }: any = isOutChair(p1, seatArr);

      if (flag) {
        const newPersonArr: any[] = [];
        let sortSeatArr: any[] = seatArr;
        // 排序
        if (seatArr[0].data.nodeType === "circleChair") {
          const newSeatArr = [...seatArr];

          let arr = newSeatArr
            .sort((a, b) => {
              const { x: ax, y: ay } = a.getPosition();
              const { x: bx, y: by } = b.getPosition();
              if (ax > bx) {
                return 1;
              } else {
                return -1;
              }
            })
            .slice(0, 2);
          let startData: any = null;
          if (arr.length === 2 && arr[0].getPosition().x != arr[1].getPosition().x) {
            startData = arr[0];
          } else {
            arr = arr.sort((a, b) => {
              if (a.getPosition().y > b.getPosition().y) {
                return 1;
              } else {
                return -1;
              }
            });
            startData = arr[0];
          }

          let startIndex = seatArr.findIndex((ite: any) => ite.id === startData.id);
          let arr1 = seatArr.slice(0, startIndex);
          let arr2 = seatArr.slice(startIndex);
          let arr3 = arr2.concat(arr1);
          sortSeatArr = arr3;
        }

        personArr.length &&
          personArr.forEach((ite: ItemType, index: number) => {
            const currNode = sortSeatArr[index];
            if (currNode) {
              store.dispatch(addAction(ite.id));

              setChairPerson(currNode, ite);
              graph.unselect(currNode);

              newPersonArr.push({ ...ite, node: currNode });
            }
          });

        // 添加人员
        const nodeParams = generatePersonnel(newPersonArr);
        await handleCpApi({ params: nodeParams, code: "seat" }, true);

        setCheckedListLength(0);
        setCheckedList([]);
        setIndeterminate(false);
        const newData = allList.map((item: ItemType) => {
          return {
            ...item,
            checked: false,
          };
        });
        setAllList([...newData]);
      }
    } else if (node.dataType === "person" && personArr.length === 0) {
      const nodes = graph.getNodes();
      const chairArr = nodes.filter(
        (item: Node) => item.data.nodeType === "matrixChair" || item.data.nodeType === "circleChair"
      );
      const { flag, element }: any = isOutChair(p1, chairArr);

      if (flag) {
        if (element.data.visible) {
          if (element.attrs.xnode) {
            message.error("当前位置已有人！");
            return;
          }
          store.dispatch(addAction(node.id));
          setChairPerson(element, node);

          graph.unselect(element);

          const arr = [{ ...node, node: element }];
          // 添加人员
          const nodeParams = generatePersonnel(arr);
          await handleCpApi({ params: nodeParams, code: "seat" }, true);
        } else {
          message.error("此位置不能添加位置！");
        }
      }
    }
  };

  const onDragStart = ({ event, node }: any) => {
    setDragNodeType(node.nodeType);
  };

  return (
    <div className="leftPerson">
      <Input
        value={inputSearchValue}
        onChange={(e) => {
          inputOnChange(e);
        }}
        // onPressEnter={(e: any) => {
        //   inputOnSearch(e);
        // }}
        prefix={
          <SearchOutlined
          // onClick={(e: any) => {
          //   inputOnSearch(e);
          // }}
          />
        }
        placeholder="搜索"
      />
      <div className="tab-dv org-tab-row" role="tablist" aria-label="人员类型">
        {tabItems(getPersonCount(allList, "org"), getPersonCount(allList, "pattern")).map((item) => (
          <button
            key={item.key}
            type="button"
            className={orgKey === item.key ? "active" : ""}
            onClick={() => orgOnChange(item.key)}
            aria-pressed={orgKey === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tab-dv seat-tab-row" role="tablist" aria-label="排座状态">
        {tabItems2.map((item) => (
          <button
            key={item.key}
            type="button"
            className={arrangeKey === item.key ? "active" : ""}
            onClick={() => arrangeSeatOnChange(item.key)}
            aria-pressed={arrangeKey === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="show-person-number-row">
        {arrangeKey === "unArrange" && personList.length > 0 && (
          <div style={{ marginBottom: "5px" }}>
            <Checkbox indeterminate={indeterminate} onChange={allCheckboxOnChange} checked={checkAll} />
            <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: "bold" }}>全部({personList.length})</span>
          </div>
        )}
        {checkedListLength === 0 ? "" : arrangeKey === "unArrange" ? <div>已选 {checkedListLength}</div> : <div></div>}
      </div>
      <div className="tree-wrap">
        <Tree
          fieldNames={{ title: "titleDv", key: "key", children: "children" }}
          treeData={treeData}
          checkable={arrangeKey === "unArrange" ? true : false}
          draggable={{ icon: false, nodeDraggable: () => (arrangeKey === "unArrange" ? true : false) }}
          icon={false}
          onCheck={onCheck}
          checkedKeys={checkedList}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          rootClassName="myTree"
        />
      </div>
    </div>
  );
};

export default PersonTree;
export type { ItemType, OrgInfoProps, TreeDataType };
