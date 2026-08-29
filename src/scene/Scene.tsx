import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { departmentsById, systemMap } from "@/data/systemMap";
import { CAMERA_POSITION, CAMERA_TARGET } from "@/lib/layout";
import { visibleEdges } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { DeptBlock } from "./DeptBlock";
import { FlowEdge } from "./FlowEdge";

/** Eases the orbit target toward the selected block (skipped under reduced motion). */
type OrbitControlsImpl = React.ElementRef<typeof OrbitControls>;

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const selected = useMapStore((s) => s.selected);
  const reduced = useMapStore((s) => s.reducedMotion);
  const goal = useMemo(() => {
    const d = selected ? departmentsById[selected] : null;
    return d ? new THREE.Vector3(d.position[0] * 0.55, 0.6, d.position[2] * 0.55) : new THREE.Vector3(...CAMERA_TARGET);
  }, [selected]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (reduced) c.target.copy(goal);
    else c.target.lerp(goal, Math.min(1, dt * 3));
    c.update();
  });
  return null;
}

function Edges() {
  const mode = useMapStore((s) => s.mode);
  const edges = useMemo(() => visibleEdges(mode), [mode]);
  return (
    <>
      {edges.map((e) => (
        <FlowEdge key={e.id} edge={e} from={departmentsById[e.from]} to={departmentsById[e.to]} />
      ))}
    </>
  );
}

export function Scene() {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const setHovered = useMapStore((s) => s.setHovered);
  const select = useMapStore((s) => s.select);
  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: 38, near: 0.1, far: 120 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => {
        setHovered(null);
        select(null);
      }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#0b1020"]} />
      <fog attach="fog" args={["#0b1020", 22, 40]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 12, 6]} intensity={1.6} />
      <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#9db4ff" />
      <Grid
        position={[0, -0.01, -1.5]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1a2340"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#26325a"
        fadeDistance={34}
        fadeStrength={1.4}
        infiniteGrid
      />
      {systemMap.departments.map((d) => (
        <DeptBlock key={d.id} dept={d} />
      ))}
      <Edges />
      <OrbitControls
        ref={controls}
        target={CAMERA_TARGET}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={26}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.35}
        makeDefault
      />
      <CameraRig controls={controls} />
    </Canvas>
  );
}
