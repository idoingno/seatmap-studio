import { useSafeState } from "ahooks";
import { Form, Input, Modal } from "antd";
import React, { useEffect } from "react";
import store from "../store";
import { showCircleUpdateAction } from "../store/actionCreators";
import { getGraph } from "../config";
import { generatePersonnel, updateGraphics, updateNode } from "../utils/apiParams";
import { handleCpApi } from "../api";
import { useSelector } from "react-redux";
import { markLocalGraphMutation } from "../utils/querySync";

const CircleUpdateName = () => {
  const [show, setShow] = useSafeState<boolean>(false);
  const [form] = Form.useForm();

  const selectShow = useSelector((state: any) => state.other.circleUpdate);

  useEffect(() => {
    let currentValue: any;
    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {
    let previousValue = currentValue;
    // currentValue = selectShow(store.getState());
    currentValue = selectShow;

    if (previousValue?.show !== currentValue?.show) {
      setShow(currentValue.show);
      if (currentValue.show) {
        form.setFieldsValue({
          tableName: currentValue.tableName,
          tableNameEn: currentValue.tableNameEn,
        });
      }
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectShow]);

  // const selectShow = (state: any) => {
  //   return state.other.circleUpdate;
  // };

  const layout = { layout: "vertical" as const };

  const handleCancel = () => {
    setShow(false);
    store.dispatch(
      showCircleUpdateAction({
        show: false,
        tableName: "",
        tableNameEn: "",
        id: "",
        nodeType: "",
      })
    );
  };

  const handleOk = (e: any) => {
    form.submit();
  };

  const enterHandleOk = (e: any) => {
    if (e.keyCode === 13) {
      form.submit();
    }
  };

  const onFinish = async (values: any) => {
    markLocalGraphMutation();
    const { tableName, tableNameEn } = values;
    const { id, nodeType } = store.getState().other.circleUpdate;
    // 获取场次Id
    const sessionId = store.getState().runtime.sessionId;
    const graph = getGraph();

    if (nodeType === "circleTable") {
      const node = graph.getCellById(id);
      node.attr("text1/text", tableName);
      node.attr("text2/text", tableNameEn);
      node.data.tableName = tableName;
      node.data.tableNameEn = tableNameEn;

      node.parent.data.tableName = tableName;
      node.parent.data.tableNameEn = tableNameEn;

      const nodes = graph.getNodes();
      // 有排座的圆桌
      const currentCircleChair = nodes.filter(
        (item) => item.data.nodeType === "circleChair" && item.parent.id === node.parent.id
      );

      let arr: any = [];
      currentCircleChair.forEach((element) => {
        element.data.tableName = tableName;
        element.data.tableNameEn = tableNameEn;
        if (element.attrs.xnode) {
          const obj = {
            id: element.attrs.xnode.key,
            name: element.attrs.xnode.title,
            node: element,
          };
          arr.push(obj);
        }
      });

      // 关闭弹窗
      setShow(false);

      // 更新图形组 父节点
      const graphicsParams = updateGraphics(node.parent, sessionId);
      await handleCpApi({ params: graphicsParams, code: "seat" }, true);

      const allUpdateNode = [node, ...currentCircleChair];
      // 更新文字
      const nodeParams = updateNode(allUpdateNode, sessionId, node.parent);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);

      if (arr.length > 0) {
        // 添加人员
        const personParams = generatePersonnel(arr);
        await handleCpApi({ params: personParams, code: "seat" }, true);
      }
    }

    store.dispatch(
      showCircleUpdateAction({
        show: false,
        tableName: "",
        tableNameEn: "",
        id: "",
        nodeType: "",
      })
    );
  };

  return (
    <Modal
      title="圆桌名配置"
      width={400}
      zIndex={1000000}
      open={show}
      closable
      maskClosable={false}
      keyboard={false}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      wrapClassName="modal-wrap studio-modal-wrap"
    >
      <Form onKeyDown={enterHandleOk} onFinish={onFinish} form={form} {...layout}>
        <Form.Item label="桌子中文名:" name="tableName">
          <Input placeholder="请输入桌子中文名" />
        </Form.Item>
        <Form.Item label="桌子英文名:" name="tableNameEn">
          <Input placeholder="请输入桌子英文名" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CircleUpdateName;
