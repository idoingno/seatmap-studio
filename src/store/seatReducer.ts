import { ADD_SEAT, ADDS_SEAT, DEL_SEAT, EMPTY_SEAT, SHOW_LOADING, SHOW_TIME } from "./constants";

const defaultState = {
  //   seatSet: [] as string[],
  seatSet: [] as string[],
  loading: false,
  time: "",
};

function reducer(state = defaultState, action: { type: string; val: any }) {
  let newState = { ...state };

  switch (action.type) {
    case ADD_SEAT:
      // newState.seatSet.add(action.val);
      // break;
      // const newVal = newState.seatSet.add(action.val);
      return Object.assign({}, newState, {
        // seatSet: newState.seatSet.push(action.val),
        seatSet: [...newState.seatSet, action.val],
      });
    case ADDS_SEAT:
      let arr = [];
      if (action.val.length > 0) {
        for (let i = 0; i < action.val.length; i++) {
          const ele = action.val[i];
          arr.push(ele);
        }
      }
      return Object.assign({}, newState, {
        seatSet: [...newState.seatSet, ...arr],
      });
    // break;
    case DEL_SEAT:
      // newState.seatSet.delete(action.val);
      let arrs = newState.seatSet.filter((item: string) => item !== action.val);
      return Object.assign({}, newState, {
        seatSet: arrs,
      });
    // break;
    // case INCREMENT:
    //   return { ...state, counter: state.counter + 1 };
    // case DECREMENT:
    //   return { ...state, counter: state.counter - 1 };
    case SHOW_LOADING:
      newState.loading = action.val;
      break;

    case SHOW_TIME:
      newState.time = action.val;
      break;
    case EMPTY_SEAT:
      // newState.seatSet.clear();
      newState.seatSet = [];
      break;
    default:
      break;
    //   return state;
  }
  return newState;
}

export default reducer;
