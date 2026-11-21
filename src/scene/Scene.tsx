import { Grid, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { departmentsById, systemMap } from "@/data/systemMap";
import { CAMERA_POSITION, CELL, MAP_BOUNDS, MAP_CENTER, PANEL_BREAKPOINT, PANEL_WIDTH } from "@/lib/layout";
import { useMapStore } from "@/state/useMapStore";

import { DeptBlock } from "./DeptBlock";
import { FlowEdge } from "./FlowEdge";

type OrbitControlsImpl = React.ElementRef<typeof OrbitControls>;
const MARGIN = 36;

/**
 * Keeps the WHOLE map in view: fits the zoom to the viewport (minus the open
 * panel) and centres the map in the free area. Re-fits only when the viewport
 * or the panel changes, so the user can still pan/zoom freely in between.
 */
function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const selected = useMapStore((s) => s.selected);
  const reduced = useMapStore((s) => s.reducedMotion);
  const { camera, size } = useThree();
  const panelPx = selected && size.width > PANEL_BREAKPOINT ? PANEL_WIDTH : 0;
  const key = `${size.width}x${size.height}:${panelPx}`;
  const applied = useRef<string | null>(null);
  const pending = useRef(false);
  const goalZoom = useRef(camera.zoom);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (applied.current !== key) {
      applied.current = key;
      // Pixel extent of the map at the current zoom → zoom that fits the free area.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of MAP_BOUNDS) {
        tmp.copy(p).project(camera);
        minX = Math.min(minX, tmp.x); maxX = Math.max(maxX, tmp.x);
        minY = Math.min(minY, tmp.y); maxY = Math.max(maxY, tmp.y);
      }
      const pxW = ((maxX - minX) / 2) * size.width;
      const pxH = ((maxY - minY) / 2) * size.height;
      const availW = Math.max(200, size.width - panelPx - 2 * MARGIN);
      const availH = Math.max(200, size.height - 2 * MARGIN);
      goalZoom.current = THREE.MathUtils.clamp(camera.zoom * Math.min(availW / pxW, availH / pxH), 8, 120);
      // Centre of the map, shifted right (in screen space) by half the panel width.
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      goalTarget.copy(MAP_CENTER).add(right.multiplyScalar(panelPx / 2 / goalZoom.current));
      pending.current = true;
    }
    if (!pending.current) return;
    const k = reduced ? 1 : Math.min(1, dt * 4);
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom += (goalZoom.current - cam.zoom) * k;
    cam.updateProjectionMatrix();
    tmp.copy(goalTarget).sub(c.target).multiplyScalar(k);
    c.target.add(tmp);
    cam.position.add(tmp);
    c.update();
    if (Math.abs(goalZoom.current - cam.zoom) < 0.05 && goalTarget.distanceTo(c.target) < 0.02) pending.current = false;
  });
  return null;
}

function Edges() {
  return (
    <>
      {systemMap.edges.map((e) => (
        <FlowEdge key={e.id} edge={e} from={departmentsById[e.from]} to={departmentsById[e.to]} />
      ))}
    </>
  );
}

export function Scene({ active = true }: { active?: boolean }) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const setHovered = useMapStore((s) => s.setHovered);
  const select = useMapStore((s) => s.select);
  return (
    <Canvas
      // Stop rendering while another tab is showing.
      frameloop={active ? "always" : "never"}
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
      <OrthographicCamera makeDefault position={CAMERA_POSITION} zoom={30} near={-80} far={160} />
      <color attach="background" args={["#f7f8fc"]} />
      {/* Section lines every CELL units, so each block sits inside one square. */}
      <Grid
        position={[0, -0.01, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#e9ecf4"
        sectionSize={CELL}
        sectionThickness={1.2}
        sectionColor="#cfd6e8"
        fadeDistance={90}
        fadeStrength={0.4}
        infiniteGrid
      />
      {systemMap.departments.map((d) => (
        <DeptBlock key={d.id} dept={d} />
      ))}
      <Edges />
      <OrbitControls
        ref={controls}
        target={[MAP_CENTER.x, 0, MAP_CENTER.z]}
        enableRotate={false}
        enablePan
        enableDamping
        dampingFactor={0.1}
        minZoom={8}
        maxZoom={120}
        screenSpacePanning
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        makeDefault
      />
      <CameraRig controls={controls} />
    </Canvas>
  );
}
