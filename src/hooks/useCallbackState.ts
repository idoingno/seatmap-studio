import { useEffect, useState, useRef } from "react";

function useCallbackState(state: any) {
  const cbRef = useRef<any>();
  const [data, setData] = useState(state);

  useEffect(() => {
    cbRef.current && cbRef.current(data);
  }, [data]);

  return [
    data,
    function (val: any, callback: Function) {
      cbRef.current = callback;
      setData(val);
    },
  ];
}

export { useCallbackState };
