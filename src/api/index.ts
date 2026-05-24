import store from "../store";
import { showLoadingAction, showTimeAction, showFullScreenLoadingAction } from "../store/actionCreators";
import { time } from "../utils/util";
import { mockRequest } from "./mockData";

const host =
  window.location.pathname === "/"
    ? "/"
    : /\/$/.test(window.location.pathname)
      ? window.location.pathname
      : `${window.location.pathname}/`;

const url = window.localStorage.getItem("seatmap-api-url") || `${host}api/seatmap/invoke`;

export interface ResponseType {
  code?: number;
  subMsgType?: string;
  data?: any;
}

export interface AxiosRequestConfig {
  params?: any;
  url?: string;
  method?: string;
  loading?: boolean;
  code?: string;
}

const getRemoteCodes = () => {
  try {
    return JSON.parse(window.localStorage.getItem("seatmap-api-codes") || "{}");
  } catch (error) {
    console.warn("Invalid seatmap-api-codes configuration", error);
    return {};
  }
};

let reqNum = 0;
const shouldUseMockApi = () => window.localStorage.getItem("seatmap-api-mode") !== "remote";

const startLoading = (code: string) => {
  if (reqNum === 0) {
    //loading 开始
    store.dispatch(showLoadingAction(true));
    // if (code !== 'personnel') {
    //   store.dispatch(showFullScreenLoadingAction(true));
    // }
    // store.dispatch(showTimeAction(time()));
  }
  reqNum++;
};
const endLoading = () => {
  if (reqNum <= 0) return;
  reqNum--;
  if (reqNum === 0) {
    //loading 结束
    store.dispatch(showLoadingAction(false));
    // store.dispatch(showFullScreenLoadingAction(false));
    store.dispatch(showTimeAction(time()));
  }
};

const request = (options: AxiosRequestConfig = {}, loading = false) => {
  const { params, code } = options;
  //请求开始的时候，判断是否有传 loading，为 true 则开始 loading
  loading && startLoading(params?.type);

  if (shouldUseMockApi()) {
    return mockRequest(options).finally(() => {
      loading && endLoading();
    });
  }

  return new Promise((resolve, reject) => {
    const data = {
      code: getRemoteCodes()[code],
      invokeType: "INVOKING_IPAAS_CID",
      _crumb: window.localStorage.getItem("seatmap-api-crumb") || "",
      invokeParam: params,
      connectTimeout: 600000,
      socketTimeout: 600000,
    };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((res) => {
        loading && endLoading();
        resolve(res);
      })
      .catch((error) => {
        console.log(error);
        loading && endLoading();
        reject(error);
      });
  });
};

export const handleCpApi = (data: AxiosRequestConfig, loading = false) => {
  const { params, code } = data;
  return request(
    {
      params,
      code,
    },
    loading
  );
};
