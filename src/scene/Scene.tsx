import { Grid, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { departmentsById, systemMap } from "@/data/systemMap";
import { CAMERA_POSITION, CAMERA_TARGET } from "@/lib/layout";
import { visibleEdges } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { DeptBlock } from "./DeptBlock";
import { FlowEdge } from "./FlowEdge";

type OrbitControlsImpl = React.ElementRef<typeof OrbitControls>;

/** Pans the isometric camera toward the selected tile (instant under reduced motion). */
function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const selected = useMapStore((s) => s.selected);
  const reduced = useMapStore((s) => s.reducedMotion);
  const camera = useThree((s) => s.camera);
  const goal = useMemo(() => {
    const d = selected ? departmentsById[selected] : null;
    return d ? new THREE.Vector3(d.position[0] * 0.6, 0, d.position[2] * 0.6) : new THREE.Vector3(...CAMERA_TARGET);
  }, [selected]);
  const delta = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    delta.copy(goal).sub(c.target);
    if (delta.lengthSq() < 1e-5) return;
    if (!reduced) delta.multiplyScalar(Math.min(1, dt * 3.5));
    c.target.add(delta);
    camera.position.add(delta);
    c.update();
  });
  return null;
}

/** Fit the orthographic zoom to the viewport so the whole grid is visible. */
function FitZoom() {
  const { size, camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = THREE.MathUtils.clamp(size.width / 33, 22, 56);
    cam.updateProjectionMatrix();
  }, [size.width, camera]);
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
      dpr={[1, 2]}
      flat
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={(e) => {
        // DOM overlays (labels, cards) bubble into r3f's event layer and would
        // read as a "missed" click — only the canvas itself clears state.
        if (!(e.target instanceof HTMLCanvasElement)) return;
        setHovered(null);
        select(null);
      }}
      style={{ touchAction: "none" }}
    >
      <OrthographicCamera makeDefault position={CAMERA_POSITION} zoom={44} near={-60} far={120} />
      <FitZoom />
      <color attach="background" args={["#f7f8fc"]} />
      <Grid
        position={[0, -0.01, -1.5]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.7}
        cellColor="#e6e9f3"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#d5dbeb"
        fadeDistance={60}
        fadeStrength={0.6}
        infiniteGrid
      />
      {systemMap.departments.map((d) => (
        <DeptBlock key={d.id} dept={d} />
      ))}
      <Edges />
      <OrbitControls
        ref={controls}
        target={CAMERA_TARGET}
        enableRotate={false}
        enablePan
        enableDamping
        dampingFactor={0.1}
        minZoom={14}
        maxZoom={110}
        screenSpacePanning
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        makeDefault
      />
      <CameraRig controls={controls} />
    </Canvas>
  );
}
