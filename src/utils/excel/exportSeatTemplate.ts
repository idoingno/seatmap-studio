import { message } from "antd";
import { Graph, Node } from "@antv/x6";
import { AlphabeticSerialNumber, CPForm, getGraph } from "../../config";
import { sortCompareFn3 } from "../util";
import { loadExcelRuntime } from "./loadExcelRuntime";

const writeExcelFile = (fileName: string, content: BlobPart) => {
  const link = document.createElement("a");
  const blob = new Blob([content], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  link.download = fileName;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(link.href), 0);
};

export const exportSeatTemplate = async () => {
  const cpForm = CPForm.getForm;

  const venueName = cpForm["K2582458"].text;
  const venueStartTime = cpForm["K2460125"].value;
  const venueEndTime = cpForm["K2460124"].value;
  const venuePosition = cpForm["K2460459"].text;

  const fileName = `${venueName}-人员排座模板.xlsx`;
  const sheetName = "Sheet1";
  const headerName = "RequestsList";

  let headerColumnArr: { name: string }[] = [];
  let rowArr: Array<Array<string | number>> = [];

  const graph: Graph = getGraph();
  const nodes = graph.getNodes();
  const container = nodes.find((item) => item.data?.nodeType?.includes("Container"));

  if (!container) {
    message.warning("请先创建一个布局，再下载 Excel 模板");
    return;
  }

  if (container.data.nodeType === "matrixContainer") {
    headerColumnArr = [{ name: "排数/座位号" }];

    const matrixChildrenRows = container.children
      .filter((item) => item.data.nodeType === "matrixRows")
      .sort(sortCompareFn3)
      .map((node: Node) => node.attrs.text.text);

    const matrixChildrenNums = container.children
      .filter((item) => item.data.nodeType === "matrixColumnTopNum")
      .sort(sortCompareFn3)
      .map((node: Node) => ({ name: String(node.attrs.text.text ?? "") }));

    headerColumnArr = headerColumnArr.concat(matrixChildrenNums);
    rowArr = matrixChildrenRows.map((rowLabel: string) => [rowLabel]);
  } else {
    headerColumnArr = [{ name: "人数/桌数" }];

    const circleContainer = nodes.filter((item) => item.data.nodeType === "circleContainer");
    const circleNumsArr = circleContainer.map((item) => item.data.circleChairNum);
    const circleRowsArr = circleContainer.map((item) => item.data.tableName);
    const maxNums = Math.max(...circleNumsArr);

    for (let i = 0; i < maxNums; i++) {
      rowArr.push([i + 1]);
    }

    circleRowsArr.forEach((tableName: string) => {
      headerColumnArr.push({ name: tableName });
    });
  }

  const ExcelJs = await loadExcelRuntime();
  const workbook = new ExcelJs.Workbook();
  const sheet: any = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
  });

  sheet.properties.defaultRowHeight = 30;
  sheet.properties.defaultColWidth = 15;

  sheet.addTable({
    name: "Header",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "",
      showRowStripes: false,
      showFirstColumn: true,
      width: 20,
      center: true,
    },
    columns: [{ name: "会场布局图" }],
    rows: [[`会场名称：${venueName}`], [`会场时间：${venueStartTime} ~ ${venueEndTime}`], [`会场地点：${venuePosition}`]],
  });

  sheet.addTable({
    name: headerName,
    ref: "A5",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: false,
      width: 20,
    },
    columns: headerColumnArr.length > 0 ? headerColumnArr : [{ name: "" }],
    rows: rowArr,
  });

  sheet.getCell("A1").font = { size: 18, bold: true };
  sheet.getCell("A2").font = { size: 16, bold: true };
  sheet.getCell("A3").font = { size: 16, bold: true };
  sheet.getCell("A4").font = { size: 16, bold: true };
  sheet.mergeCells(`A1:${AlphabeticSerialNumber[headerColumnArr.length - 1]}1`);
  sheet.mergeCells(`A2:${AlphabeticSerialNumber[headerColumnArr.length - 1]}2`);
  sheet.mergeCells(`A3:${AlphabeticSerialNumber[headerColumnArr.length - 1]}3`);
  sheet.mergeCells(`A4:${AlphabeticSerialNumber[headerColumnArr.length - 1]}4`);
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

  const row = sheet.getRow(1);
  const row2 = sheet.getRows(2, 3);
  const row3 = sheet.getRow(5);
  row2.alignment = { vertical: "middle" };

  row.height = 30;
  row2.height = 20;
  row3.height = 20;

  const table = sheet.getTable(headerName);
  for (let i = 0; i < table.table.columns.length; i++) {
    sheet.getCell(`${AlphabeticSerialNumber[i]}5`).font = { size: 12, bold: true };
    sheet.getCell(`${AlphabeticSerialNumber[i]}5`).alignment = { vertical: "middle" };
    sheet.getCell(`${AlphabeticSerialNumber[i]}5`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "c5d9f1" },
    };

    for (let j = 0; j < table.table.rows.length; j++) {
      const rowCell = sheet.getCell(`${AlphabeticSerialNumber[i]}${j + 6}`);
      rowCell.font = { size: 12 };
      rowCell.alignment = { wrapText: true, vertical: "middle" };
      rowCell.border = {
        bottom: {
          style: "thin",
          color: { argb: "a6a6a6" },
        },
        right: {
          style: "thin",
          color: { argb: "a6a6a6" },
        },
      };
    }
  }

  table.commit();

  const buffer = await workbook.xlsx.writeBuffer();
  writeExcelFile(fileName, buffer);
};
