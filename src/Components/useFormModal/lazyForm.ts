import React from "react";
import type { FormInstance } from "antd";

type LazyFormLoader = () => Promise<{
  default: (props: React.PropsWithChildren<any>, ref?: React.ForwardedRef<FormInstance>) => React.ReactElement | null;
}>;

export const lazyForm = (loader: LazyFormLoader) => {
  return React.lazy(async () => {
    const module = await loader();
    return {
      default: React.forwardRef<FormInstance, any>(module.default),
    };
  });
};
