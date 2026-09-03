import { Form, FormInstance, Input } from "antd";
import React from "react";
import { ResponseType, handleCpApi } from "../../api";
import { getRuntime } from "../../store/accessors";
import { message } from "../../utils/message";

interface UserFormPropsType {
  mapUrl?: string;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
}
const UserForm = (props: React.PropsWithChildren<UserFormPropsType>, ref?: React.ForwardedRef<FormInstance>) => {
  const [form] = Form.useForm();

  const onSubmit = async (values: any) => {
    // 提交时刻读取场次Id，与宿主注入时序解耦
    const sessionId = getRuntime().sessionId;
    props.beforeSubmit?.(values);
    const params = { type: "save", sessionId, hallMap: props.mapUrl, name: values.templateName };
    const { code, subMsgType }: ResponseType = await handleCpApi({ params: params, code: "template" });
    if (code === 200 && subMsgType === "success") {
      message.success("操作完成~");
    } else {
      message.error("操作失败~");
    }
    props.afterSubmit?.(values, form);
    form.resetFields();
  };
  return (
    <div className="form studio-form-shell">
      <div className="studio-form-intro">
        <span className="studio-form-copy">给当前布局一个清晰的名字，方便后续复用和检索。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} layout="vertical">
        <Form.Item label="模板名称" name="templateName" rules={[{ required: true, message: "请输入模板名称" }]}>
          <Input placeholder="请输入模板名称" autoFocus />
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserForm;
