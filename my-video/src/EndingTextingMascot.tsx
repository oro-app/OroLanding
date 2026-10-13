import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";

export const EndingTextingMascot: React.FC = () => {
  const frame = useCurrentFrame();
  // Separate the gold phone marks from the still mascot using complementary clips.
  return <div role="img" aria-label="Oro texting, with animated gold marks beside the phone" style={{position: "absolute", left: 735, top: 95, width: 500, height: 500}}>
    <Img src={staticFile("oro-texting.webp")} alt="" style={{position: "absolute", inset: 0, width: "100%", clipPath: "polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 63% 50%, 66% 46%, 68.5% 46%, 69% 50%, 72% 50%, 72% 59%, 64% 59%, 64% 54%, 62.5% 52%, 63% 50%, 0% 0%)"}} />
    <div aria-hidden="true" style={{position: "absolute", inset: 0, opacity: 0.65 + 0.35 * Math.sin((frame - 316) * Math.PI / 18) ** 2, scale: 1 + 0.08 * Math.sin((frame - 316) * Math.PI / 18) ** 2, transformOrigin: "65% 53%"}}>
      <Img src={staticFile("oro-texting.webp")} alt="" style={{width: "100%", clipPath: "polygon(63% 50%, 66% 46%, 68.5% 46%, 69% 50%, 72% 50%, 72% 59%, 64% 59%, 64% 54%, 62.5% 52%)"}} />
    </div>
  </div>;
};
