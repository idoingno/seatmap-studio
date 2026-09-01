import { Form, FormInstance, Input } from "antd";
import React from "react";
import { MatrixAllRowsOrColumns } from "../../config";
import { Graph } from "@antv/x6";
import { initMatrix } from "../../CreateMatrix";
import store from "../../store";
import { addDargAction } from "../../store/actionCreators";

interface matrixProps {
  x: number;
  y: number;
  graph: Graph;
}

interface InitMatrixFromPropsType {
  matrix: matrixProps;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
}
const InitMatrixForm = (
  props: React.PropsWithChildren<InitMatrixFromPropsType>,
  ref?: React.ForwardedRef<FormInstance>
) => {
  const [form] = Form.useForm();

  const onSubmit = (values: any) => {
    props.beforeSubmit?.(values);
    MatrixAllRowsOrColumns.setAllRows = Number(values.rows);
    MatrixAllRowsOrColumns.setAllColumns = Number(values.columns);
    initMatrix(props.matrix.x, props.matrix.y, props.matrix.graph);

    props.afterSubmit?.(values, form);
    form.resetFields();
    store.dispatch(addDargAction("Matrix"));
  };

  return (
    <div className="form studio-form-shell">
      <div className="studio-form-intro">
        <span className="studio-form-copy">设定排数与列数，生成适合会场的大规模矩阵布局。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} layout="vertical">
        <Form.Item
          label="排数:"
          name="rows"
          rules={[
            { required: true, message: "请填写排数!" },
            {
              type: "number",
              message: "请填写数字且大于2不大于99!",
              max: 99,
              min: 2,
              transform(value) {
                if (value) {
                  return Number(value);
                }
              },
            },
          ]}
        >
          <Input maxLength={2} placeholder="值最大99, 最小为2" autoFocus />
        </Form.Item>

        <Form.Item
          label="列数:"
          name="columns"
          rules={[
            { required: true, message: "请填写列数!" },
            {
              type: "number",
              message: "请填写数字且大于2不大于99!",
              max: 99,
              min: 2,
              transform(value) {
                if (value) {
                  return Number(value);
                }
              },
            },
          ]}
        >
          <Input maxLength={2} placeholder="值最大99, 最小为2" />
        </Form.Item>
      </Form>
    </div>
  );
};

export default InitMatrixForm;
