import { useClickAway, useHover, useSafeState } from "ahooks";
import React, { memo, useEffect, useRef, useState } from "react";
import { register } from "x6-html-shape";
import createRender from "x6-html-shape/dist/react17";
import "./index.less";

export let showCard: any;

const ChairCard: React.FC = () => {
  const [show, setShow] = useSafeState<boolean>(false);
  const awayRef = useRef(null);
  const [chairData, setChairData] = useState<any>(null);

  useHover(awayRef, {
    onEnter: () => {
      setShow(true);
    },
    onLeave: () => {
      setShow(false);
    },
  });

  useEffect(() => {
    showCard = showCardFoo;
  }, []);

  const showCardFoo = (data: any) => {
    setShow(true);
    setChairData({ ...data });
  };

  return (
    <>
      {show ? (
        <div className="ChairCard" style={{ left: chairData?.left, top: chairData?.top }} ref={awayRef}>
          <div className="dv1">
            {chairData?.title} {chairData?.otherName ? `(${chairData?.otherName})` : ""}
          </div>
          <div className="dv2"> {chairData?.seatData} </div>
          <div className="dv3"> {chairData?.from} </div>
          <div className="dv4"> {chairData?.subTitle} </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default ChairCard;

// export const ChairCard = memo(() => {
//   const [show, setShow] = useState(true);
//   const awayRef = useRef(null);

//   const isHovering = useHover(awayRef);
//   if (!isHovering) {
//     setShow(false);
//   }

// //   useClickAway(() => {
// //     setShow(false);
// //   }, awayRef);

//   return show ? (
//     <div
//       className="ChairCard"
//       style={{ left: chairData.left, top: chairData.top }}
//       ref={awayRef}
//     >
//       <div className="dv1">
//         {chairData.title} {chairData.otherName ? `(${chairData.otherName})` : ""}
//       </div>
//       <div className="dv2"> {chairData.seatData} </div>
//       <div className="dv3"> {chairData.from} </div>
//       <div className="dv4"> {chairData.subTitle} </div>
//     </div>
//   ) : (
//     <></>
//   );
// });

// const render = createRender(ChairCard);

// register({
//   shape: "minus-menu-react-node",
//   render,
//   data: {
//     nodeType: "menuNode",
//   },
// });
