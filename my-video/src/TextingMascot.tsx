import React from "react";
import {CanvasImage, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

export const TextingMascot: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: frame - 214, fps, config: {damping: 15, stiffness: 110}});
  const texting = interpolate(frame, [248, 266], [0, 1], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const tap = frame >= 266 && frame < 310 ? Math.sin((frame - 266) * 0.5) : 0;

  return <div role="img" aria-label={frame < 250 ? "Oro peeks over the bottom ledge" : frame < 310 ? "Oro thinks and types on a phone" : "Oro smiles after sending your date outfit"} style={{position: "absolute", left: 100, bottom: 0, width: 570, height: 500, opacity: Math.min(1, entrance), translate: `0 ${interpolate(entrance, [0, 1], [510, 0])}px`}}>
    <div aria-hidden="true" style={{position: "absolute", top: 44, left: 0, width: 500, height: 500, rotate: `${texting * 4 + tap * 0.3}deg`, transformOrigin: "50% 80%"}}>
      <CanvasImage src={staticFile("oro-mascot.webp")} premountFor={fps} style={{width: "100%", height: "100%"}} />
    </div>
    {/* The lower body sits behind the ledge; hands remain in front of it. */}
    <div aria-hidden="true" style={{position: "absolute", left: 0, right: 0, top: 435, height: 65, borderRadius: "18px 18px 0 0", background: "#dcc5e2", borderTop: "3px solid #816f85"}} />
    <div aria-hidden="true" style={{position: "absolute", left: 265, top: 375, width: 72, height: 112, borderRadius: 14, border: "5px solid #383538", background: "#080808", opacity: texting, translate: `0 ${(1 - texting) * 120}px`, rotate: "-9deg"}}>
      <div style={{position: "absolute", left: 8, top: 8, width: 13, height: 13, borderRadius: "50%", background: "#182334"}} />
    </div>
    {[0, 1].map((hand) => <div key={hand} aria-hidden="true" style={{position: "absolute", left: interpolate(texting, [0, 1], hand ? [330, 323] : [145, 237]), top: interpolate(texting, [0, 1], [417, hand ? 426 : 438]) + tap * (hand ? -3 : 3), width: 64, height: 43, borderRadius: "50%", background: "#fff6e4", boxShadow: "0 3px 0 #816f85", rotate: `${texting * (hand ? -30 : 25)}deg`}} />)}
    {frame >= 250 && frame < 310 && <div aria-label="Oro is thinking" style={{position: "absolute", left: 365, top: 55, display: "flex", gap: 10, padding: "22px 27px", borderRadius: "30px 30px 30px 6px", background: "#e9e9eb", opacity: interpolate(frame, [250, 258, 304, 310], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      {[0, 1, 2].map((dot) => <span key={dot} style={{width: 12, height: 12, borderRadius: "50%", background: "#636366", translate: `0 ${Math.sin((frame - 250 - dot * 3) * 0.28) * 4}px`}} />)}
    </div>}
  </div>;
};
