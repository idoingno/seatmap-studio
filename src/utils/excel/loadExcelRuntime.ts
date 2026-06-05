type ExcelJsModule = typeof import("exceljs");

let excelRuntimePromise: Promise<ExcelJsModule> | null = null;

export const loadExcelRuntime = async (): Promise<ExcelJsModule> => {
  if (!excelRuntimePromise) {
    excelRuntimePromise = import("exceljs").then((module) => module.default ?? module);
  }

  return excelRuntimePromise;
};
