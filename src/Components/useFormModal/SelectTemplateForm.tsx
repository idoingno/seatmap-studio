import { Form, FormInstance, Input } from "antd";
import React, { useMemo, useState } from "react";
import { ResponseType, handleCpApi } from "../../api";
import { getRuntime } from "../../store/accessors";
import { SearchOutlined } from "@ant-design/icons";
import { useDebounceEffect } from "ahooks";
import "./SelectTemplateForm.less";
import { message } from "../../utils/message";

interface SelectTemplateFormPropsType {
  // mapUrl?: string;
  beforeSubmit?: (values: any) => void;
  afterSubmit?: (values: any, form: FormInstance<any>) => void;
  getData?: () => void | Promise<void>;
  setRefresh?: (val: boolean) => void;
}

const SelectTemplateForm = (
  props: React.PropsWithChildren<SelectTemplateFormPropsType>,
  ref?: React.ForwardedRef<FormInstance>
) => {
  const [form] = Form.useForm();
  const pageSize = 9;

  const [data, setData] = useState([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [total, setTotal] = useState<number>(0);
  const [pageNum, setPageNum] = useState<number>(1);
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
    // 提交时刻读取场次Id
    const sessionId = getRuntime().sessionId;
    const params = {
      type: "choose",
      sessionId,
      hallTemplateId: templateId,
    };
    const { code, subMsgType }: ResponseType = await handleCpApi({ params: params, code: "template" });
    if (code === 200 && subMsgType === "success") {
      await props.getData?.();
      props.setRefresh?.(true);
      message.success("操作完成~");
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
      $pageSize: pageSize,
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
      setPageNum(1);
      getList(1, inputSearchValue);
    },
    [inputSearchValue],
    {
      wait: 500,
    }
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageButtons = useMemo(() => {
    const pages = new Set<number>([1, totalPages, pageNum - 1, pageNum, pageNum + 1]);
    return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  }, [pageNum, totalPages]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === pageNum) {
      return;
    }

    setPageNum(nextPage);
    getList(nextPage, inputSearchValue);
  };

  return (
    <div className="form studio-form-shell template-select-form">
      <div className="studio-form-intro">
        <span className="studio-form-copy">从已有模板快速接管布局，适合复刻同类会场或活动排布。</span>
      </div>
      <Input
        value={inputSearchValue}
        onChange={(e) => {
          inputOnChange(e);
        }}
        prefix={<SearchOutlined />}
        placeholder="搜索模板名称"
        className="template-search"
      />
      <Form onFinish={onSubmit} ref={ref} form={form}>
        {loading ? <div className="template-grid-empty">模板加载中...</div> : null}
        {!loading && data.length === 0 ? <div className="template-grid-empty">没有匹配的模板</div> : null}
        {!loading && data.length > 0 ? (
          <div className="template-grid" role="list" aria-label="模板列表">
            {data.map((item: any) => {
              const selected = templateId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`template-card${selected ? " active" : ""}`}
                  onClick={() => setTemplateId(item.id)}
                  aria-pressed={selected}
                >
                  <div className="list-box">
                    <img alt={item.name} src={item.s_hall_map} />
                    <span>
                      {selected ? "已选中：" : ""}
                      {item.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
        {total > pageSize ? (
          <div className="template-pagination" aria-label="模板分页">
            <button type="button" onClick={() => changePage(pageNum - 1)} disabled={pageNum === 1}>
              上一页
            </button>
            <div className="template-pagination-pages">
              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === pageNum ? "active" : ""}
                  onClick={() => changePage(page)}
                  aria-pressed={page === pageNum}
                >
                  {page}
                </button>
              ))}
            </div>
            <span className="template-pagination-summary">
              第 {pageNum} / {totalPages} 页
            </span>
            <button type="button" onClick={() => changePage(pageNum + 1)} disabled={pageNum === totalPages}>
              下一页
            </button>
          </div>
        ) : null}
      </Form>
    </div>
  );
};

export default SelectTemplateForm;
