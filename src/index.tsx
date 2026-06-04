import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
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
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at top, rgba(251, 114, 153, 0.2), transparent 28%), linear-gradient(180deg, #fffafc 0%, #fff7fb 38%, #f4f7ff 100%)",
              color: "rgba(118, 79, 99, 0.86)",
              fontSize: 14,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                border: "1px solid rgba(251, 114, 153, 0.32)",
                boxShadow: "0 0 0 12px rgba(251, 114, 153, 0.08)",
              }}
            />
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
