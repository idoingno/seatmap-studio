import React from "react";
import { Modal, ModalProps } from "antd";

interface ModalShellProps extends Partial<ModalProps> {
  children: React.ReactNode;
  confirmLoading: boolean;
  onCancel: NonNullable<ModalProps["onCancel"]>;
  onOk: NonNullable<ModalProps["onOk"]>;
  open: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({ children, ...modalProps }) => {
  return (
    <Modal
      wrapClassName={`modal-wrap studio-modal-wrap ${modalProps.wrapClassName ?? ""}`.trim()}
      keyboard={false}
      maskClosable={false}
      okText="提交"
      cancelText="取消"
      width={360}
      destroyOnClose={true}
      {...modalProps}
    >
      {children}
    </Modal>
  );
};

export default ModalShell;
