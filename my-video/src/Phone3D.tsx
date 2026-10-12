import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useThree} from "@react-three/fiber";
import {ThreeCanvas} from "@remotion/three";
import {getFontEmbedCSS, toCanvas} from "html-to-image";
import {CanvasTexture, Shape, SRGBColorSpace} from "three";
import {Easing, Freeze, interpolate, spring, useBufferState, useCurrentFrame, useDelayRender, useVideoConfig} from "remotion";

const DrawScreen: React.FC<{onReady: () => void}> = ({onReady}) => {
  const advance = useThree((state) => state.advance);
  useLayoutEffect(() => {
    advance(performance.now());
    onReady();
  }, [advance, onReady]);
  return null;
};

export const Phone3D: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const screenFrame = Math.min(frame, 354);
  const phoneIn = spring({frame: frame - 88, fps, config: {damping: 18, stiffness: 92, mass: 1.15}});
  const source = useRef<HTMLDivElement>(null);
  const fontCSS = useRef<Promise<string> | null>(null);
  const captureVersion = useRef(0);
  const mounted = useRef(true);
  const [screen, setScreen] = useState<{texture: CanvasTexture; ready: () => void} | null>(null);
  const texture = screen?.texture;
  const {delayPlayback} = useBufferState();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const shape = useMemo(() => new Shape()
    .moveTo(-113, 0).lineTo(113, 0).quadraticCurveTo(175, 0, 175, 62)
    .lineTo(175, 648).quadraticCurveTo(175, 710, 113, 710)
    .lineTo(-113, 710).quadraticCurveTo(-175, 710, -175, 648)
    .lineTo(-175, 62).quadraticCurveTo(-175, 0, -113, 0), []);

  const island = useMemo(() => new Shape()
    .moveTo(-32, -13).lineTo(32, -13).quadraticCurveTo(45.5, -13, 45.5, 0)
    .quadraticCurveTo(45.5, 13, 32, 13).lineTo(-32, 13)
    .quadraticCurveTo(-45.5, 13, -45.5, 0).quadraticCurveTo(-45.5, -13, -32, -13), []);

  useEffect(() => {
    mounted.current = true;
    return () => {mounted.current = false;};
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);

  useLayoutEffect(() => {
    const handle = delayRender("Updating phone screen texture");
    const playback = delayPlayback();
    const ready = () => {continueRender(handle); playback.unblock();};
    const version = ++captureVersion.current;
    const node = source.current!;
    const capture = async () => {
      await document.fonts.ready;
      fontCSS.current ??= getFontEmbedCSS(node);
      const fontEmbedCSS = await fontCSS.current;
      if (!mounted.current || version !== captureVersion.current) return;
      const canvas = await toCanvas(node, {width: 350, height: 710, pixelRatio: 2, fontEmbedCSS});
      if (mounted.current && version === captureVersion.current) {
        const screen = new CanvasTexture(canvas);
        screen.colorSpace = SRGBColorSpace;
        setScreen({texture: screen, ready});
      }
    };
    capture().catch((error) => {if (mounted.current) cancelRender(error);});
    return ready;
  }, [screenFrame, delayRender, continueRender, cancelRender, delayPlayback]);

  return <>
    <div aria-hidden="true" style={{position: "absolute", left: -10000, width: 350, height: 710}}>
      <div ref={source} style={{position: "relative", width: 350, height: 710}}><Freeze frame={screenFrame}>{children}</Freeze></div>
    </div>
    {screen && <ThreeCanvas width={width} height={height} style={{position: "absolute", inset: 0, visibility: frame < 88 ? "hidden" : "visible"}} camera={{position: [0, 0, 4000], fov: 2 * Math.atan(height / 8000) * 180 / Math.PI, near: 100, far: 5000}} gl={{alpha: true, antialias: true}}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[-400, 600, 800]} intensity={3} />
      <directionalLight position={[500, -100, 400]} intensity={1.5} />
      <group position={[interpolate(frame, [184, 226], [0, 300], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"}), -334 - interpolate(phoneIn, [0, 1], [760, 0]), 0]} rotation={[0, interpolate(frame, [184, 207, 226], [0, -0.16, -0.06], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), 0]} scale={0.94}>
        <mesh position={[0, 0, -8]}>
          <extrudeGeometry args={[shape, {depth: 8, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 3, curveSegments: 24}]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[-176.5, 557.5, -4]}>
          <boxGeometry args={[3, 65, 5]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[176.5, 511, -4]}>
          <boxGeometry args={[3, 90, 5]} />
          <meshStandardMaterial color="#383538" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[0, 3.5, 2.1]} scale={[0.98, 0.99, 1]}>
          <shapeGeometry args={[shape]} />
          <meshPhysicalMaterial color="#080808" metalness={0.1} roughness={0.12} clearcoat={1} />
        </mesh>
        <mesh position={[0, 680, 3.5]}>
          <extrudeGeometry args={[island, {depth: 1, bevelEnabled: false, curveSegments: 16}]} />
          <meshStandardMaterial color="#080808" roughness={0.22} />
        </mesh>
        <mesh position={[29, 680, 4.6]}>
          <circleGeometry args={[4, 24]} />
          <meshPhysicalMaterial color="#182334" roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Keep the glass distinct from the chassis in the camera's depth buffer. */}
        <mesh position={[0, 355, 3]}>
          <planeGeometry args={[350, 710]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} toneMapped={false} />
        </mesh>
      </group>
      <DrawScreen onReady={screen.ready} />
    </ThreeCanvas>}
  </>;
};
