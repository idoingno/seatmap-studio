import { Checkbox, Form, FormInstance } from "antd";
import React, { useRef, useState } from "react";
import { handleCpApi } from "../../api";
import { Session, getGraph } from "../../config";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import store from "../../store";
import { emptyAction, isLoadAction } from "../../store/actionCreators";
import { delPersonnel } from "../../utils/apiParams";
import { chairSvg } from "../../config/Markup/chair";
import { patternSeat } from "../../assets";
import { importSeatAssignments } from "../../utils/excel/importSeatAssignments";
import { message } from "../../utils/message";

interface UploadFileFormPropsType {
  //   mapUrl?: string;
  setRefresh?: (val: boolean) => void;
  getData?: () => void | Promise<void>;
  refreshPeople?: () => void;
  beforeSubmit?: (values: any) => void;
  //   afterSubmit?: (values: any, form: FormInstance<any>) => void;
  afterSubmit?: () => void;
}

const UploadFileForm = (
  props: React.PropsWithChildren<UploadFileFormPropsType>,
  ref?: React.ForwardedRef<FormInstance>
) => {
  const [form] = Form.useForm();
  const [upLoading, setUpLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checked, setChecked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportExcel = (file: File) => {
    setUpLoading(true);
    importSeatAssignments(file)
      .then(async ({ code, subMsgType }) => {
        if (code === 200 && subMsgType === "success") {
          props.setRefresh?.(true);
          if (props.refreshPeople) {
            props.refreshPeople();
          } else {
            await props.getData?.();
          }
          message.success("操作完成~");
        } else {
          message.error("操作失败~");
        }
      })
      .catch(() => {
        message.error("Excel 解析失败，请检查模板后重试");
      })
      .finally(() => {
        setUpLoading(false);
        props.afterSubmit?.();
      });
  };

  const onCheckChange = (e: CheckboxChangeEvent) => {
    setChecked(e.target.checked);
  };

  const onSubmit = async (values: any) => {
    // 获取场次Id
    const sessionId = Session.getDataId;

    props.beforeSubmit?.(values);

    if (!selectedFile) {
      message.error("请上传文件");
      return;
    }

    if (checked) {
      store.dispatch(emptyAction());
      store.dispatch(isLoadAction(false));

      const graph = getGraph();
      const nodes = graph.getNodes();
      const personNode = nodes.filter((node) => node.attrs.xnode);

      // const personNodeArr = personNode.map((item) => {
      //   return {
      //     id: item.attrs.xnode.key,
      //   };
      // });
      // if (personNodeArr.length > 0) {
      // 全部人员删除
      const nodeParams = delPersonnel([], sessionId, false);
      await handleCpApi({ params: nodeParams, code: "seat" }, true);
      // }

      personNode.forEach((node) => {
        node.setMarkup([
          {
            tagName: "rect",
            attrs: {
              width: "40px",
              height: "40px",
            },
          },
          chairSvg,
          {
            tagName: "image",
          },
          {
            tagName: "text",
          },
        ]);

        node.attr("svg/fill", "#FFFFFF");
        node.attr("svg/style", "display:block");
        node.attr("image", {
          width: 40,
          y: 3,
          style: {
            display: "none",
          },
          "xlink:href": patternSeat,
        });
        node.attr("text/text", "");

        node.data = {
          disableMove: true,
          nodeType: node.data.nodeType,
          visible: true,
        };

        node.removeAttrByPath("xnode");
      });
    }

    onImportExcel(selectedFile);

    form.resetFields();
    setSelectedFile(null);
  };
  return (
    <div className="form studio-form-shell">
      <div className="studio-form-intro">
        <span className="studio-form-kicker">Import</span>
        <span className="studio-form-copy">导入 Excel 座位名单。默认会先清掉当前排座，避免旧数据混入。</span>
      </div>
      <Form onFinish={onSubmit} ref={ref} form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 14 }}>
        {upLoading ? (
          <>
            <LoadingOutlined style={{ marginRight: "5px" }} /> 上传中...
          </>
        ) : (
          <>
            <Form.Item label="文件上传">
              <div className="studio-upload-stack">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setSelectedFile(nextFile);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="studio-upload-button"
                >
                  <UploadOutlined style={{ marginRight: 6 }} />
                  {selectedFile ? "重新选择文件" : "上传座位"}
                </button>
                <span className={`studio-upload-file${selectedFile ? " is-selected" : ""}`}>
                  {selectedFile ? selectedFile.name : "请选择 Excel 座位文件"}
                </span>
              </div>
            </Form.Item>
            <Form.Item label="">
              <Checkbox checked={checked} onChange={onCheckChange}>
                清空当前座位
              </Checkbox>
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

export default UploadFileForm;
