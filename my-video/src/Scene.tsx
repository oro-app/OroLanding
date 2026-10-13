import React from "react";
import {Phone3D} from "./Phone3D";
import {IoBatteryFull, IoCellular, IoChatbubble, IoChevronBack, IoChevronForward, IoVideocamOutline, IoWifi} from "react-icons/io5";
import {BiSolidPointer} from "react-icons/bi";
import {AbsoluteFill, Img, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

const bodyFont = '"SF Pro Text", "SF Pro", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

const Notification: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const notificationIn = spring({frame: frame - 8, fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
  const notificationOut = interpolate(frame, [74, 86], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cursorX = interpolate(frame, [28, 66], [690, 1045], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cursorY = interpolate(frame, [28, 66], [510, 120], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const click = interpolate(frame, [64, 68, 72], [1, 0.82, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <>
    <div style={{position: "absolute", top: 42, right: 46, width: 370, display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 22, fontFamily: bodyFont, background: "rgba(245,245,247,.96)", backdropFilter: "blur(24px)", color: "#111", boxShadow: "0 18px 50px rgba(47,30,57,.18), inset 0 0 0 1px rgba(0,0,0,.08)", opacity: notificationIn * notificationOut, transform: `translateY(${interpolate(notificationIn, [0, 1], [-34, 0])}px) scale(${click})`, transformOrigin: "65% 50%"}}>
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
  return <div style={{alignSelf: side === "you" ? "flex-end" : "flex-start", maxWidth: 232, padding: "10px 14px", borderRadius: side === "you" ? "19px 19px 6px 19px" : "19px 19px 19px 6px", background: side === "you" ? "#0066d6" : "#e9e9eb", color: side === "you" ? "#fff" : "#000", fontFamily: bodyFont, fontSize: 15, lineHeight: 1.3, opacity: entrance, scale: interpolate(entrance, [0, 1], [0.88, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), transformOrigin: side === "you" ? "bottom right" : "bottom left"}}>{children}</div>;
};

const TypingDots: React.FC<{show: number; hide: number}> = ({show, hide}) => {
  const frame = useCurrentFrame();
  return <div style={{display: "flex", gap: 5, alignSelf: "flex-start", padding: "14px 16px", borderRadius: "21px 21px 21px 6px", background: "#e9e9eb", opacity: interpolate(frame, [show, show + 5, hide - 5, hide], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{[0, 1, 2].map((dot) => <span key={dot} style={{width: 7, height: 7, borderRadius: "50%", background: "#636366", translate: `0 ${Math.sin((frame - show - dot * 3) * 0.28) * 2}px`}} />)}</div>;
};

const PhoneScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = frame >= 160;
  const reply = frame >= 220;
  return <div style={{position: "absolute", inset: 0, boxSizing: "border-box", padding: 9}}>
    <div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 53, background: "#fff", fontFamily: bodyFont}}>
      <div style={{height: 39, display: "flex", alignItems: "center", padding: "0 23px", fontSize: 12, fontWeight: 700}}><span>9:41</span><span aria-hidden="true" style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 4}}><IoCellular size={15} /><IoWifi size={16} /><IoBatteryFull size={22} /></span></div>
      <div style={{height: 82, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d1d6"}}><span style={{position: "absolute", left: 18, top: 61, color: "#0066d6"}}><IoChevronBack aria-hidden="true" focusable="false" size={27} /></span><span style={{position: "absolute", right: 19, top: 61, color: "#0066d6"}}><IoVideocamOutline aria-hidden="true" focusable="false" size={27} /></span><div style={{textAlign: "center"}}><div aria-hidden="true" style={{width: 45, height: 45, margin: "0 auto 2px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#e9e9eb", overflow: "hidden"}}><Img src={staticFile("oro-mascot.webp")} alt="" style={{width: 38, height: 38, objectFit: "contain"}} /></div><div style={{fontSize: 13, fontWeight: 600, color: "#000"}}>oro <IoChevronForward aria-hidden="true" focusable="false" size={10} style={{color: "#636366"}} /></div></div></div>
      <div style={{padding: "14px 20px 0", textAlign: "center", fontSize: 12, color: "#636366"}}>today 9:41 AM</div>
      <div style={{display: "flex", flexDirection: "column", gap: 9, padding: "14px 15px"}}>
        {sent && <Bubble side="you" show={160}>Style me for a date</Bubble>}
        {frame >= 175 && !reply && <TypingDots show={175} hide={220} />}
        {reply && <Bubble show={220}>Black blazer, soft knit, dark denim, and loafers. Relaxed, polished, date-ready.</Bubble>}
      </div>
    </div>
  </div>;

};

export const Scene: React.FC = () => {
  return <AbsoluteFill role="img" aria-label="Oro styles a date outfit. You send: Style me for a date. Oro thinks, then replies: Black blazer, soft knit, dark denim, and loafers. Relaxed, polished, date-ready." style={{overflow: "hidden", background: "radial-gradient(circle at 50% 38%, #fffdf8 0%, #f3e8d8 48%, #dcc5e2 100%)", color: "#291c31", fontFamily: bodyFont}}>
    <Notification />
    <Phone3D><PhoneScreen /></Phone3D>
  </AbsoluteFill>;
};
