import store from "../store";
import { showLoadingAction, showTimeAction } from "../store/actionCreators";
import { time } from "../utils/util";
import { getSeatmapStore } from "../storage";

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

let reqNum = 0;

const startLoading = (code: string) => {
  if (reqNum === 0) {
    //loading 开始
    store.dispatch(showLoadingAction(true));
  }
  reqNum++;
};

const endLoading = () => {
  if (reqNum <= 0) {
    reqNum = 0;
    return;
  }
  reqNum--;
  if (reqNum === 0) {
    // loading 结束
    store.dispatch(showLoadingAction(false));
    store.dispatch(showTimeAction(time()));
  }
};

/**
 * 所有持久化只经此一处，按 seatmap-api-mode 分发到存储后端：
 * - "remote" : 远程后端（INVOKING_IPAAS_CID 协议，见 src/storage/httpStore）
 * - "mock"   : 纯内存（开发/E2E，见 src/storage/memoryStore）
 * - 其他/缺省: IndexedDB（开源版默认，零后端可运行，见 src/storage/indexedDbStore）
 */
const request = (options: AxiosRequestConfig = {}, loading = false) => {
  const { params } = options;
  //请求开始的时候，判断是否有传 loading，为 true 则开始 loading
  loading && startLoading(params?.type);

  return Promise.resolve(getSeatmapStore().handle(options)).finally(() => {
    loading && endLoading();
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
