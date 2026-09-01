import { Form, FormInstance, Input } from "antd";
import React from "react";
import { CircleAllCount } from "../../config";
import { Graph } from "@antv/x6";
import { initCircle } from "../../CreateCircle";
import store from "../../store";
import { addDargAction } from "../../store/actionCreators";

interface circleProps {
  x: number;
  y: number;
  graph: Graph;
}

interface InitMatrixFromPropsType {
  circle: circleProps;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
}
const InitCircleForm = (
  props: React.PropsWithChildren<InitMatrixFromPropsType>,
  ref?: React.ForwardedRef<FormInstance>
) => {
  const [form] = Form.useForm();

  const onSubmit = async (values: any) => {
    props.beforeSubmit?.(values);
    CircleAllCount.setChairCount = Number(values.chairNum);
    CircleAllCount.setTableCount = Number(values.tableNum);
    initCircle(props.circle.x, props.circle.y, props.circle.graph);
    props.afterSubmit?.(values, form);
    form.resetFields();
    store.dispatch(addDargAction("Round"));
  };
  return (
    <div className="form studio-form-shell">
      <div className="studio-form-intro">
        <span className="studio-form-kicker">Round Table</span>
        <span className="studio-form-copy">快速生成圆桌区，适合宴会、论坛或带讨论属性的场景。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} layout="vertical">
        <Form.Item
          label="圆桌数:"
          name="tableNum"
          rules={[
            { required: true, message: "请填写圆桌数!" },
            {
              type: "number",
              message: "请填写数字并且不大于99!",
              max: 99,
              transform(value) {
                if (value) {
                  return Number(value);
                }
              },
            },
          ]}
        >
          <Input maxLength={2} placeholder="值最大99" />
        </Form.Item>

        <Form.Item
          label="座位数:"
          name="chairNum"
          rules={[
            { required: true, message: "请填写座位数!" },
            {
              type: "number",
              message: "请填写数字并且不大于30!",
              max: 30,
              transform(value) {
                if (value) {
                  return Number(value);
                }
              },
            },
          ]}
        >
          <Input maxLength={2} placeholder="值最大30" />
        </Form.Item>
      </Form>
    </div>
  );
};

export default InitCircleForm;
