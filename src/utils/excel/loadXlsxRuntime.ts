type XlsxModule = typeof import("xlsx");

let xlsxRuntimePromise: Promise<XlsxModule> | undefined;

export const loadXlsxRuntime = async (): Promise<XlsxModule> => {
  if (!xlsxRuntimePromise) {
    xlsxRuntimePromise = import("xlsx").then((module) => module.default ?? module);
  }

  return xlsxRuntimePromise;
};
