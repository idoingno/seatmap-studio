import { useSafeState, useUpdateEffect } from "ahooks";
import { Form, Input, Modal } from "antd";
import React, { useRef } from "react";

interface SaveTemplateProps {
  showTemplate: boolean;
  //   (handleCancel: boolean) => void
  handleCancel: (val: boolean) => void;
}

const SaveTemplate = ({ showTemplate }: SaveTemplateProps) => {
  const [show, setShow] = useSafeState<boolean>(false);
  const formRef = useRef(null);
  const [formData] = useSafeState(null);

  const layout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 15 },
  };

  const handleOk = (e: any) => {
    formRef.current.submit();
  };

  const enterHandleOk = (e: any) => {
    if (e.keyCode === 13) {
      formRef.current.submit();
    }
  };

  useUpdateEffect(() => {
    setShow(showTemplate);
  }, [showTemplate]);

  const handleCancel = () => {
    setShow(false);
  };

  const onFinish = (values: any) => {};

  return (
    <Modal
      title="模板配置"
      width={420}
      open={show}
      closable
      keyboard={false}
      maskClosable={false}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      key={new Date().getTime()}
    >
      <Form onKeyDown={enterHandleOk} onFinish={onFinish} ref={formRef} {...layout} initialValues={formData}>
        <Form.Item label="模板名称:" name="templateName">
          <Input placeholder="请输入模板名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SaveTemplate;
