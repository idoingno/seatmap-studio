import { FormInstance, Modal, ModalProps } from "antd";
import React, { PropsWithoutRef, Suspense, forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

type ModalRefType<T> = { open: (initProp?: Partial<T>) => void; close: () => void } | undefined;

const useFormModal = function <T>(modalProps: Partial<ModalProps>, Slot: React.ComponentType<T>) {
  const modalRef = useRef<ModalRefType<T>>();
  const SlotComponent = Slot as React.ComponentType<any>;

  const FormModal = forwardRef<ModalRefType<T>, T>((slotProps, mRef) => {
    const [visiable, setVisiable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [slotInitProp, setSlotInitProp] = useState<Partial<T>>();
    const open = (initProp?: Partial<T>) => {
      if (initProp) {
        setSlotInitProp(initProp);
      }
      setVisiable(true);
    };
    const close = () => {
      setVisiable(false);
    };
    useImperativeHandle(mRef, () => ({ open, close }));
    const onCancel = () => {
      close();
    };
    const formRef = React.useRef<FormInstance>();
    const ok = () => {
      formRef.current?.submit();
    };
    return (
      <Modal
        onCancel={onCancel}
        onOk={ok}
        open={visiable}
        wrapClassName="modal-wrap"
        keyboard={false}
        maskClosable={false}
        okText="提交"
        cancelText="取消"
        // cancelButtonProps={{ shape: "round" }}
        // okButtonProps={{ shape: "round" }}
        confirmLoading={loading}
        width={360}
        zIndex={1000000}
        {...modalProps}
        destroyOnClose={true}
      >
        {visiable ? (
          <Suspense fallback={null}>
            <SlotComponent
              ref={formRef}
              {...slotProps}
              {...slotInitProp}
              afterSubmit={() => {
                setLoading(false);
                close();
              }}
              beforeSubmit={() => setLoading(true)}
            />
          </Suspense>
        ) : null}
      </Modal>
    );
  });
  return {
    FormModal: useCallback((props: PropsWithoutRef<T>) => {
      return <FormModal ref={modalRef} {...props} />;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    modalRef,
  };
};

export default useFormModal;
