import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

const typed = (text: string, frame: number, start: number, speed = 2) => text.slice(0, Math.max(0, Math.floor((frame - start) / speed)));

const Bubble: React.FC<{children: React.ReactNode; side?: "oro" | "you"; show: number}> = ({children, side = "oro", show}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: frame - show, fps, config: {damping: 18, stiffness: 180, mass: 0.7}});
  return <div style={{alignSelf: side === "you" ? "flex-end" : "flex-start", maxWidth: 232, padding: "10px 14px", borderRadius: side === "you" ? "19px 19px 6px 19px" : "19px 19px 19px 6px", background: side === "you" ? "#59366c" : "#f0e9f3", color: side === "you" ? "#fff" : "#261b2d", fontSize: 15, lineHeight: 1.3, opacity: entrance, scale: interpolate(entrance, [0, 1], [0.88, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), transformOrigin: side === "you" ? "bottom right" : "bottom left"}}>{children}</div>;
};

const TypingDots: React.FC<{show: number; hide: number}> = ({show, hide}) => {
  const frame = useCurrentFrame();
  return <div style={{display: "flex", gap: 5, alignSelf: "flex-start", padding: "14px 16px", borderRadius: "21px 21px 21px 6px", background: "#f0e9f3", opacity: interpolate(frame, [show, show + 5, hide - 5, hide], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{[0, 1, 2].map((dot) => <span key={dot} style={{width: 7, height: 7, borderRadius: "50%", background: "#6f6275", translate: `0 ${Math.sin((frame - show - dot * 3) * 0.28) * 2}px`}} />)}</div>;
};

const ComposeBar: React.FC<{text: string; caret: boolean}> = ({text, caret}) => {
  const frame = useCurrentFrame();
  return <div style={{height: 39, border: "1.5px solid #8c828f", borderRadius: 22, display: "flex", alignItems: "center", padding: "0 5px 0 13px", color: text ? "#261b2d" : "#6f6275", fontSize: 14}}><span style={{flex: 1}}>{text || "Message"}{caret && <span style={{display: "inline-block", width: 2, height: 16, marginLeft: 2, verticalAlign: -3, background: "#59366c", opacity: Math.floor(frame / 8) % 2 ? 0 : 1}} />}</span><span style={{width: 29, height: 29, borderRadius: "50%", display: "grid", placeItems: "center", background: text ? "#59366c" : "#8c828f", color: "#fff", fontSize: 17, fontWeight: 700}}>^</span></div>;
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
  return <div style={{position: "absolute", left: "50%", top: 18, width: 330, height: 684, borderRadius: 58, padding: 9, background: "linear-gradient(145deg, #111 0%, #777278 46%, #121113 100%)", boxShadow: "0 36px 80px rgba(47,30,57,.26), inset 0 0 0 1px #aaa5aa", translate: `-50% ${interpolate(phoneIn, [0, 1], [90, 0])}px`, scale: interpolate(phoneIn, [0, 1], [0.9, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), opacity: phoneIn}}>
    <div style={{position: "absolute", left: -3, top: 120, width: 3, height: 65, borderRadius: "3px 0 0 3px", background: "#383538"}} />
    <div style={{position: "absolute", right: -3, top: 154, width: 3, height: 90, borderRadius: "0 3px 3px 0", background: "#383538"}} />
    <div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 50, background: "#fffdf8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"}}>
      <div style={{height: 39, display: "flex", alignItems: "center", padding: "0 23px", fontSize: 12, fontWeight: 700}}><span>9:41</span><div style={{position: "absolute", top: 8, left: "50%", width: 91, height: 26, borderRadius: 18, background: "#080808", translate: "-50% 0"}} /><span style={{marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 3}}><i style={{width: 3, height: 6, background: "#111", borderRadius: 2}} /><i style={{width: 3, height: 9, background: "#111", borderRadius: 2}} /><i style={{width: 3, height: 12, background: "#111", borderRadius: 2}} /><b style={{width: 17, height: 8, marginLeft: 3, border: "1.5px solid #111", borderRadius: 3, boxShadow: "inset 12px 0 #111"}} /></span></div>
      <div style={{height: 78, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #e2dce4"}}><span style={{position: "absolute", left: 19, fontSize: 32, fontWeight: 300, color: "#59366c"}}>&lt;</span><div style={{textAlign: "center"}}><div style={{width: 42, height: 42, margin: "0 auto 2px", borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(145deg, #e7d6ed, #f7ebd9)", color: "#59366c", fontFamily: "Georgia, serif", fontSize: 29, fontWeight: 700}}>o</div><div style={{fontSize: 13, fontWeight: 650, color: "#261b2d"}}>oro <span style={{color: "#776d7a"}}>&gt;</span></div></div></div>
      <div style={{padding: "14px 20px 0", textAlign: "center", fontSize: 12, color: "#6f6275"}}>today 9:41 AM</div>
      <div style={{display: "flex", flexDirection: "column", gap: 9, padding: "14px 15px 62px"}}>
        {firstSent && <Bubble side="you" show={93}>first date tonight. help?</Bubble>}
        {frame >= 121 && !firstReply && <TypingDots show={121} hide={169} />}
        {firstReply && <Bubble show={169}>cute. how do you want to feel when you walk in?</Bubble>}
        {secondSent && <Bubble side="you" show={276}>quiet but sharp.</Bubble>}
        {frame >= 302 && !finalReply && <TypingDots show={302} hide={330} />}
        {finalReply && <Bubble show={330}>say less. black blazer, soft knit, dark denim, loafers. clean, easy, done.</Bubble>}
      </div>
      <div style={{position: "absolute", left: 12, right: 12, bottom: 10}}><ComposeBar text={firstSent ? (secondSent ? "" : secondDraft) : firstDraft} caret={(!firstSent && frame >= 42) || (firstReply && !secondSent)} /></div>
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
