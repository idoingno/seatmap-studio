import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import { runtimeActions } from "./store/runtimeSlice";
import { ErrorBoundary } from "./Components/ErrorBoundary";

const App = React.lazy(() => import("./App"));

store.dispatch(runtimeActions.setSessionId("demo-session"));
store.dispatch(runtimeActions.setHallId("demo-hall"));
store.dispatch(
  runtimeActions.setCpForm({
    K2582458: { text: "Seatmap Studio Demo" },
    K2460125: { value: "2026-05-25 09:00" },
    K2460124: { value: "2026-05-25 11:00" },
    K2460459: { text: "Demo Hall" },
  })
);

const render = (container: string) => {
  const rootElement = document.querySelector(container);
  if (!rootElement) return;

  createRoot(rootElement).render(
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Error caught by boundary:", error, errorInfo);
      }}
    >
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
                background: "#e8eceb",
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
                  border: "1px solid rgba(25, 118, 111, 0.34)",
                  boxShadow: "0 0 0 10px rgba(25, 118, 111, 0.08)",
                }}
              />
              Seatmap Studio loading...
            </div>
          }
        >
          <App />
        </Suspense>
      </Provider>
    </ErrorBoundary>
  );
};

const container = "#root";

render(container);
