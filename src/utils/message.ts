type MessageType = "success" | "error" | "warning" | "info";

const HOST_ID = "seatmap-toast-host";
const DEFAULT_DURATION = 2400;

let messageSeed = 0;

const ensureHost = () => {
  let host = document.getElementById(HOST_ID);
  if (host) {
    return host;
  }

  host = document.createElement("div");
  host.id = HOST_ID;
  host.className = "seatmap-toast-host";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-atomic", "true");
  document.body.appendChild(host);

  return host;
};

const removeToast = (toast: HTMLDivElement) => {
  toast.classList.remove("is-visible");
  window.setTimeout(() => {
    toast.remove();
  }, 220);
};

const showToast = (type: MessageType, content: string, duration = DEFAULT_DURATION) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const host = ensureHost();
  const toast = document.createElement("div");
  const id = `seatmap-toast-${messageSeed++}`;

  toast.className = `seatmap-toast seatmap-toast--${type}`;
  toast.dataset.messageId = id;
  toast.setAttribute("role", "status");

  const badge = document.createElement("span");
  badge.className = "seatmap-toast__badge";
  badge.textContent =
    type === "success" ? "成功" : type === "error" ? "错误" : type === "warning" ? "提示" : "通知";

  const text = document.createElement("span");
  text.className = "seatmap-toast__text";
  text.textContent = content;

  toast.appendChild(badge);
  toast.appendChild(text);
  host.appendChild(toast);

  window.requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => removeToast(toast), duration);
};

export const message = {
  success: (content: string, duration?: number) => showToast("success", content, duration),
  error: (content: string, duration?: number) => showToast("error", content, duration),
  warning: (content: string, duration?: number) => showToast("warning", content, duration),
  info: (content: string, duration?: number) => showToast("info", content, duration),
};

export default message;
