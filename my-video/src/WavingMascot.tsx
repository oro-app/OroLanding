import React from "react";
import {CanvasImage, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

export const WavingMascot: React.FC = () => {
  const frame = useCurrentFrame() - 412;
  const {fps} = useVideoConfig();
  const entrance = spring({frame, fps, config: {damping: 13, stiffness: 120}});
  const wave = Math.sin(Math.max(0, frame - 12) / fps * Math.PI * 4)
    * interpolate(frame, [12, 20, 74, 90], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return <div role="img" aria-label="Oro mascot waving hello" style={{position: "absolute", left: 740, top: 140, width: 440, height: 440, opacity: Math.min(1, entrance), translate: `0 ${interpolate(entrance, [0, 1], [100, 0])}px`, scale: interpolate(entrance, [0, 1], [0.8, 1]), rotate: `${wave * -1.5}deg`, transformOrigin: "50% 85%"}}>
    {/* Overlapping clips keep the shoulder connected while the raised arm waves. */}
    <div aria-hidden="true" style={{position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 100% 25%, 73% 25%, 73% 40%, 68% 49%, 67% 61%, 100% 61%, 100% 100%, 0 100%)"}}>
      <CanvasImage src={staticFile("oro-waving.webp")} premountFor={fps} style={{width: "100%", height: "100%"}} />
    </div>
    <div aria-hidden="true" style={{position: "absolute", inset: 0, clipPath: "polygon(73% 25%, 100% 25%, 100% 61%, 64% 61%, 66% 49%, 73% 40%)", rotate: `${wave * 9}deg`, transformOrigin: "65% 59%"}}>
      <CanvasImage src={staticFile("oro-waving.webp")} premountFor={fps} style={{width: "100%", height: "100%"}} />
    </div>
  </div>;
};
