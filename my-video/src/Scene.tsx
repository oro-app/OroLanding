import React from "react";
import {WavingMascot} from "./WavingMascot";
import {IoAdd, IoArrowUp, IoBatteryFull, IoCellular, IoChatbubble, IoChevronBack, IoChevronForward, IoMic, IoVideocamOutline, IoWifi} from "react-icons/io5";
import {BiSolidPointer} from "react-icons/bi";
import {loadFont as loadFraunces} from "@remotion/google-fonts/Fraunces";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {AbsoluteFill, CanvasImage, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

const {fontFamily: bodyFont} = loadInter("normal", {weights: ["400", "500", "600", "700"], subsets: ["latin"]});
const {fontFamily: displayFont} = loadFraunces("normal", {weights: ["400", "600"], subsets: ["latin"]});

const typed = (text: string, frame: number, start: number, speed = 2) => text.slice(0, Math.max(0, Math.floor((frame - start) / speed)));

const Notification: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const notificationIn = spring({frame: frame - 8, fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
  const notificationOut = interpolate(frame, [74, 86], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cursorX = interpolate(frame, [28, 66], [690, 1045], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cursorY = interpolate(frame, [28, 66], [510, 120], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const click = interpolate(frame, [64, 68, 72], [1, 0.82, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <>
    <div style={{position: "absolute", top: 42, right: 46, width: 370, display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 22, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", background: "rgba(245,245,247,.96)", backdropFilter: "blur(24px)", color: "#111", boxShadow: "0 18px 50px rgba(47,30,57,.18), inset 0 0 0 1px rgba(0,0,0,.08)", opacity: notificationIn * notificationOut, transform: `translateY(${interpolate(notificationIn, [0, 1], [-34, 0])}px) scale(${click})`, transformOrigin: "65% 50%"}}>
      <div style={{width: 50, height: 50, flex: "0 0 50px", display: "grid", placeItems: "center", borderRadius: 13, background: "#34c759"}}><IoChatbubble aria-hidden="true" focusable="false" size={34} color="#fff" /></div>
      <div style={{minWidth: 0, flex: 1}}><div style={{display: "flex", justifyContent: "space-between", color: "#48484a", fontSize: 13, fontWeight: 400}}><span>Messages</span><span>now</span></div><div style={{marginTop: 4, fontSize: 16, fontWeight: 700}}>oro</div><div style={{marginTop: 2, fontSize: 15, color: "#303033"}}>Your closet is ready when you are.</div></div>
    </div>
    <BiSolidPointer aria-hidden="true" focusable="false" size={44} style={{position: "absolute", left: cursorX, top: cursorY, color: "#fff", stroke: "#111", strokeWidth: 1.2, opacity: interpolate(frame, [22, 27, 75, 84], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), transform: `scale(${click})`, filter: "drop-shadow(0 2px 2px rgba(0,0,0,.28))"}} />
  </>;
};

const Bubble: React.FC<{children: React.ReactNode; side?: "oro" | "you"; show: number}> = ({children, side = "oro", show}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: frame - show, fps, config: {damping: 18, stiffness: 180, mass: 0.7}});
  return <div style={{alignSelf: side === "you" ? "flex-end" : "flex-start", maxWidth: 232, padding: "10px 14px", borderRadius: side === "you" ? "19px 19px 6px 19px" : "19px 19px 19px 6px", background: side === "you" ? "#007aff" : "#e9e9eb", color: side === "you" ? "#fff" : "#000", fontFamily: bodyFont, fontSize: 15, lineHeight: 1.3, opacity: entrance, scale: interpolate(entrance, [0, 1], [0.88, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), transformOrigin: side === "you" ? "bottom right" : "bottom left"}}>{children}</div>;
};

const TypingDots: React.FC<{show: number; hide: number}> = ({show, hide}) => {
  const frame = useCurrentFrame();
  return <div style={{display: "flex", gap: 5, alignSelf: "flex-start", padding: "14px 16px", borderRadius: "21px 21px 21px 6px", background: "#e9e9eb", opacity: interpolate(frame, [show, show + 5, hide - 5, hide], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{[0, 1, 2].map((dot) => <span key={dot} style={{width: 7, height: 7, borderRadius: "50%", background: "#8e8e93", translate: `0 ${Math.sin((frame - show - dot * 3) * 0.28) * 2}px`}} />)}</div>;
};

const ComposeBar: React.FC<{text: string; caret: boolean}> = ({text, caret}) => {
  const frame = useCurrentFrame();
  return <div style={{height: 39, display: "flex", alignItems: "center", gap: 7, color: "#8e8e93", fontFamily: bodyFont, fontSize: 14}}><span style={{width: 35, height: 35, flex: "0 0 35px", borderRadius: "50%", display: "grid", placeItems: "center", border: "1.5px solid #8e8e93"}}><IoAdd aria-hidden="true" focusable="false" size={21} /></span><span style={{height: 37, minWidth: 0, flex: 1, border: "1.5px solid #8e8e93", borderRadius: 22, display: "flex", alignItems: "center", padding: "0 4px 0 12px", color: text ? "#000" : "#8e8e93"}}><span style={{flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden"}}>{text || "iMessage"}{caret && <span style={{display: "inline-block", width: 2, height: 16, marginLeft: 2, verticalAlign: -3, background: "#007aff", opacity: Math.floor(frame / 8) % 2 ? 0 : 1}} />}</span>{text ? <span style={{width: 29, height: 29, borderRadius: "50%", display: "grid", placeItems: "center", background: "#007aff", color: "#fff"}}><IoArrowUp aria-hidden="true" focusable="false" size={20} /></span> : <IoMic aria-hidden="true" focusable="false" size={20} />}</span></div>;
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phoneIn = spring({frame: frame - 88, fps, config: {damping: 18, stiffness: 92, mass: 1.15}});
  const phoneOut = interpolate(frame, [354, 401], [0, 1], {easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const firstDraft = typed("first date tonight. help?", frame, 130, 1);
  const secondDraft = typed("quiet but sharp.", frame, 230, 1);
  const firstSent = frame >= 160;
  const secondSent = frame >= 258;
  const firstReply = frame >= 200;
  const finalReply = frame >= 294;
  // CSS +Z is viewer depth (your +X); +90deg around CSS X lays the phone flat at the bottom edge.
  return <div style={{position: "absolute", left: "50%", bottom: 0, width: 350, height: 710, perspective: 1100, perspectiveOrigin: "50% 100%", translate: "-50% 0"}}><div style={{position: "absolute", inset: 0, boxSizing: "border-box", borderRadius: 62, padding: 9, background: "linear-gradient(145deg, #111 0%, #777278 46%, #121113 100%)", boxShadow: "0 42px 76px rgba(47,30,57,.3), 0 13px 0 #2a282b, inset 0 0 0 1px #aaa5aa", transform: `translate3d(0, ${interpolate(phoneIn, [0, 1], [760, 0])}px, ${interpolate(phoneOut, [0, 1], [0, 520])}px) rotateX(${interpolate(phoneOut, [0, 1], [5, 90])}deg) scale(.94)`, opacity: phoneIn * interpolate(phoneOut, [0, 0.98, 1], [1, 1, 0]), transformOrigin: "50% 100%"}}>
    <div style={{position: "absolute", left: -3, top: 120, width: 3, height: 65, borderRadius: "3px 0 0 3px", background: "#383538"}} />
    <div style={{position: "absolute", right: -3, top: 154, width: 3, height: 90, borderRadius: "0 3px 3px 0", background: "#383538"}} />
    <div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 53, background: "#fff", fontFamily: bodyFont}}>
      <div style={{height: 39, display: "flex", alignItems: "center", padding: "0 23px", fontSize: 12, fontWeight: 700}}><span>9:41</span><div style={{position: "absolute", top: 8, left: "50%", width: 91, height: 26, borderRadius: 18, background: "#080808", translate: "-50% 0"}} /><span aria-hidden="true" style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 4}}><IoCellular size={15} /><IoWifi size={16} /><IoBatteryFull size={22} /></span></div>
      <div style={{height: 82, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d1d6"}}><span style={{position: "absolute", left: 18, top: 61, color: "#007aff"}}><IoChevronBack aria-hidden="true" focusable="false" size={27} /></span><span style={{position: "absolute", right: 19, top: 61, color: "#007aff"}}><IoVideocamOutline aria-hidden="true" focusable="false" size={27} /></span><div style={{textAlign: "center"}}><div aria-hidden="true" style={{width: 45, height: 45, margin: "0 auto 2px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#e9e9eb", overflow: "hidden"}}><CanvasImage src={staticFile("oro-mascot.webp")} premountFor={fps} style={{width: 38, height: 38, objectFit: "contain"}} /></div><div style={{fontSize: 13, fontWeight: 600, color: "#000"}}>oro <IoChevronForward aria-hidden="true" focusable="false" size={10} style={{color: "#636366"}} /></div></div></div>
      <div style={{padding: "14px 20px 0", textAlign: "center", fontSize: 12, color: "#636366"}}>today 9:41 AM</div>
      <div style={{display: "flex", flexDirection: "column", gap: 9, padding: "14px 15px 62px"}}>
        {firstSent && <Bubble side="you" show={160}>first date tonight. help?</Bubble>}
        {frame >= 174 && !firstReply && <TypingDots show={174} hide={200} />}
        {firstReply && <Bubble show={200}>cute. how do you want to feel when you walk in?</Bubble>}
        {secondSent && <Bubble side="you" show={258}>quiet but sharp.</Bubble>}
        {frame >= 272 && !finalReply && <TypingDots show={272} hide={294} />}
        {finalReply && <Bubble show={294}>say less. black blazer, soft knit, dark denim, loafers. clean, easy, done.</Bubble>}
      </div>
      <div style={{position: "absolute", left: 11, right: 11, bottom: 24}}><ComposeBar text={firstSent ? (secondSent ? "" : secondDraft) : firstDraft} caret={(!firstSent && frame >= 130) || (firstReply && !secondSent)} /></div>
    </div>
  </div></div>;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lockup = spring({frame: frame - 408, fps, config: {damping: 20, stiffness: 90}});
  return <AbsoluteFill style={{overflow: "hidden", background: "radial-gradient(circle at 50% 38%, #fffdf8 0%, #f3e8d8 48%, #dcc5e2 100%)", color: "#291c31", fontFamily: bodyFont}}>
    <Notification />
    <Phone />
    <WavingMascot />
    <div style={{position: "absolute", left: "35%", top: "50%", width: 560, textAlign: "center", opacity: lockup, translate: `-50% calc(-50% + ${interpolate(lockup, [0, 1], [72, 0], {easing: Easing.out(Easing.cubic)})}px)`}}><div style={{fontFamily: displayFont, fontSize: 62, lineHeight: 1.04, letterSpacing: "-0.04em"}}>get dressed.<br /><span style={{color: "#76520d", fontStyle: "italic"}}>keep living.</span></div><div style={{width: 250, margin: "28px auto 0", paddingTop: 18, borderTop: "1px solid #816f85", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#59366c"}}>oro is here</div></div>
  </AbsoluteFill>;
};
