import React, { useEffect, useRef, useState } from "react";
import { ArrowLeftOutlined, CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";

import { img_export_seat, img_seat_empty, img_seat_download, img_seat_upload, img_seat_save } from "../assets";
import "./index.less";
import { message } from "antd";
import {
  AlphabeticSerialNumber,
  CPForm,
  LoadingStatus,
  Session,
  getCurrentColumn,
  getCurrentRow,
  getGraph,
} from "../config";
// import { emptyGraph } from "../utils/apiParams";
import { ResponseType, handleCpApi } from "../api";
import store from "../store";
import { Graph, Node } from "@antv/x6";
import { base64ToFile, sortCompareFn3 } from "../utils/util";
// import { time } from "../utils/util";
import domtoimage from "dom-to-image";
import { getHasPersonSeatImg } from "../utils/oss";
import { useGetState, useUpdateEffect } from "ahooks";
import useFormModal from "../Components/useFormModal";
import LayoutClearForm from "../Components/useFormModal/LayoutClearForm";
import UploadFileForm from "../Components/useFormModal/UploadFileForm";
import { useSelector } from "react-redux";
import { useCallbackState } from "../hooks/useCallbackState";
import UserForm from "../Components/useFormModal/UserForm";

interface PageLoadingProps {
  setPageLoading: (val: boolean) => void;
  // setShowTemplate: (val: boolean) => void;
  // setMapUrl: (val: string) => void;
  setRefresh?: (val: boolean) => void;
  getData?: () => void;
  closeApp?: () => void;
}

const CustomNodeHeader: React.FC<PageLoadingProps> = ({
  setPageLoading,
  // setShowTemplate,
  // setMapUrl,
  setRefresh,
  getData,
  closeApp,
}) => {
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const [colorImgPng, setColorImgPng] = useState("");
  const [graphImgPng, setGraphImgPng] = useState("");
  const [imgLoading, setImgLoading] = useCallbackState(false);
  // const [imgLoading, setImgLoading, getImgLoading] = useGetState<boolean>(false);
  // const [venueMapUrl, setVenueMapUrl, getVenueMapUrl] = useGetState<string>("");
  const [templateStatus, setTemplateStatus] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  // const [upLoading, setUpLoading] = useState(false);
  // const [tempFile, setTempFile] = useState<string>("");

  const { modalRef: LayoutClearModalRef, FormModal: LayoutClearModal } = useFormModal(
    { title: "清空配置", width: "300px" },
    React.forwardRef(LayoutClearForm)
  );

  const { modalRef: UploadFileModalRef, FormModal: UploadFileModal } = useFormModal(
    { title: "上传配置", width: "420px" },
    React.forwardRef(UploadFileForm)
  );

  const { modalRef: UserModalRef, FormModal: UserModal } = useFormModal(
    { title: "模板配置" },
    React.forwardRef(UserForm)
  );

  const toEmpty = () => {
    LayoutClearModalRef.current.open();
  };

  const toUpload = () => {
    UploadFileModalRef.current.open();
  };

  // function selectLoading(state: any) {
  //   return state.seater.loading;
  // }

  const selectLoading = useSelector((state: any) => state.seater.loading);

  const selectTime = useSelector((state: any) => state.seater.time);

  useEffect(() => {
    let currentValue: any;
    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {
    let previousValue = currentValue;
    // currentValue = selectLoading(store.getState());
    currentValue = selectLoading;

    if (previousValue !== currentValue) {
      setLoading(currentValue);
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectLoading]);

  useEffect(() => {
    let currentValue: any;
    // 监听state的变化
    // const unsubscribe = store.subscribe(() => {
    let previousValue = currentValue;
    // currentValue = selectTime(store.getState());
    currentValue = selectTime;

    if (previousValue !== currentValue) {
      setTime(currentValue);
    }
    // });
    // return () => {
    //   // 取消监听
    //   unsubscribe();
    // };
  }, [selectTime]);

  const exportSeat = () => {
    if (imgLoading) return;
    setImgLoading(true);
    setImgDom();
  };

  const setImgDom = (oper = "download") => {
    const grpah: Graph = getGraph();
    if (oper !== "download" && grpah.getNodes().length === 0) {
      message.warning("请先创建一个布局，再另存为模板");
      return;
    }

    const shouldRestoreVirtualRender = Boolean((grpah as any).options?.virtual);
    const restoreVirtualRender = () => {
      if (shouldRestoreVirtualRender) {
        grpah.enableVirtualRender();
      }
    };

    if (oper !== "download") {
      setTemplateStatus(false);
      setTemplateLoading(true);
    }

    const finishCapture = () => {
      if (oper !== "download") {
        setTemplateStatus(true);
        setTemplateLoading(false);
      }
      restoreVirtualRender();
      setImgLoading(false);
    };

    setTimeout(() => {
      if (shouldRestoreVirtualRender) {
        grpah.disableVirtualRender();
      }

      grpah.toPNG((base64Img: string) => {
        const colorImgDom = document.querySelector(".color-edit-in");
        setGraphImgPng(base64Img);

        if (!colorImgDom?.hasChildNodes()) {
          setColorImgPng("");

          downloadImg(oper).finally(finishCapture);
        } else {
          domtoimage
            .toPng(colorImgDom, { bgcolor: "#FFF" })
            .then((val: any) => {
              setColorImgPng(val);
              return downloadImg(oper);
            })
            .catch(() => {
              message.error("导出座位图失败，请稍后重试");
            })
            .finally(finishCapture);
        }
      });
    }, 600);
  };

  const downloadImg = async (oper: string) => {
    const cpForm = CPForm.getForm;

    const v_name = cpForm["K2582458"].text;

    // 获取场次Id
    const sessionId = Session.getDataId;
    const downloadImgDom = document.querySelector("#download_img");

    const canvas = await domtoimage.toPng(downloadImgDom, { bgcolor: "#FFF" });

    const imgFile = base64ToFile(canvas);

    // 获取ossKey 并上传图片
    const mapUrl = await getHasPersonSeatImg(`${v_name}-场地座位图.png`, imgFile);
    if (oper !== "download") {
      // setVenueMapUrl(mapUrl);
      // setMapUrl(mapUrl);
      UserModalRef.current?.open({ mapUrl });
      return;
    }

    const link = document.createElement("a");
    const blob = new Blob([imgFile], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${v_name}-场地座位图.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    await handleCpApi({
      params: { id: sessionId, venueMap: mapUrl },
      code: "mapPicture",
    });

    setImgLoading(false);
  };

  const saveTemplate = () => {
    if (templateLoading) return;
    setImgDom("imgUrl");
  };

  useUpdateEffect(() => {
    if (templateStatus) {
      // setShowTemplate(true);
      setTemplateStatus(false);
    }
  }, [templateStatus]);

  // 导出excel文件
  const exportToExcel = async () => {
    const cpForm = CPForm.getForm;

    const v_name = cpForm["K2582458"].text;
    const v_time_s = cpForm["K2460125"].value;
    const v_time_e = cpForm["K2460124"].value;
    const v_position = cpForm["K2460459"].text;

    let sheetName = "Sheet1";
    let fileName = `${v_name}-人员排座模板.xlsx`;
    let headerName = "RequestsList";
    let headerColumnArr: { name: string }[] = [];

    const graph = getGraph();
    const nodes = graph.getNodes();

    const container = nodes.find((item) => item.data?.nodeType?.includes("Container"));
    if (!container) {
      message.warning("请先创建一个布局，再下载 Excel 模板");
      return;
    }
    const { default: ExcelJs } = await import("exceljs");

    let rowArr = [];

    // 矩阵节点
    if (container.data.nodeType === "matrixContainer") {
      headerColumnArr = [{ name: "排数/座位号" }];

      const matrixChildrenRows = container.children
        .filter((item) => item.data.nodeType === "matrixRows")
        .sort(sortCompareFn3)
        .map((node: Node) => node.attrs.text.text);

      const matrixChildrenNums: any = container.children
        .filter((item) => item.data.nodeType === "matrixColumnTopNum")
        .sort(sortCompareFn3)
        .map((node: Node) => {
          return { name: node.attrs.text.text };
        });

      headerColumnArr = headerColumnArr.concat(matrixChildrenNums);

      const total = matrixChildrenRows.length;
      for (let i = 0; i < total; i++) {
        let a = matrixChildrenRows.slice(i, i + 1);
        rowArr.push(a);
      }
    } else {
      // 圆桌
      headerColumnArr = [{ name: "人数/桌数" }];

      const circleContainer = nodes.filter((item) => item.data.nodeType === "circleContainer");

      const circleNumsArr = circleContainer.map((item) => item.data.circleChairNum);
      const circleRowsArr = circleContainer.map((item) => item.data.tableName);
      const maxNums = Math.max(...circleNumsArr);

      for (let i = 0; i < maxNums; i++) {
        let arr = [];
        arr.push(i + 1);
        rowArr.push(arr);
      }

      for (let j = 0; j < circleRowsArr.length; j++) {
        let tempObj = { name: "" };
        tempObj.name = `${circleRowsArr[j]}`;
        headerColumnArr.push(tempObj);
      }
    }

    // 获取sheet对象，设置当前sheet的样式
    // showGridLines: false 表示不显示表格边框
    let workbook = new ExcelJs.Workbook();
    let sheet: any = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: false }],
    });
    // let sheet2 = workbook.addWorksheet("Second sheet", { views: [{ showGridLines: false }] });

    sheet.properties.defaultRowHeight = 30;
    sheet.properties.defaultColWidth = 15;

    // 设置表格的头部信息，可以用来设置标题，说明或者注意事项
    sheet.addTable({
      name: `Header`,
      ref: "A1", // 头部信息从A1单元格开始显示
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
      rows: [[`会场名称：${v_name}`], [`会场时间：${v_time_s} ~ ${v_time_e}`], [`会场地点：${v_position}`]],
    });

    // 设置表格的主要数据部分
    sheet.addTable({
      name: headerName,
      ref: "A5", // 主要数据从A5单元格开始
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: false,
        width: 20,
      },
      columns: headerColumnArr ? headerColumnArr : [{ name: "" }],
      rows: rowArr,
    });

    sheet.getCell("A1").font = { size: 18, bold: true }; // 设置单元格的文字样式
    sheet.getCell("A2").font = { size: 16, bold: true }; // 设置单元格的文字样式
    sheet.getCell("A3").font = { size: 16, bold: true }; // 设置单元格的文字样式
    sheet.getCell("A4").font = { size: 16, bold: true }; // 设置单元格的文字样式
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
      // 表格主体数据是从A5开始绘制的，一共有三列。这里是获取A5到，B5，C5单元格，定义表格的头部样式
      sheet.getCell(`${AlphabeticSerialNumber[i]}5`).font = { size: 12, bold: true };
      sheet.getCell(`${AlphabeticSerialNumber[i]}5`).alignment = { vertical: "middle" };
      sheet.getCell(`${AlphabeticSerialNumber[i]}5`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "c5d9f1" },
      };

      // 获取表格数据部分，定义其样式
      for (let j = 0; j < table.table.rows.length; j++) {
        let rowCell = sheet.getCell(`${AlphabeticSerialNumber[i]}${j + 6}`);
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

    const writeFile = (fileName: string, content: string) => {
      const link = document.createElement("a");
      const blob = new Blob([content], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();
    };

    // 表格的数据绘制完成，定义下载方法，将数据导出到Excel文件
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      writeFile(fileName, buffer);
    });
  };

  // const onImportExcel = (file: File) => {
  //   setUpLoading(true);
  //   // 获取场次Id
  //   const sessionId = Session.getDataId;
  //   // 创建FileReader 对象读取
  //   // const reader: any = new FileReader();
  //   // reader.readAsText(file);
  //   // reader.onload = () => {
  //   //   // 获取文件内容存进tempFile
  //   //   setTempFile(reader.result);
  //   // };
  //   // let headerName = "RequestsList";

  //   const fileReader = new FileReader();
  //   fileReader.readAsArrayBuffer(file);
  //   fileReader.onload = (e) => {
  //     const workbook = new ExcelJs.Workbook();
  //     // load 方法读取 ArrayBuffer 类型 具体参考文档
  //     workbook.xlsx.load(e.target.result as ArrayBuffer).then(async () => {
  //       const sheet = workbook.getWorksheet("Sheet1"); // 这里只读取了Sheet1的内容

  //       const imputData: any = [];

  //       const v_type = sheet.getCell("A5").text;

  //       const row_5: any = sheet.getRow(5);
  //       sheet.eachRow((row: any, idx: any) => {
  //         if (row.values && idx > 5) {
  //           let arr = [];
  //           for (let i = 1; i < row._cells.length; i++) {
  //             const element = row._cells[i];
  //             let obj = {
  //               name: element.text,
  //               idt: `${element.row - 6}-${element.col - 2}`,
  //               seat:
  //                 v_type !== "人数/桌数"
  //                   ? `${row.values[1]}-${row_5._cells[element.col - 1].text}座`
  //                   : `${row_5._cells[element.col - 1].text}-${row.values[1]}座`,
  //             };
  //             arr.push(obj);
  //           }
  //           imputData.push(...arr);
  //         }
  //       });
  //       // 这里 imputData 就是 Sheet1中的内容了
  //       const uploadArr = imputData.filter((item: { name: string; idt: string; seat: string }) => item.name !== "");

  //       const params = {
  //         type: "upload",
  //         sessionId,
  //         uploadData: JSON.stringify(uploadArr),
  //       };
  //       // const params = { type: "save", hallMap: props.mapUrl, name: values.templateName };
  //       const { code, subMsgType }: ResponseType = await handleCpApi({ params: params, code: "template" });
  //       if (code === 200 && subMsgType === "success") {
  //         message.success("操作完成~");
  //         setRefresh(true);
  //         getData();
  //       } else {
  //         message.error("操作失败~");
  //       }
  //       setUpLoading(false);
  //     });
  //   };
  // };

  // const props: UploadProps = {
  //   name: "file",
  //   accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
  //   action: "/",
  //   beforeUpload: (file) => onImportExcel(file),
  //   showUploadList: false,
  // };

  return (
    <header>
      <div className="container-header">
        <div className="left">
          {closeApp ? <ArrowLeftOutlined onClick={closeApp} style={{ marginRight: "20px" }} /> : null}
          <span className="text">会议室布局</span>

          <div className="save-status">
            {loading ? (
              <>
                <LoadingOutlined /> <span className="save-status-text">自动保存中…</span>
              </>
            ) : (
              <>
                <CheckCircleOutlined />
                <span className="save-status-text">{time ? `已保存 ${time}` : `已加载最新版本`}</span>
              </>
            )}
          </div>
        </div>
        <div className="middle">
          <div onClick={toEmpty}>
            <img src={img_seat_empty} />
            清空
          </div>
          <div onClick={exportToExcel}>
            <img src={img_seat_download} />
            下载Excel模板
          </div>
          <div onClick={toUpload}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img src={img_seat_upload} />
              <span>上传座位</span>
            </div>
          </div>
        </div>
        <div className="right">
          <div>
            <img src={img_export_seat} />
            {imgLoading ? (
              <>
                <LoadingOutlined style={{ marginRight: "5px" }} /> 导出中...
              </>
            ) : (
              <span onClick={exportSeat}>导出座位图</span>
            )}
          </div>
          <div>
            <img src={img_seat_save} />
            {templateLoading ? (
              <>
                <LoadingOutlined style={{ marginRight: "5px" }} /> 获取图像...
              </>
            ) : (
              <span onClick={saveTemplate}>另存为模板</span>
            )}
          </div>
        </div>
      </div>

      <div id="download_img">
        {colorImgPng ? <img id="color_img" src={colorImgPng} /> : <></>}
        <img src={graphImgPng} />
      </div>
      <LayoutClearModal />
      <UploadFileModal setRefresh={setRefresh} getData={getData} />
      <UserModal />
    </header>
  );
};

export default CustomNodeHeader;
