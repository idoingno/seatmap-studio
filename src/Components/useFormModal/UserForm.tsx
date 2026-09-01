import { Form, FormInstance, Input } from "antd";
import React from "react";
import { ResponseType, handleCpApi } from "../../api";
import { Session } from "../../config";
import { message } from "../../utils/message";

interface UserFormPropsType {
  mapUrl?: string;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
}
const UserForm = (props: React.PropsWithChildren<UserFormPropsType>, ref?: React.ForwardedRef<FormInstance>) => {
  const [form] = Form.useForm();
  // 获取场次Id
  const sessionId = Session.getDataId;

  const onSubmit = async (values: any) => {
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
        <span className="studio-form-kicker">Template</span>
        <span className="studio-form-copy">给当前布局一个清晰的名字，方便后续复用和检索。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} layout="vertical">
        <Form.Item label="模板名称" name="templateName" rules={[{ required: true, message: "请输入模板名称" }]}>
          <Input placeholder="请输入模板名称" />
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserForm;
