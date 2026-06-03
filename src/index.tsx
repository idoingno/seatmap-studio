import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import "./assets/all-svg";
import { CPForm, Session } from "./config";

const App = React.lazy(() => import("./App"));

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
      <Suspense
        fallback={
          <div
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f7f8fa",
              color: "rgba(0, 0, 0, 0.65)",
              fontSize: 14,
            }}
          >
            Seatmap Studio loading...
          </div>
        }
      >
        <App />
      </Suspense>
    </Provider>
  );
};

const container = '#root';

render(container);
