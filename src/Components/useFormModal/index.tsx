import type { FormInstance, ModalProps } from "antd";
import React, { PropsWithoutRef, Suspense, forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import "./index.less";

const ModalShell = React.lazy(() => import("./ModalShell"));

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
    const onCancel: NonNullable<ModalProps["onCancel"]> = () => {
      close();
    };
    const formRef = React.useRef<FormInstance>();
    const ok: NonNullable<ModalProps["onOk"]> = () => {
      formRef.current?.submit();
    };
    return (
      visiable ? (
        <Suspense fallback={null}>
          <ModalShell onCancel={onCancel} onOk={ok} open={visiable} confirmLoading={loading} {...modalProps}>
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
          </ModalShell>
        </Suspense>
      ) : null
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
