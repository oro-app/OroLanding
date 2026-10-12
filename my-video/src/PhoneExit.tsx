import React, {useEffect, useMemo, useRef, useState} from "react";
import {ThreeCanvas} from "@remotion/three";
import {toCanvas} from "html-to-image";
import {CanvasTexture, Shape, SRGBColorSpace} from "three";
import {Easing, Freeze, interpolate, useCurrentFrame, useDelayRender, useVideoConfig} from "remotion";

export const PhoneExit: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const source = useRef<HTMLDivElement>(null);
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const shape = useMemo(() => new Shape()
    .moveTo(-113, 0).lineTo(113, 0).quadraticCurveTo(175, 0, 175, 62)
    .lineTo(175, 648).quadraticCurveTo(175, 710, 113, 710)
    .lineTo(-113, 710).quadraticCurveTo(-175, 710, -175, 648)
    .lineTo(-175, 62).quadraticCurveTo(-175, 0, -113, 0), []);

  useEffect(() => {
    const handle = delayRender("Preparing phone screen texture");
    let disposed = false;
    let screen: CanvasTexture | undefined;
    const capture = async () => {
      await document.fonts.ready;
      const canvas = await toCanvas(source.current!, {width: 350, height: 710, pixelRatio: 2});
      if (disposed) return;
      screen = new CanvasTexture(canvas);
      screen.colorSpace = SRGBColorSpace;
      setTexture(screen);
      continueRender(handle);
    };
    capture().catch((error) => {if (!disposed) cancelRender(error);});
    return () => {disposed = true; screen?.dispose(); continueRender(handle);};
  }, [delayRender, continueRender, cancelRender]);

  return <>
    <div aria-hidden="true" style={{position: "absolute", left: -10000, width: 350, height: 710}}>
      <div ref={source} style={{position: "relative", width: 350, height: 710}}><Freeze frame={354}>{children}</Freeze></div>
    </div>
    {texture && <ThreeCanvas width={width} height={height} style={{position: "absolute", inset: 0, visibility: frame < 354 ? "hidden" : "visible"}} camera={{position: [0, 0, 1100], fov: 2 * Math.atan(height / 2200) * 180 / Math.PI, near: 1, far: 5000}} gl={{alpha: true, antialias: true}}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[-400, 600, 800]} intensity={3} />
      <directionalLight position={[500, -100, 400]} intensity={1.5} />
      {/* Viewer-forward is the user's +X, represented by Three's +Z. Only rigid translation and rotation animate. */}
      <group position={[0, -height / 2, interpolate(frame, [354, 401], [0, 2100], {easing: Easing.in(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp"})]} rotation={[-interpolate(frame, [354, 392], [0, Math.PI / 2], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"}), 0, 0]} scale={0.94}>
        <mesh position={[0, 0, -18]}>
          <extrudeGeometry args={[shape, {depth: 18, bevelEnabled: false, curveSegments: 24}]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[-176.5, 557.5, -9]}>
          <boxGeometry args={[3, 65, 12]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[176.5, 511, -9]}>
          <boxGeometry args={[3, 90, 12]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[0, 355, 0.1]}>
          <planeGeometry args={[350, 710]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} toneMapped={false} />
        </mesh>
      </group>
    </ThreeCanvas>}
  </>;
};
