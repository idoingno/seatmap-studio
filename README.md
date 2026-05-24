# Seatmap Studio

An open-source visual editor for meeting rooms, event seating, and space layout planning.

Seatmap Studio supports matrix layouts, round-table layouts, room elements, attendee assignment, Excel template import/export, and seatmap image export.

The local demo uses clean mock data by default, so the app can run without a proprietary backend. To integrate your own API, replace the adapter behind `src/api/index.ts`.

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

## Demo Data

Mock mode is enabled by default. In the browser console, set `localStorage.setItem("seatmap-api-mode", "remote")` if you want to test against a compatible remote API endpoint.

## 技术栈

- React 18
- TypeScript
- Webpack 5
- Ant Design 4
- AntV X6
- Redux Toolkit
