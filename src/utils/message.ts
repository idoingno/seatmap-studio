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

// 状态图标贴近 antd message 的视觉语言：彩色圆底 + 白色符号。
const TOAST_ICONS: Record<MessageType, string> = {
  success:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#2f9e5f"/><path d="M5 8.4l2.1 2.1L11.4 6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#e25b5b"/><path d="M5.7 5.7l4.6 4.6M10.3 5.7l-4.6 4.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
  warning:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#dfa32c"/><path d="M8 4.6v3.9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11" r="0.95" fill="#fff"/></svg>',
  info:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#4f85ff"/><circle cx="8" cy="5" r="0.95" fill="#fff"/><path d="M8 7.4v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
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

  const icon = document.createElement("span");
  icon.className = "seatmap-toast__icon";
  icon.innerHTML = TOAST_ICONS[type];

  const text = document.createElement("span");
  text.className = "seatmap-toast__text";
  text.textContent = content;

  toast.appendChild(icon);
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
