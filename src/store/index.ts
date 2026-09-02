import { configureStore } from "@reduxjs/toolkit";

import otherReducer from "./otherReducer";
import seatReducer from "./seatReducer";
import runtimeReducer from "./runtimeSlice";

const reducer = {
  seater: seatReducer,
  other: otherReducer,
  runtime: runtimeReducer,
};

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
