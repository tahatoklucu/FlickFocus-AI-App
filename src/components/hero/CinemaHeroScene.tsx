"use client";

import { Environment, Float, Lightformer, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import { BackSide, type Group, type MeshStandardMaterial } from "three";
import CinemaHeroEffects from "@/components/hero/CinemaHeroEffects";
import {
  CINEMA_HERO_3D,
  type CinemaHeroTheme,
} from "@/lib/cinema-hero-3d";

const FRAME_POSITIONS: [number, number, number][] = [
  [1.35, 0.25, 0.15],
  [-1.25, -0.1, 0.25],
  [0.5, -0.95, -0.1],
  [-0.65, 0.85, -0.05],
];

interface CinemaHeroSceneProps {
  isMobile: boolean;
  enablePremiumFx: boolean;
  enableEnvironment: boolean;
}

function useThemeColors(theme: CinemaHeroTheme) {
  return useMemo(
    () => CINEMA_HERO_3D.palette[theme === "gold" ? "gold" : "spotlight"],
    [theme],
  );
}

function SceneBackdrop() {
  return (
    <mesh scale={12}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#0b0916" side={BackSide} />
    </mesh>
  );
}

function SceneAtmosphere({ enablePremiumFx }: { enablePremiumFx: boolean }) {
  const { atmosphere } = CINEMA_HERO_3D;

  return (
    <>
      <color attach="background" args={[atmosphere.background]} />
      <SceneBackdrop />
      {enablePremiumFx ? (
        <fogExp2 attach="fog" args={[atmosphere.fogColor, atmosphere.fogDensity]} />
      ) : null}
    </>
  );
}

function SceneLighting({
  theme,
  enablePremiumFx,
}: {
  theme: CinemaHeroTheme;
  enablePremiumFx: boolean;
}) {
  const { lighting } = CINEMA_HERO_3D;
  const colors = useThemeColors(theme);
  const rimColor = theme === "gold" ? "#ffe08a" : colors.emissive;

  return (
    <>
      <ambientLight color={lighting.ambient.color} intensity={lighting.ambient.intensity} />
      <hemisphereLight color="#a78bfa" groundColor="#050508" intensity={0.45} />
      <directionalLight
        position={[-2.8, 2.2, 3.2]}
        intensity={lighting.fill.intensity}
        color={lighting.fill.color}
      />
      <pointLight
        position={[2.2, 1.6, 3]}
        intensity={lighting.key.intensity}
        color={lighting.key.color}
        distance={14}
        decay={2}
      />
      <pointLight
        position={[-2, 0.2, 2.2]}
        intensity={lighting.accent.intensity}
        color={colors.emissive}
        distance={12}
        decay={2}
      />
      {enablePremiumFx ? (
        <>
          <spotLight
            position={[0.5, 0.8, -3.2]}
            angle={0.5}
            penumbra={1}
            intensity={lighting.rim.intensity}
            color={rimColor}
            distance={16}
            decay={2}
          />
          <pointLight
            position={[0, -1.2, 1.5]}
            intensity={0.35}
            color="#6366f1"
            distance={8}
            decay={2}
          />
        </>
      ) : null}
    </>
  );
}

function SceneEnvironment({
  enabled,
  theme,
  isMobile,
}: {
  enabled: boolean;
  theme: CinemaHeroTheme;
  isMobile: boolean;
}) {
  if (!enabled) {
    return null;
  }

  const colors = useThemeColors(theme);

  return (
    <Environment
      resolution={isMobile ? 128 : 512}
      frames={Infinity}
      environmentIntensity={isMobile ? 0.38 : 0.55}
    >
      <Lightformer
        form="rect"
        intensity={3.2}
        color={colors.accent}
        rotation-y={Math.PI / 2}
        position={[-5, 2.5, 1.5]}
        scale={[5, 2.5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#bae6fd"
        rotation-y={-Math.PI / 2}
        position={[5, 1.8, 2]}
        scale={[4, 2.2, 1]}
      />
      <Lightformer
        form="ring"
        intensity={1.8}
        color={colors.emissive}
        rotation-x={Math.PI / 2}
        position={[0, 4, -1]}
        scale={4}
      />
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#120a24"
        position={[0, -3, 0]}
        rotation-x={-Math.PI / 2}
        scale={[10, 10, 1]}
      />
    </Environment>
  );
}

function FilmFrame({
  position,
  theme,
  hovered,
  enablePremiumFx,
  enableEnvironment,
}: {
  position: [number, number, number];
  theme: CinemaHeroTheme;
  hovered: boolean;
  enablePremiumFx: boolean;
  enableEnvironment: boolean;
}) {
  const colors = useThemeColors(theme);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const pbr = CINEMA_HERO_3D.pbr.filmFrame;

  useFrame(({ clock }) => {
    if (!materialRef.current) {
      return;
    }

    const pulse = (Math.sin(clock.elapsedTime * 1.8 + position[0]) + 1) * 0.5;
    const target = hovered
      ? CINEMA_HERO_3D.motion.spotlightEmissive
      : CINEMA_HERO_3D.motion.idleEmissive + pulse * 0.2;

    materialRef.current.emissiveIntensity +=
      (target - materialRef.current.emissiveIntensity) * 0.1;
  });

  return (
    <group position={position} rotation={[0.1, position[0] * 0.15, 0]}>
      <mesh>
        <boxGeometry args={[0.38, 0.26, 0.025]} />
        <meshStandardMaterial
          ref={materialRef}
          color={colors.frame}
          emissive={colors.emissive}
          emissiveIntensity={CINEMA_HERO_3D.motion.idleEmissive}
          metalness={pbr.metalness}
          roughness={pbr.roughness}
          envMapIntensity={
            (enablePremiumFx || enableEnvironment) ? pbr.envMapIntensity : 0.35
          }
        />
      </mesh>
      <mesh position={[0, 0, 0.014]}>
        <planeGeometry args={[0.28, 0.16]} />
        <meshStandardMaterial
          color="#050508"
          emissive={colors.emissive}
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

function Clapperboard({
  theme,
  hovered,
  enablePremiumFx,
}: {
  theme: CinemaHeroTheme;
  hovered: boolean;
  enablePremiumFx: boolean;
}) {
  const colors = useThemeColors(theme);
  const bodyRef = useRef<MeshStandardMaterial>(null);
  const envScale = enablePremiumFx ? 1 : 0.85;

  useFrame(() => {
    if (!bodyRef.current) {
      return;
    }
    const target = hovered ? 0.28 : 0.1;
    bodyRef.current.emissiveIntensity +=
      (target - bodyRef.current.emissiveIntensity) * 0.1;
  });

  return (
    <group position={[0, 0.92, 0.18]} rotation={[0.08, -0.22, 0]}>
      <group position={[0, 0.16, 0]} rotation={[0.48, 0, 0]}>
        {Array.from({ length: 9 }).map((_, index) => (
          <mesh key={index} position={[(index - 4) * 0.102, 0, 0.032]}>
            <boxGeometry args={[0.095, 0.44, 0.035]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#f8fafc" : "#111827"}
              roughness={0.75}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[0.86, 0.4, 0.05]} />
        <meshStandardMaterial
          ref={bodyRef}
          color="#e4e4e7"
          emissive={colors.emissive}
          emissiveIntensity={0.1}
          metalness={CINEMA_HERO_3D.pbr.clapperBody.metalness}
          roughness={CINEMA_HERO_3D.pbr.clapperBody.roughness}
          envMapIntensity={CINEMA_HERO_3D.pbr.clapperBody.envMapIntensity * envScale}
        />
      </mesh>
    </group>
  );
}

function InteractiveFilmReel({
  theme,
  onToggleTheme,
  onHoverChange,
  enablePremiumFx,
  enableEnvironment,
}: {
  theme: CinemaHeroTheme;
  onToggleTheme: () => void;
  onHoverChange: (hovered: boolean) => void;
  enablePremiumFx: boolean;
  enableEnvironment: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const reelRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const colors = useThemeColors(theme);
  const ringMaterialRef = useRef<MeshStandardMaterial>(null);
  const hubMaterialRef = useRef<MeshStandardMaterial>(null);
  const envScale = enablePremiumFx ? 1 : enableEnvironment ? 0.85 : 0.35;
  const ringPbr = CINEMA_HERO_3D.pbr.reelRing;
  const hubPbr = CINEMA_HERO_3D.pbr.reelHub;
  const spokePbr = CINEMA_HERO_3D.pbr.reelSpoke;

  useFrame(({ clock }) => {
    if (reelRef.current) {
      reelRef.current.rotation.z = clock.elapsedTime * 0.4;
    }

    const targetEmissive = clicked
      ? CINEMA_HERO_3D.motion.spotlightEmissive
      : hovered
        ? CINEMA_HERO_3D.motion.hoverEmissive
        : CINEMA_HERO_3D.motion.idleEmissive;

    for (const ref of [ringMaterialRef, hubMaterialRef]) {
      if (!ref.current) {
        continue;
      }
      ref.current.emissiveIntensity +=
        (targetEmissive - ref.current.emissiveIntensity) * 0.1;
    }

    if (groupRef.current && clicked) {
      const scale = 1 + Math.sin(clock.elapsedTime * 5) * 0.02;
      groupRef.current.scale.setScalar(scale);
    } else if (groupRef.current) {
      groupRef.current.scale.setScalar(1);
    }
  });

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    onHoverChange(true);
  }, [onHoverChange]);
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onHoverChange(false);
  }, [onHoverChange]);
  const handleClick = useCallback(() => {
    setClicked((value) => !value);
    onToggleTheme();
  }, [onToggleTheme]);

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <circleGeometry args={[1.05, 64]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.42} />
      </mesh>

      <group
        ref={reelRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <mesh>
          <torusGeometry args={[0.68, 0.1, 32, 80]} />
          <meshStandardMaterial
            ref={ringMaterialRef}
            color={colors.ringDark}
            emissive={colors.emissive}
            emissiveIntensity={CINEMA_HERO_3D.motion.idleEmissive}
            metalness={ringPbr.metalness}
            roughness={ringPbr.roughness}
            envMapIntensity={ringPbr.envMapIntensity * envScale}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.1, 32]} />
          <meshStandardMaterial
            ref={hubMaterialRef}
            color="#0c0c12"
            emissive={colors.emissive}
            emissiveIntensity={CINEMA_HERO_3D.motion.idleEmissive * 0.85}
            metalness={hubPbr.metalness}
            roughness={hubPbr.roughness}
            envMapIntensity={hubPbr.envMapIntensity * envScale}
          />
        </mesh>

        {Array.from({ length: 6 }).map((_, index) => (
          <mesh key={index} rotation={[0, 0, (index * Math.PI) / 3]}>
            <boxGeometry args={[0.5, 0.07, 0.05]} />
            <meshStandardMaterial
              color="#18181f"
              emissive={colors.accent}
              emissiveIntensity={0.18}
              metalness={spokePbr.metalness}
              roughness={spokePbr.roughness}
              envMapIntensity={spokePbr.envMapIntensity * envScale}
            />
          </mesh>
        ))}

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.018, 12, 48]} />
          <meshStandardMaterial
            color={colors.ring}
            emissive={colors.emissive}
            emissiveIntensity={0.25}
            metalness={0.98}
            roughness={0.08}
            envMapIntensity={1.5 * envScale}
          />
        </mesh>
      </group>

      <Clapperboard theme={theme} hovered={hovered} enablePremiumFx={enablePremiumFx} />
    </group>
  );
}

function SceneRig({
  theme,
  onToggleTheme,
  isMobile,
  enablePremiumFx,
  enableEnvironment,
}: {
  theme: CinemaHeroTheme;
  onToggleTheme: () => void;
  isMobile: boolean;
  enablePremiumFx: boolean;
  enableEnvironment: boolean;
}) {
  const rootRef = useRef<Group>(null);
  const { pointer } = useThree();
  const [reelHovered, setReelHovered] = useState(false);

  useFrame((_, delta) => {
    if (!rootRef.current) {
      return;
    }

    const strength = isMobile
      ? CINEMA_HERO_3D.motion.parallaxStrength * 0.4
      : CINEMA_HERO_3D.motion.parallaxStrength;

    const targetY = pointer.x * strength + 0.15;
    const targetX = -pointer.y * strength * 0.5 - 0.06;

    rootRef.current.rotation.y +=
      (targetY - rootRef.current.rotation.y) * Math.min(delta * 2.5, 1);
    rootRef.current.rotation.x +=
      (targetX - rootRef.current.rotation.x) * Math.min(delta * 2.5, 1);
  });

  return (
    <group ref={rootRef} rotation={[-0.04, 0.22, 0]}>
      <Float
        speed={CINEMA_HERO_3D.motion.floatSpeed}
        rotationIntensity={0.08}
        floatIntensity={CINEMA_HERO_3D.motion.floatAmplitude}
      >
        <InteractiveFilmReel
          theme={theme}
          onToggleTheme={onToggleTheme}
          onHoverChange={setReelHovered}
          enablePremiumFx={enablePremiumFx}
          enableEnvironment={enableEnvironment}
        />
      </Float>

      {FRAME_POSITIONS.slice(0, isMobile ? 2 : 4).map((position, index) => (
        <FilmFrame
          key={index}
          position={position}
          theme={theme}
          hovered={reelHovered}
          enablePremiumFx={enablePremiumFx}
          enableEnvironment={enableEnvironment}
        />
      ))}

      {enablePremiumFx ? (
        <Sparkles
          count={36}
          scale={[3, 2.2, 1.8]}
          size={2}
          speed={0.18}
          opacity={0.45}
          color="#ddd6fe"
        />
      ) : null}
    </group>
  );
}

export default function CinemaHeroScene({
  isMobile,
  enablePremiumFx,
  enableEnvironment,
}: CinemaHeroSceneProps) {
  const [theme, setTheme] = useState<CinemaHeroTheme>("gold");

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "gold" ? "spotlight" : "gold"));
  }, []);

  return (
    <>
      <SceneAtmosphere enablePremiumFx={enablePremiumFx} />
      <SceneLighting theme={theme} enablePremiumFx={enablePremiumFx} />
      <SceneEnvironment
        enabled={enableEnvironment}
        theme={theme}
        isMobile={isMobile}
      />
      <SceneRig
        theme={theme}
        onToggleTheme={toggleTheme}
        isMobile={isMobile}
        enablePremiumFx={enablePremiumFx}
        enableEnvironment={enableEnvironment}
      />
      {enablePremiumFx ? <CinemaHeroEffects /> : null}
    </>
  );
}
