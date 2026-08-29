import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { Department, Edge } from "@/data/types";
import { edgePath } from "@/lib/layout";
import { focusId, useMapStore } from "@/state/useMapStore";

const PARTICLES = 3;
const IDLE = "#8f9bc0";

function Dot({ position, color, opacity, r = 0.085 }: { position: THREE.Vector3; color: string; opacity: number; r?: number }) {
  return (
    <mesh position={[position.x, position.y + 0.01, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[r, 20]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

export function FlowEdge({ edge, from, to }: { edge: Edge; from: Department; to: Department }) {
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const highlightedEdge = useMapStore((s) => s.highlightedEdge);
  const reduced = useMapStore((s) => s.reducedMotion);

  const path = useMemo(() => edgePath(edge, from, to), [edge, from, to]);
  const start = path.points[0];
  const end = path.points[path.points.length - 1];

  const focus = focusId({ hovered, selected });
  let state: "active" | "dimmed" | "idle" = "idle";
  if (highlightedEdge) state = highlightedEdge === edge.id ? "active" : "dimmed";
  else if (focus) state = edge.from === focus || edge.to === focus ? "active" : "dimmed";

  const color = state === "active" ? from.color : IDLE;
  const opacity = state === "active" ? 1 : state === "dimmed" ? 0.18 : 0.85;
  const dashed = edge.maturity === "target";

  const particles = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const mesh = particles.current;
    if (!mesh) return;
    const t0 = reduced ? 0 : (clock.elapsedTime * 0.22) % 1;
    for (let i = 0; i < PARTICLES; i++) {
      const t = (t0 + i / PARTICLES) % 1;
      const p = path.curve.getPoint(t);
      dummy.position.set(p.x, p.y + 0.03, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Line points={path.points} color={color} lineWidth={state === "active" ? 2.4 : 1.4} transparent opacity={opacity} dashed={dashed} dashSize={0.22} gapSize={0.14} />
      <Dot position={start} color={color} opacity={opacity} r={0.09} />
      {path.bends.map((b, i) => (
        <Dot key={i} position={b} color={color} opacity={opacity} r={0.08} />
      ))}
      <Dot position={end} color={state === "active" ? to.color : IDLE} opacity={opacity} r={0.13} />
      {state === "active" && (
        <instancedMesh ref={particles} args={[undefined, undefined, PARTICLES]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshBasicMaterial color={from.color} />
        </instancedMesh>
      )}
    </group>
  );
}
