import { LoadingOutlined } from "@ant-design/icons";
import type { FormInstance, ModalProps } from "antd";
import React, { PropsWithoutRef, Suspense, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./index.less";
import ModalShell from "./ModalShell";

type ModalRefType<T> = { open: (initProp?: Partial<T>) => void; close: () => void } | undefined;

const useFormModal = function <T>(modalProps: Partial<ModalProps>, Slot: React.ComponentType<T>) {
  const modalRef = useRef<ModalRefType<T>>();
  const SlotComponent = Slot as React.ComponentType<any>;

  const FormLoading = () => (
    <div className="studio-form-loading" role="status" aria-live="polite">
      <LoadingOutlined />
      <span>正在加载表单...</span>
    </div>
  );

  const SlotReadyBoundary: React.FC<React.PropsWithChildren<{ onReady: () => void }>> = ({ onReady, children }) => {
    useEffect(() => {
      onReady();
    }, [onReady]);

    return <>{children}</>;
  };

  const FormModal = forwardRef<ModalRefType<T>, T>((slotProps, mRef) => {
    const [visiable, setVisiable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [slotLoading, setSlotLoading] = useState(true);
    const [slotInitProp, setSlotInitProp] = useState<Partial<T>>();
    const open = (initProp?: Partial<T>) => {
      if (initProp) {
        setSlotInitProp(initProp);
      }
      setSlotLoading(true);
      setVisiable(true);
    };
    const close = () => {
      setVisiable(false);
      setSlotLoading(true);
    };
    useImperativeHandle(mRef, () => ({ open, close }));
    const onCancel: NonNullable<ModalProps["onCancel"]> = () => {
      close();
    };
    const formRef = React.useRef<FormInstance>();
    const ok: NonNullable<ModalProps["onOk"]> = () => {
      formRef.current?.submit();
    };
    return visiable ? (
      <ModalShell
        onCancel={onCancel}
        onOk={ok}
        open={visiable}
        confirmLoading={loading}
        {...modalProps}
        okButtonProps={{
          ...modalProps.okButtonProps,
          disabled: slotLoading || modalProps.okButtonProps?.disabled,
        }}
      >
        <Suspense fallback={<FormLoading />}>
          <SlotReadyBoundary onReady={() => setSlotLoading(false)}>
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
          </SlotReadyBoundary>
        </Suspense>
      </ModalShell>
    ) : null;
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
