import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux"
import store from './store'
import App from './App';
import './assets/all-svg';  // 入口文件引入
import 'antd/dist/antd.less';
import { CPForm, Session } from './config';

Session.setDataId = 'demo-session';
Session.setHallId = 'demo-hall';
CPForm.setForm = {
  K2582458: { text: 'Seatmap Studio Demo' },
  K2460125: { value: '2026-05-25 09:00' },
  K2460124: { value: '2026-05-25 11:00' },
  K2460459: { text: 'Demo Hall' },
};

const render = (container: string) => {
  const rootElement = document.querySelector(container);
  if (!rootElement) return;

  createRoot(rootElement).render(
    <Provider store={store}>
      <App />
    </Provider>
  );
};

const container = '#root';

render(container);
