import React from "react";
import {Phone3D} from "./Phone3D";
import {EndingTextingMascot} from "./EndingTextingMascot";
import "./fonts.css";
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
  const {fps} = useVideoConfig();
  const imageIn = spring({frame: frame - 195, fps, config: {damping: 18, stiffness: 180, mass: 0.7}});
  const reply = frame >= 177;
  return <div style={{position: "absolute", inset: 0, boxSizing: "border-box", padding: 9}}>
    <div style={{position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 53, background: "#fff", fontFamily: bodyFont}}>
      <div style={{height: 39, display: "flex", alignItems: "center", padding: "0 23px", fontSize: 12, fontWeight: 700}}><span>9:41</span><span aria-hidden="true" style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 4}}><IoCellular size={15} /><IoWifi size={16} /><IoBatteryFull size={22} /></span></div>
      <div style={{height: 82, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d1d6"}}><span style={{position: "absolute", left: 18, top: 61, color: "#0066d6"}}><IoChevronBack aria-hidden="true" focusable="false" size={27} /></span><span style={{position: "absolute", right: 19, top: 61, color: "#0066d6"}}><IoVideocamOutline aria-hidden="true" focusable="false" size={27} /></span><div style={{textAlign: "center"}}><div aria-hidden="true" style={{width: 45, height: 45, margin: "0 auto 2px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#e9e9eb", overflow: "hidden"}}><Img src={staticFile("oro-mascot.webp")} alt="" style={{width: 38, height: 38, objectFit: "contain"}} /></div><div style={{fontSize: 13, fontWeight: 600, color: "#000"}}>oro <IoChevronForward aria-hidden="true" focusable="false" size={10} style={{color: "#636366"}} /></div></div></div>
      <div style={{display: "flex", flexDirection: "column", gap: 9, padding: "14px 15px"}}>
        {frame >= 132 && <Bubble side="you" show={132}>i'm going on second date</Bubble>}
        {frame >= 144 && !reply && <TypingDots show={144} hide={177} />}
        {reply && <Bubble show={177}>EXCITING! this would look super cute</Bubble>}
        {frame >= 195 && <Img src={staticFile("cherry-outfit.webp")} alt="Outfit with a cherry-print top, cream cardigan, flared jeans, red belt, silver hoops, and white sneakers" width={180} height={240} style={{display: "block", alignSelf: "flex-start", opacity: interpolate(frame, [195, 201], [0, 1], {extrapolateRight: "clamp"}), translate: `0 ${interpolate(imageIn, [0, 1], [70, 0])}px`, scale: interpolate(imageIn, [0, 1], [0.8, 1]), transformOrigin: "bottom left"}} />}
      </div>
    </div>
  </div>;

};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const purpleIn = spring({frame: frame - 312, fps, config: {damping: 20, stiffness: 90}});
  const goldIn = spring({frame: frame - 340, fps, config: {damping: 15, stiffness: 110, overshootClamping: true}});
  return <AbsoluteFill role="img" aria-label="You send: i'm going on second date. Oro replies: EXCITING! this would look super cute. Oro then sends an outfit image with a cherry-print top, cream cardigan, flared jeans, red belt, silver hoops, and white sneakers. Oro texts beside: less outfit panic. more main character. your stylist, one text away." style={{overflow: "hidden", background: "radial-gradient(ellipse at 18% 24%, #FFF2D780 0%, transparent 48%), radial-gradient(ellipse at 78% 76%, #D4A85324 0%, transparent 42%), linear-gradient(135deg, #FFFDF8 0%, #FFF9ED 32%, #eee3ed 65%, #d5c3e2 100%)", color: "#3A2646", fontFamily: bodyFont}}>
    <Notification />
    {frame <= 305 && <Phone3D><PhoneScreen /></Phone3D>}
    {frame >= 316 && <EndingTextingMascot />}
    <div style={{position: "absolute", left: 110, top: "50%", width: 620, translate: "0 -50%"}}>
      <div style={{fontFamily: "Oro Fraunces, serif", fontSize: 72, fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.04em"}}>
        <div style={{opacity: purpleIn, translate: `0 ${interpolate(purpleIn, [0, 1], [44, 0])}px`}}>less outfit panic.</div>
        <div style={{color: "#8D691D", fontStyle: "italic", opacity: goldIn, translate: `0 ${interpolate(goldIn, [0, 1], [44, 0])}px`}}>more main<br />character.</div>
      </div>
      <div style={{opacity: interpolate(frame, [362, 380], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
        <div style={{width: 72, height: 3, background: "#D4A853", margin: "28px 0 20px"}} />
        <div style={{fontFamily: "Oro Inter, sans-serif", fontSize: 20, fontWeight: 500}}>your stylist, one text away.</div>
      </div>
    </div>
  </AbsoluteFill>;
};
