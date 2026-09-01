import { Form, FormInstance } from "antd";
import React, { useState } from "react";
import { ResponseType, handleCpApi } from "../../api";
import { Session, getGraph } from "../../config";
import store from "../../store";
import { addDargAction, emptyAction, isLoadAction } from "../../store/actionCreators";
import { delPersonnel, emptyGraph } from "../../utils/apiParams";
import { chairSvg } from "../../config/Markup/chair";
import { patternSeat } from "../../assets";
import { message } from "../../utils/message";

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
    if (!value) {
      message.error("请选择选项");
      return;
    }

    props.beforeSubmit?.(values);
    store.dispatch(emptyAction());

    const graph = getGraph();

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
    <div className="form studio-form-shell">
      <div className="studio-form-intro">
        <span className="studio-form-copy">保留布局结构或整体重置，避免误清空时看不出区别。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} wrapperCol={{ span: 24 }}>
        <div className="studio-choice-row">
          {[
            { label: "清空座位", copy: "保留场地结构，只移除已安排人员。", nextValue: 1 },
            { label: "清空布局", copy: "移除全部节点与布局配置，回到空白画布。", nextValue: 2 },
          ].map((item) => (
            <button
              key={item.nextValue}
              type="button"
              onClick={() => setValue(item.nextValue)}
              aria-pressed={value === item.nextValue}
              className={`studio-choice-button${value === item.nextValue ? " is-active" : ""}`}
            >
              <span className="studio-choice-title">{item.label}</span>
              <span className="studio-choice-copy">{item.copy}</span>
            </button>
          ))}
        </div>
      </Form>
    </div>
  );
};

export default LayoutClearForm;
