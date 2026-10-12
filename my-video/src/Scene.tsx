import React from "react";
import {AbsoluteFill, CanvasImage, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import oroMascot from "../../src/assets/logos/oro_logo_mascot_only.webp";
import outfit from "../../src/assets/home/look-day.webp";

const typed = (text: string, frame: number, start: number, speed = 2) => text.slice(0, Math.max(0, Math.floor((frame - start) / speed)));

const Bubble: React.FC<{children: React.ReactNode; side?: "oro" | "you"; show: number}> = ({children, side = "oro", show}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: frame - show, fps, config: {damping: 18, stiffness: 180, mass: 0.7}});
  return <div style={{alignSelf: side === "you" ? "flex-end" : "flex-start", maxWidth: 286, padding: "12px 16px", borderRadius: side === "you" ? "21px 21px 6px 21px" : "21px 21px 21px 6px", background: side === "you" ? "#59366c" : "#f0e9f3", color: side === "you" ? "#fff" : "#261b2d", fontSize: 18, lineHeight: 1.28, opacity: entrance, scale: interpolate(entrance, [0, 1], [0.88, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), transformOrigin: side === "you" ? "bottom right" : "bottom left"}}>{children}</div>;
};

const TypingDots: React.FC<{show: number; hide: number}> = ({show, hide}) => {
  const frame = useCurrentFrame();
  return <div style={{display: "flex", gap: 5, alignSelf: "flex-start", padding: "14px 16px", borderRadius: "21px 21px 21px 6px", background: "#f0e9f3", opacity: interpolate(frame, [show, show + 5, hide - 5, hide], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{[0, 1, 2].map((dot) => <span key={dot} style={{width: 7, height: 7, borderRadius: "50%", background: "#6f6275", translate: `0 ${Math.sin((frame - show - dot * 3) * 0.28) * 2}px`}} />)}</div>;
};

const ComposeBar: React.FC<{text: string; caret: boolean}> = ({text, caret}) => {
  const frame = useCurrentFrame();
  return <div style={{height: 43, border: "1.5px solid #8c828f", borderRadius: 24, display: "flex", alignItems: "center", padding: "0 7px 0 15px", color: text ? "#261b2d" : "#776d7a", fontSize: 16}}><span style={{flex: 1}}>{text || "Message"}{caret && <span style={{display: "inline-block", width: 2, height: 18, marginLeft: 2, verticalAlign: -3, background: "#59366c", opacity: Math.floor(frame / 8) % 2 ? 0 : 1}} />}</span><span style={{width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: text ? "#59366c" : "#8c828f", color: "#fff", fontSize: 18, fontWeight: 700}}>↑</span></div>;
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phoneIn = spring({frame, fps, config: {damping: 22, stiffness: 110, mass: 1.2}});
  const firstDraft = typed("first date tonight. help?", frame, 42, 1.7);
  const secondDraft = typed("quiet but sharp.", frame, 231, 1.8);
  const firstSent = frame >= 93;
  const secondSent = frame >= 276;
  const firstReply = frame >= 169;
  const finalReply = frame >= 330;
  const outfitIn = spring({frame: frame - 348, fps, config: {damping: 17, stiffness: 120}});
  return <div style={{position: "absolute", left: "50%", top: 48, width: 430, height: 820, borderRadius: 68, padding: 12, background: "linear-gradient(145deg, #19181a 0%, #6d686f 42%, #151416 100%)", boxShadow: "0 42px 90px rgba(47,30,57,.24), inset 0 0 0 2px #8e898f", translate: `-50% ${interpolate(phoneIn, [0, 1], [90, 0])}px`, scale: interpolate(phoneIn, [0, 1], [0.9, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), opacity: phoneIn}}>
    <div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 57, background: "#fffdf8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"}}>
      <div style={{height: 46, display: "flex", alignItems: "center", padding: "0 29px", fontSize: 15, fontWeight: 700}}><span>9:41</span><div style={{position: "absolute", top: 11, left: "50%", width: 112, height: 31, borderRadius: 20, background: "#080808", translate: "-50% 0"}} /><span style={{marginLeft: "auto", letterSpacing: 2}}>▮▮▮ ᯤ ▰</span></div>
      <div style={{height: 89, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #e2dce4"}}><span style={{position: "absolute", left: 24, fontSize: 38, fontWeight: 300, color: "#59366c"}}>‹</span><div style={{textAlign: "center"}}><div style={{width: 50, height: 50, margin: "0 auto 3px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#f0e9f3", overflow: "hidden"}}><CanvasImage src={oroMascot} style={{width: 39, height: 39, objectFit: "contain"}} /></div><div style={{fontSize: 15, fontWeight: 650, color: "#261b2d"}}>oro <span style={{color: "#776d7a"}}>›</span></div></div></div>
      <div style={{padding: "14px 20px 0", textAlign: "center", fontSize: 12, color: "#6f6275"}}>today 9:41 AM</div>
      <div style={{display: "flex", flexDirection: "column", gap: 10, padding: "16px 18px 72px"}}>
        {firstSent && <Bubble side="you" show={93}>first date tonight. help?</Bubble>}
        {frame >= 121 && !firstReply && <TypingDots show={121} hide={169} />}
        {firstReply && <Bubble show={169}>cute. how do you want to feel when you walk in?</Bubble>}
        {secondSent && <Bubble side="you" show={276}>quiet but sharp.</Bubble>}
        {frame >= 302 && !finalReply && <TypingDots show={302} hide={330} />}
        {finalReply && <Bubble show={330}>say less. how about this?</Bubble>}
        {frame >= 348 && <div style={{alignSelf: "flex-start", width: 184, height: 214, overflow: "hidden", borderRadius: 22, boxShadow: "0 14px 30px rgba(49,32,58,.14)", opacity: outfitIn, translate: `0 ${interpolate(outfitIn, [0, 1], [24, 0])}px`}}><CanvasImage src={outfit} style={{width: "100%", height: "100%", objectFit: "cover"}} /></div>}
      </div>
      <div style={{position: "absolute", left: 15, right: 15, bottom: 13}}><ComposeBar text={firstSent ? (secondSent ? "" : secondDraft) : firstDraft} caret={(!firstSent && frame >= 42) || (firstReply && !secondSent)} /></div>
    </div>
  </div>;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lockup = spring({frame: frame - 385, fps, config: {damping: 20, stiffness: 90}});
  return <AbsoluteFill style={{overflow: "hidden", background: "radial-gradient(circle at 50% 38%, #fffdf8 0%, #f3e8d8 48%, #dcc5e2 100%)", color: "#291c31", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"}}>
    <div style={{position: "absolute", left: 80, top: 72, fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em", color: "#59366c"}}>oro</div>
    <div style={{position: "absolute", left: 74, top: 246, width: 280, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 54, lineHeight: 1.02, letterSpacing: "-0.045em"}}>your closet.<br />finally useful.</div>
    <div style={{position: "absolute", left: 78, top: 375, width: 255, fontSize: 17, lineHeight: 1.5, color: "#574b5c"}}>personal styling from clothes you already own.</div>
    <Phone />
    <div style={{position: "absolute", right: 70, top: 254, width: 280, opacity: lockup, translate: `${interpolate(lockup, [0, 1], [28, 0], {easing: Easing.out(Easing.cubic)})}px 0`}}><div style={{fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 47, lineHeight: 1.04, letterSpacing: "-0.04em"}}>get dressed.<br /><span style={{color: "#8c6720", fontStyle: "italic"}}>keep living.</span></div><div style={{marginTop: 24, paddingTop: 18, borderTop: "1px solid #816f85", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#59366c"}}>oro is here</div></div>
  </AbsoluteFill>;
};
