import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";

export const EndingTextingMascot: React.FC = () => {
  const frame = useCurrentFrame() - 316;
  return <div role="img" aria-label="Oro texting, surrounded by animated gold sparkles" style={{position: "absolute", left: 735, top: 95, width: 500, height: 500}}>
    <Img src={staticFile("oro_texting_no_accessories.webp")} alt="" style={{position: "absolute", inset: 0, width: "100%"}} />
    <Img src={staticFile("dashes_2.webp")} alt="" style={{position: "absolute", left: 443, top: 247, width: 50, opacity: 0.55 + 0.45 * Math.sin(frame * Math.PI / 24) ** 2, scale: 0.92 + 0.16 * Math.sin(frame * Math.PI / 24) ** 2, rotate: "12deg"}} />
    <Img src={staticFile("dashes_3.webp")} alt="" style={{position: "absolute", left: 63, top: 66, width: 64, opacity: 0.55 + 0.45 * Math.sin((frame - 8) * Math.PI / 24) ** 2, scale: 0.92 + 0.16 * Math.sin((frame - 8) * Math.PI / 24) ** 2, rotate: "-70deg", clipPath: "polygon(0 0, 100% 0, 100% 100%, 38% 100%, 30% 72%, 0 72%)"}} />
    {[{left: 429, top: 124, size: 24}, {left: 445, top: 173, size: 30}, {left: 350, top: 174, size: 22}].map(({left, top, size}, index) => <Img key={index} src={staticFile("star.webp")} alt="" style={{position: "absolute", left, top, width: size, opacity: 0.55 + 0.45 * Math.sin((frame - index * 8) * Math.PI / 30) ** 2, scale: 0.8 + 0.35 * Math.sin((frame - index * 8) * Math.PI / 30) ** 2, rotate: `${Math.sin((frame - index * 8) * Math.PI / 30) * 9}deg`}} />)}
  </div>;
};
