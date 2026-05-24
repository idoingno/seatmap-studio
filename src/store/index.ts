import { configureStore } from "@reduxjs/toolkit";

import otherReducer from "./otherReducer";
import seatReducer from "./seatReducer";
// import redux from "redux";
// import { createStore, applyMiddleware } from 'redux'
// import { legacy_createStore as createStore } from "redux";

// export const storeFn = configureStore({
//   reducer: { seater: seatReducer },
// });

// export default store;

const reducer = {
  seater: seatReducer,
  other: otherReducer,
};

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
