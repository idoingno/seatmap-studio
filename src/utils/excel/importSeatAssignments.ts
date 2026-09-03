import { handleCpApi, ResponseType } from "../../api";
import { getRuntime } from "../../store/accessors";
import { loadXlsxRuntime } from "./loadXlsxRuntime";

export const importSeatAssignments = async (file: File) => {
  const sessionId = getRuntime().sessionId;
  const fileBuffer = await file.arrayBuffer();
  const XLSX = await loadXlsxRuntime();
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

  if (!sheet) {
    throw new Error("sheet-not-found");
  }

  const rows = XLSX.utils.sheet_to_json<(string | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const inputData: Array<{ name: string; idt: string; seat: string }> = [];

  const compactRows = rows.filter((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim() !== ""));
  const headerRow = compactRows[0] || [];
  const seatType = String(headerRow[0] || "");

  compactRows.forEach((row, rowIndex) => {
    if (!row || rowIndex === 0) {
      return;
    }

    const rowLabel = String(row[0] || "");
    if (!rowLabel) {
      return;
    }

    for (let columnIndex = 1; columnIndex < row.length; columnIndex++) {
      const cellText = String(row[columnIndex] || "").trim();
      if (!cellText) {
        continue;
      }

      const columnLabel = String(headerRow[columnIndex] || "").trim();
      inputData.push({
        name: cellText,
        idt: `${rowIndex - 1}-${columnIndex - 1}`,
        seat: seatType !== "人数/桌数" ? `${rowLabel}-${columnLabel}座` : `${columnLabel}-${rowLabel}座`,
      });
    }
  });

  const params = {
    type: "upload",
    sessionId,
    uploadData: JSON.stringify(inputData),
  };

  return handleCpApi({ params, code: "template" }) as Promise<ResponseType>;
};
