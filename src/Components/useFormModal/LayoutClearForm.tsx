import { Form, FormInstance, Input, Radio, message } from "antd";
import React, { useState } from "react";
import { ResponseType, handleCpApi } from "../../api";
import { Session, getGraph } from "../../config";
import store from "../../store";
import { addDargAction, emptyAction, isLoadAction } from "../../store/actionCreators";
import { delPersonnel, emptyGraph } from "../../utils/apiParams";
import { chairSvg } from "../../config/Markup/chair";
import { patternSeat } from "../../assets";

interface UserFormPropsType {
  // mapUrl?: string;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
}
const LayoutClearForm = (props: React.PropsWithChildren<UserFormPropsType>, ref?: React.ForwardedRef<FormInstance>) => {
  const [form] = Form.useForm();
  // 获取场次Id
  const sessionId = Session.getDataId;

  const [value, setValue] = useState();

  const onChange = (e: any) => {
    setValue(e.target.value);
  };

  const onSubmit = async (values: any) => {
    props.beforeSubmit?.(values);
    store.dispatch(emptyAction());

    const graph = getGraph();

    // 清空座位
    if (values.type === 1) {
      store.dispatch(isLoadAction(true));

      const nodes = graph.getNodes();
      const personNode = nodes.filter((node) => node.attrs.xnode);

      // const personNodeArr = personNode.map((item) => {
      //   return {
      //     id: item.attrs.xnode.key,
      //   };
      // });
      // if (personNodeArr.length > 0) {
      // 全部人员删除
      const nodeParams = delPersonnel([], sessionId, false);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
      // }

      personNode.forEach((node) => {
        node.setMarkup([
          {
            tagName: "rect",
            attrs: {
              width: "40px",
              height: "40px",
            },
          },
          chairSvg,
          {
            tagName: "image",
          },
          {
            tagName: "text",
          },
        ]);

        node.attr("svg/fill", "#FFFFFF");
        node.attr("svg/style", "display:block");
        node.attr("image", {
          width: 40,
          y: 3,
          style: {
            display: "none",
          },
          "xlink:href": patternSeat,
        });
        node.attr("text/text", "");

        node.data = {
          disableMove: true,
          nodeType: node.data.nodeType,
          visible: true,
        };

        node.removeAttrByPath("xnode");
      });
    } else {
      graph.clearCells();
      store.dispatch(isLoadAction(false));
      store.dispatch(addDargAction(""));

      const emptyParams = emptyGraph(sessionId);
      await handleCpApi({ params: emptyParams, code: "seat" }, true);
    }

    props.afterSubmit?.(values, form);
    form.resetFields();
  };
  return (
    <div className="form">
      <Form onFinish={onSubmit} ref={ref} form={form} wrapperCol={{ span: 24 }}>
        <Form.Item name="type" rules={[{ required: true, message: "请选择选项" }]}>
          <Radio.Group onChange={onChange} value={value}>
            <Radio value={1}>清空座位</Radio>
            <Radio value={2}>清空布局</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LayoutClearForm;
