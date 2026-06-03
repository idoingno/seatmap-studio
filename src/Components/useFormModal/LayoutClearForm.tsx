import { Form, FormInstance, message } from "antd";
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

  const [value, setValue] = useState<number | undefined>();

  const onSubmit = async (values: any) => {
    props.beforeSubmit?.(values);
    store.dispatch(emptyAction());

    const graph = getGraph();

    // 清空座位
    if (!value) {
      message.error("请选择选项");
      return;
    }

    if (value === 1) {
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
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "清空座位", nextValue: 1 },
            { label: "清空布局", nextValue: 2 },
          ].map((item) => (
            <button
              key={item.nextValue}
              type="button"
              onClick={() => setValue(item.nextValue)}
              aria-pressed={value === item.nextValue}
              style={{
                minWidth: 96,
                height: 36,
                padding: "0 16px",
                borderRadius: 6,
                border: value === item.nextValue ? "1px solid #b39372" : "1px solid #d9d9d9",
                background: value === item.nextValue ? "rgba(179, 147, 114, 0.08)" : "#fff",
                color: value === item.nextValue ? "#b39372" : "#262626",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Form>
    </div>
  );
};

export default LayoutClearForm;
