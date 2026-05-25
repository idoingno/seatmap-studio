import { Card, Form, FormInstance, Input, List, Radio, message } from "antd";
import React, { useEffect, useState } from "react";
import { ResponseType, handleCpApi } from "../../api";
import { Session } from "../../config";
import { SearchOutlined } from "@ant-design/icons";
import { useDebounceEffect } from "ahooks";

interface SelectTemplateFormPropsType {
  // mapUrl?: string;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
  getData?: () => void;
  setRefresh?: (val: boolean) => void;
}

const SelectTemplateForm = (
  props: React.PropsWithChildren<SelectTemplateFormPropsType>,
  ref?: React.ForwardedRef<FormInstance>
) => {
  const [form] = Form.useForm();

  // 获取场次Id
  const sessionId = Session.getDataId;

  const [data, setData] = useState([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [total, setTotal] = useState<number>(0);
  const [inputSearchValue, setInputSearchValue] = useState<string>("");

  const inputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSearchValue(e.target.value);
  };

  const onSubmit = async (values: any) => {
    if (!templateId) {
      message.error("请选择模板！");
      return;
    }
    props.beforeSubmit?.(values);
    const params = {
      type: "choose",
      sessionId,
      hallTemplateId: templateId,
    };
    const { code, subMsgType }: ResponseType = await handleCpApi({ params: params, code: "template" });
    if (code === 200 && subMsgType === "success") {
      message.success("操作完成~");
      props.getData();
      props.setRefresh(true);
    } else {
      message.error("操作失败~");
    }
    props.afterSubmit?.(values, form);
    form.resetFields();
  };

  const getList = async (pageNum = 1, name = "") => {
    setLoading(true);
    const hallParams = {
      // sessionId,
      $pageNum: pageNum,
      $pageSize: 9,
      $likeQueryField: "name",
      $sortField: "{'createdTime':'desc'}",
      name,
    };
    if (name === "") {
      delete hallParams.name;
      delete hallParams.$likeQueryField;
    }
    const params = {
      type: "find",
      hall: JSON.stringify(hallParams),
    } as any;

    const { code, subMsgType, data }: ResponseType = await handleCpApi({ params: params, code: "template" });
    if (code === 200 && subMsgType === "success") {
      setData(data.response.dataList);
      setTotal(Number(data.response.total));
    }
    setLoading(false);
  };

  useDebounceEffect(
    () => {
      getList(1, inputSearchValue);
    },
    [inputSearchValue],
    {
      wait: 500,
    }
  );

  const onChange = (e: any) => {
    setTemplateId(e.target.value);
  };

  return (
    <div className="form">
      <Input
        value={inputSearchValue}
        onChange={(e) => {
          inputOnChange(e);
        }}
        prefix={<SearchOutlined />}
        placeholder="搜索"
        style={{ marginBottom: "20px", width: "300px" }}
      />
      <Form onFinish={onSubmit} ref={ref} form={form}>
        <Radio.Group onChange={onChange}>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 3,
              xl: 3,
              xxl: 3,
            }}
            // itemLayout="vertical"
            // size="large"
            loading={loading}
            pagination={{
              total,
              onChange: (page) => {
                getList(page, inputSearchValue);
              },
              pageSize: 9,
            }}
            dataSource={data}
            renderItem={(item) => (
              <Radio.Button value={item.id}>
                <List.Item key={item.id}>
                  <div className="list-box">
                    <img alt="logo" src={item.s_hall_map} />
                    <span style={templateId === item.id ? { color: "#b39372" } : {}}>
                      {templateId === item.id ? "已选中：" : ""}
                      {item.name}
                    </span>
                  </div>
                </List.Item>
              </Radio.Button>
            )}
          />
        </Radio.Group>
      </Form>
    </div>
  );
};

export default SelectTemplateForm;
