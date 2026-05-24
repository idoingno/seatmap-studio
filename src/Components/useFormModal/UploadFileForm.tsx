import { Button, Checkbox, Form, FormInstance, Input, Upload, UploadFile, UploadProps, message } from "antd";
import React, { useState } from "react";
import { ResponseType, handleCpApi } from "../../api";
import { Session, getGraph } from "../../config";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import ExcelJs from "exceljs";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import store from "../../store";
import { emptyAction, isLoadAction } from "../../store/actionCreators";
import { delPersonnel } from "../../utils/apiParams";
import { chairSvg } from "../../config/Markup/chair";
import { patternSeat } from "../../assets";

interface UploadFileFormPropsType {
  //   mapUrl?: string;
  setRefresh?: (val: boolean) => void;
  getData?: () => void;
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [checked, setChecked] = useState(true);

  const uploadProps: UploadProps = {
    name: "file",
    accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    action: "/",
    maxCount: 1,
    onChange: ({ file }) => {
      if (file.status === "removed") {
        setFileList([]);
      } else {
        setFileList([file]);
      }
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const onImportExcel = (file: File) => {
    setUpLoading(true);
    // 获取场次Id
    const sessionId = Session.getDataId;
    // 创建FileReader 对象读取

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      const workbook = new ExcelJs.Workbook();
      // load 方法读取 ArrayBuffer 类型 具体参考文档
      workbook.xlsx.load(e.target.result as ArrayBuffer).then(async () => {
        const sheet = workbook.getWorksheet("Sheet1"); // 这里只读取了Sheet1的内容

        const imputData: any = [];

        const v_type = sheet.getCell("A5").text;

        const row_5: any = sheet.getRow(5);
        sheet.eachRow((row: any, idx: any) => {
          console.log("===============", row, idx);
          if (row.values && idx > 5) {
            let arr = [];
            for (let i = 1; i < row._cells.length; i++) {
              const element = row._cells[i];
              let obj = {
                name: element.text,
                idt: `${element.row - 6}-${element.col - 2}`,
                seat:
                  v_type !== "人数/桌数"
                    ? `${row.values[1]}-${row_5._cells[element.col - 1].text}座`
                    : `${row_5._cells[element.col - 1].text}-${row.values[1]}座`,
              };
              arr.push(obj);
            }
            imputData.push(...arr);
          }
        });
        // 这里 imputData 就是 Sheet1中的内容了
        console.log(imputData);

        const uploadArr = imputData.filter((item: { name: string; idt: string; seat: string }) => item.name !== "");

        const params = {
          type: "upload",
          sessionId,
          uploadData: JSON.stringify(uploadArr),
        };

        const { code, subMsgType }: ResponseType = await handleCpApi({ params: params, code: "template" });
        if (code === 200 && subMsgType === "success") {
          message.success("操作完成~");
          props.setRefresh(true);
          props.getData();
        } else {
          message.error("操作失败~");
        }

        setUpLoading(false);
        props.afterSubmit?.();
      });
    };
  };

  const onCheckChange = (e: CheckboxChangeEvent) => {
    setChecked(e.target.checked);
  };

  const onSubmit = async (values: any) => {
    console.log(values);
    // 获取场次Id
    const sessionId = Session.getDataId;

    props.beforeSubmit?.(values);

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
      // console.log(personNodeArr);

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

        console.log("button-xnode-------->", node);

        node.removeAttrByPath("xnode");
      });
    }

    onImportExcel(values.uFile.file);

    form.resetFields();
  };
  return (
    <div className="form">
      <Form onFinish={onSubmit} ref={ref} form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 14 }}>
        {upLoading ? (
          <>
            <LoadingOutlined style={{ marginRight: "5px" }} /> 上传中...
          </>
        ) : (
          <>
            <Form.Item
              label="文件上传"
              name="uFile"
              rules={[
                { required: true, message: "请上传文件" },
                {
                  validator: (itemProps, value) => {
                    if (value.fileList.length === 0) {
                      return Promise.reject(new Error("请上传文件"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Upload {...uploadProps} className="upload-file">
                {fileList.length === 0 ? <Button icon={<UploadOutlined />}>上传座位</Button> : null}
              </Upload>
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
