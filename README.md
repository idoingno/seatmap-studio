# Seatmap Studio

An open-source visual editor for meeting rooms, event seating, and space layout planning.

Seatmap Studio supports matrix layouts, round-table layouts, room elements, attendee assignment, Excel template import/export, and seatmap image export.

The local demo uses clean mock data by default, so the app can run without a proprietary backend. To integrate your own API, replace the adapter behind `src/api/index.ts`.

![Seatmap Studio editor](screenshots/screenshot.png)

## 核心功能

- 矩阵与圆桌布局，可整体拖动、增减行列或座位
- 舞台、门、窗等空间物件，可拖入、缩放和删除
- `Ctrl` / `⌘` 框选座位，支持区域配色与命名
- 人员搜索、状态筛选、拖拽入座与座位间移动
- Excel 座位模板导入、导出座位图、保存自定义模板
- 桌面与移动端自适应界面，键盘可操作主要面板和工具

## 画布操作

- 左键拖动布局或空间物件
- 鼠标中键移动画布
- 鼠标滚轮缩放画布
- `Ctrl` / `⌘` + 左键拖动框选多个座位
- 悬浮布局可打开增删、隐藏或删除工具

## 开发

```bash
pnpm install
pnpm start
```

默认开发地址：

```text
http://localhost:8080/
```

## 构建

```bash
pnpm build
```

构建产物输出到 `dist/`。

## 验证

```bash
pnpm exec tsc --noEmit
pnpm run test:e2e
pnpm run build
```

## Demo Data

Mock mode is enabled by default. In the browser console, set `localStorage.setItem("seatmap-api-mode", "remote")` if you want to test against a compatible remote API endpoint.

## 技术栈

- React 18
- TypeScript
- Webpack 5
- Ant Design 4
- AntV X6
- Redux Toolkit
