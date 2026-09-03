import React, { useEffect, useRef, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import "./index.less";
import { getGraph } from "../config/graphInstance";
import { getRuntime } from "../store/accessors";
import { Graph } from "@antv/x6";
import useFormModal from "../Components/useFormModal";
import { useSelector } from "react-redux";
import { useCallbackState } from "../hooks/useCallbackState";
import { lazyForm } from "../Components/useFormModal/lazyForm";
import { exportSeatTemplate } from "../utils/excel/exportSeatTemplate";
import { exportLayout, importLayout, validateLayoutExport } from "../services/graphService";
import { message } from "../utils/message";
import AppIcon from "../Components/AppIcon";

const LayoutClearForm = lazyForm(() => import("../Components/useFormModal/LayoutClearForm"));
const UploadFileForm = lazyForm(() => import("../Components/useFormModal/UploadFileForm"));
const UserForm = lazyForm(() => import("../Components/useFormModal/UserForm"));

interface PageLoadingProps {
  setPageLoading: (val: boolean) => void;
  // setShowTemplate: (val: boolean) => void;
  // setMapUrl: (val: string) => void;
  setRefresh?: (val: boolean) => void;
  getData?: () => void | Promise<void>;
  refreshPeople?: () => void;
  closeApp?: () => void;
}

const CustomNodeHeader: React.FC<PageLoadingProps> = ({
  setPageLoading,
  // setShowTemplate,
  // setMapUrl,
  setRefresh,
  getData,
  refreshPeople,
  closeApp,
}) => {
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const [imgLoading, setImgLoading] = useCallbackState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  // const [upLoading, setUpLoading] = useState(false);
  // const [tempFile, setTempFile] = useState<string>("");

  const { modalRef: LayoutClearModalRef, FormModal: LayoutClearModal } = useFormModal(
    { title: "清空配置", width: "380px" },
    LayoutClearForm
  );

  const { modalRef: UploadFileModalRef, FormModal: UploadFileModal } = useFormModal(
    { title: "上传配置", width: "420px" },
    UploadFileForm
  );

  const { modalRef: UserModalRef, FormModal: UserModal } = useFormModal({ title: "模板配置" }, UserForm);

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

  // 布局 JSON 导入导出（序列化格式 = 存储查询响应 {schema:[...]}）
  const layoutFileRef = useRef<HTMLInputElement | null>(null);

  const exportLayoutJson = async () => {
    const layout = await exportLayout(getRuntime().sessionId);
    if (!layout) {
      message.warning("当前没有可导出的布局");
      return;
    }
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seatmap-layout-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const onLayoutFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const layout = Array.isArray(parsed) ? { schema: parsed } : parsed;
      if (!validateLayoutExport(layout)) {
        message.error("文件格式无效：应为导出的布局 JSON");
        return;
      }

      const ok = await importLayout(layout, getRuntime().sessionId);
      if (ok) {
        message.success("布局已导入");
        setRefresh?.(true);
        await getData?.();
      } else {
        message.error("导入布局失败，请稍后重试");
      }
    } catch (error) {
      message.error("文件读取失败，请选择有效的 JSON 文件");
    }
  };

  const waitForFrames = async (count = 2) => {
    for (let i = 0; i < count; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  };

  const captureGraphPng = async (graph: Graph) => {
    await waitForFrames();

    const graphRoot = graph.container?.querySelector("svg");
    if (!(graphRoot instanceof SVGSVGElement)) {
      throw new Error("graph-root-missing");
    }

    const clonedGraphRoot = graphRoot.cloneNode(true) as SVGSVGElement;
    const contentBox = graph.getContentBBox();
    const exportWidth = Math.max(Math.ceil(contentBox.width), 1);
    const exportHeight = Math.max(Math.ceil(contentBox.height), 1);

    clonedGraphRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedGraphRoot.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clonedGraphRoot.setAttribute("viewBox", `${contentBox.x} ${contentBox.y} ${contentBox.width} ${contentBox.height}`);
    clonedGraphRoot.setAttribute("width", `${exportWidth}`);
    clonedGraphRoot.setAttribute("height", `${exportHeight}`);

    clonedGraphRoot.querySelectorAll("image").forEach((imageNode) => {
      const href = imageNode.getAttribute("xlink:href") || imageNode.getAttribute("href");
      if (!href || href.startsWith("data:")) {
        return;
      }

      const absoluteHref = new URL(href, window.location.href).href;
      imageNode.setAttribute("href", absoluteHref);
      imageNode.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", absoluteHref);
    });

    const svgMarkup = new XMLSerializer().serializeToString(clonedGraphRoot);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("svg-image-load-failed"));
      nextImage.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas-context-missing");
    }

    context.fillStyle = "#FFF";
    context.fillRect(0, 0, exportWidth, exportHeight);
    context.drawImage(image, 0, 0, exportWidth, exportHeight);

    return canvas.toDataURL("image/png");
  };

  const finishExport = async (oper: string, seatMapUrl: string) => {
    if (oper !== "download") {
      UserModalRef.current?.open({ mapUrl: seatMapUrl });
      return;
    }

    const cpForm = getRuntime().cpForm;
    const venueName = cpForm["K2582458"].text;
    const link = document.createElement("a");
    link.href = seatMapUrl;
    link.download = `${venueName}-场地座位图.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const setImgDom = async (oper = "download") => {
    const grpah: Graph = getGraph();
    if (oper !== "download" && grpah.getNodes().length === 0) {
      message.warning("请先创建一个布局，再另存为模板");
      setImgLoading(false);
      return;
    }

    const shouldRestoreVirtualRender = Boolean((grpah as any).options?.virtual);
    const restoreVirtualRender = () => {
      if (shouldRestoreVirtualRender) {
        grpah.enableVirtualRender();
      }
    };

    if (oper !== "download") {
      setTemplateLoading(true);
    }

    const finishCapture = () => {
      if (oper !== "download") {
        setTemplateLoading(false);
      }
      restoreVirtualRender();
      setImgLoading(false);
    };

    try {
      if (shouldRestoreVirtualRender) {
        grpah.disableVirtualRender();
      }

      const graphPng = await captureGraphPng(grpah);

      await finishExport(oper, graphPng);
    } catch (error) {
      message.error("导出座位图失败，请稍后重试");
    } finally {
      finishCapture();
    }
  };

  const saveTemplate = () => {
    if (templateLoading) return;
    setImgDom("imgUrl");
  };

  const exportToExcel = async () => {
    try {
      await exportSeatTemplate();
    } catch (error) {
      message.error("导出 Excel 模板失败，请稍后重试");
    }
  };

  return (
    <>
      <header className="container-header">
        <div className="left header-block">
          {closeApp ? (
            <button type="button" className="back-button" aria-label="返回" onClick={closeApp}>
              <AppIcon name="arrowLeft" />
            </button>
          ) : null}
          <div className="brand-lockup">
            <span className="eyebrow">Seatmap Studio</span>
            <span className="text">会议室布局编辑台</span>
          </div>
          <div className="save-status">
            <span className={`status-dot ${loading ? "is-loading" : "is-ready"}`} />
            {loading ? (
              <>
                <LoadingOutlined /> <span className="save-status-text">自动保存中</span>
              </>
            ) : (
              <>
                <AppIcon name="statusReady" className="save-status-icon" />
                <span className="save-status-text">{time ? `已保存 ${time}` : `已同步到最新版本`}</span>
              </>
            )}
          </div>
        </div>
        <div className="middle header-block">
          <button type="button" className="header-tool" onClick={toEmpty}>
            <AppIcon name="clearCanvas" className="tool-icon" />
            <span>清空画布</span>
          </button>
          <button type="button" className="header-tool" onClick={exportToExcel}>
            <AppIcon name="downloadSheet" className="tool-icon" />
            <span>下载 Excel 模板</span>
          </button>
          <button type="button" className="header-tool" onClick={toUpload}>
            <AppIcon name="uploadSheet" className="tool-icon" />
            <span>上传座位配置</span>
          </button>
          <button type="button" className="header-tool" data-testid="export-layout-button" onClick={exportLayoutJson}>
            <AppIcon name="downloadSheet" className="tool-icon" />
            <span>导出布局</span>
          </button>
          <button type="button" className="header-tool" onClick={() => layoutFileRef.current?.click()}>
            <AppIcon name="uploadSheet" className="tool-icon" />
            <span>导入布局</span>
          </button>
          <input
            ref={layoutFileRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="import-layout-input"
            onChange={onLayoutFileChange}
          />
        </div>
        <div className="right header-block">
          <button type="button" className="action-button" data-testid="export-seatmap-button" onClick={exportSeat}>
            <AppIcon name="exportImage" className="action-icon" />
            <span className="action-text-group">
              <span className="action-eyebrow">Export</span>
              <span className="action-label">
                {imgLoading ? (
                  <>
                    <LoadingOutlined style={{ marginRight: "5px" }} /> 导出中...
                  </>
                ) : (
                  <span>导出座位图</span>
                )}
              </span>
            </span>
          </button>
          <button type="button" className="action-button" data-testid="save-template-button" onClick={saveTemplate}>
            <AppIcon name="saveTemplate" className="action-icon" />
            <span className="action-text-group">
              <span className="action-eyebrow">Template</span>
              <span className="action-label">
                {templateLoading ? (
                  <>
                    <LoadingOutlined style={{ marginRight: "5px" }} /> 获取图像...
                  </>
                ) : (
                  <span>另存为模板</span>
                )}
              </span>
            </span>
          </button>
        </div>
      </header>
      <LayoutClearModal />
      <UploadFileModal setRefresh={setRefresh} getData={getData} refreshPeople={refreshPeople} />
      <UserModal />
    </>
  );
};

export default CustomNodeHeader;
