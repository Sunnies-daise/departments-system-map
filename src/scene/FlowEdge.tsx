import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { Department, Edge } from "@/data/types";
import { edgeCurve } from "@/lib/layout";
import { focusId, useMapStore } from "@/state/useMapStore";

const PARTICLES = 4;

export function FlowEdge({ edge, from, to }: { edge: Edge; from: Department; to: Department }) {
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const highlightedEdge = useMapStore((s) => s.highlightedEdge);
  const reduced = useMapStore((s) => s.reducedMotion);

  const curve = useMemo(() => edgeCurve(edge, from, to), [edge, from, to]);
  const points = useMemo(() => curve.getPoints(48), [curve]);
  const end = points[points.length - 1];
  const tangent = useMemo(() => curve.getTangent(1).normalize(), [curve]);
  const arrowQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent),
    [tangent],
  );

  const focus = focusId({ hovered, selected });
  let state: "active" | "dimmed" | "idle" = "idle";
  if (highlightedEdge) state = highlightedEdge === edge.id ? "active" : "dimmed";
  else if (focus) state = edge.from === focus || edge.to === focus ? "active" : "dimmed";

  const color = state === "active" ? from.color : "#7c8bb0";
  const opacity = state === "active" ? 1 : state === "dimmed" ? 0.07 : 0.32;
  const dashed = edge.maturity === "target" || edge.maturity === "schema-only";

  const particles = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const mesh = particles.current;
    if (!mesh) return;
    const t0 = reduced ? 0 : (clock.elapsedTime * 0.28) % 1;
    for (let i = 0; i < PARTICLES; i++) {
      const t = (t0 + i / PARTICLES) % 1;
      const p = curve.getPoint(t);
      dummy.position.copy(p);
      const s = 0.7 + 0.3 * Math.sin(t * Math.PI);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={state === "active" ? 2.4 : 1.1}
        transparent
        opacity={opacity}
        dashed={dashed}
        dashSize={0.3}
        gapSize={0.18}
      />
      <mesh position={end} quaternion={arrowQuat}>
        <coneGeometry args={[0.13, 0.36, 12]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {state === "active" && (
        <instancedMesh ref={particles} args={[undefined, undefined, PARTICLES]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
