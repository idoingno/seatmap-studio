import { handleCpApi } from "../api";

// 获取ossKey
export const getOssKey = async () => {
  const res: any = await handleCpApi({ params: {}, code: "ossKey" });

  if (res && res.data && res.data.response && res.data.response.credentials) {
    let { accessKeyId, securityToken, accessKeySecret } = res.data.response.credentials;
    // ossInitFlag = true
    const { default: OSS } = await import("ali-oss");
    let ossClient = new OSS({
      region: window.localStorage.getItem("seatmap-oss-region") || "oss-cn-shanghai",
      accessKeyId: accessKeyId, //阿里云产品的通用id
      accessKeySecret: accessKeySecret, //密钥
      stsToken: securityToken,
      bucket: window.localStorage.getItem("seatmap-oss-bucket") || "",
    });

    return ossClient;
  }
};

// 调用oss存储
export const getHasPersonSeatImg = async (name: string, file: any) => {
  let ossClient = await getOssKey();
  if (ossClient) {
    var fileName = new Date().getTime() + name;
    await ossClient.put("/cbs/cp/" + fileName, file);
    let realResult = await ossClient.signatureUrl("/cbs/cp/" + fileName, { expires: 3600 });
    return realResult;
  }

  return URL.createObjectURL(file);
};
