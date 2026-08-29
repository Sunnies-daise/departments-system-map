import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { systemMap } from "@/data/systemMap";
import type { Department } from "@/data/types";
import { blockHeight, blockWidth } from "@/lib/layout";
import { isDeptGhost, relatedDepartments } from "@/lib/selectors";
import { focusId, useMapStore } from "@/state/useMapStore";
import { HoverCard } from "@/ui/HoverCard";

type Emphasis = "active" | "related" | "dimmed" | "idle";

export function DeptBlock({ dept }: { dept: Department }) {
  const mode = useMapStore((s) => s.mode);
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const highlightedEdge = useMapStore((s) => s.highlightedEdge);
  const setHovered = useMapStore((s) => s.setHovered);
  const select = useMapStore((s) => s.select);
  const reduced = useMapStore((s) => s.reducedMotion);

  const ghost = isDeptGhost(dept, mode);
  const focus = focusId({ hovered, selected });
  const related = useMemo(() => (focus ? relatedDepartments(focus, mode) : null), [focus, mode]);

  let emphasis: Emphasis = "idle";
  if (focus) {
    if (focus === dept.id) emphasis = "active";
    else if (related?.has(dept.id)) emphasis = "related";
    else emphasis = "dimmed";
  }
  if (highlightedEdge) {
    const [a, b] = edgeEnds(highlightedEdge);
    emphasis = a === dept.id || b === dept.id ? "active" : "dimmed";
  }

  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const w = blockWidth(dept);
  const h = blockHeight(dept);
  const color = useMemo(() => new THREE.Color(dept.color), [dept.color]);

  useFrame((_, dt) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const lift = emphasis === "active" ? 0.35 : emphasis === "related" ? 0.12 : 0;
    const opacity = ghost ? (emphasis === "dimmed" ? 0.12 : 0.35) : emphasis === "dimmed" ? 0.28 : 1;
    const emissive = emphasis === "active" ? 0.55 : emphasis === "related" ? 0.3 : 0.08;
    const k = reduced ? 1 : Math.min(1, dt * 8);
    g.position.y += (lift - g.position.y) * k;
    m.opacity += (opacity - m.opacity) * k;
    m.emissiveIntensity += (emissive - m.emissiveIntensity) * k;
  });

  const hoverOn = () => setHovered(dept.id);
  const hoverOff = () => {
    if (useMapStore.getState().hovered === dept.id) setHovered(null);
  };

  return (
    <group position={[dept.position[0], 0, dept.position[2]]}>
      <group ref={group}>
        <RoundedBox
          args={[w, h, w]}
          radius={0.1}
          smoothness={4}
          position={[0, h / 2, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            hoverOn();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            hoverOff();
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            select(selected === dept.id ? null : dept.id);
          }}
        >
          <meshStandardMaterial
            ref={mat}
            color={color}
            emissive={color}
            emissiveIntensity={0.08}
            roughness={0.45}
            metalness={0.15}
            transparent
            opacity={ghost ? 0.35 : 1}
            wireframe={ghost}
          />
        </RoundedBox>
        {/* Top-face outline so the cube reads as a block even when ghosted. */}
        <lineSegments position={[0, h + 0.002, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(w * 0.92, w * 0.92).rotateX(-Math.PI / 2)]} />
          <lineBasicMaterial color={dept.color} transparent opacity={emphasis === "dimmed" ? 0.15 : 0.7} />
        </lineSegments>
        <Html position={[0, h + 0.08, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <button
            type="button"
            className={`block-label emphasis-${emphasis}${ghost ? " ghost" : ""}`}
            style={{ "--dept": dept.color } as React.CSSProperties}
            data-testid={`block-${dept.id}`}
            data-emphasis={emphasis}
            data-ghost={ghost ? "true" : "false"}
            aria-label={`${dept.name} department`}
            aria-pressed={selected === dept.id}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onFocus={hoverOn}
            onBlur={hoverOff}
            onClick={() => select(selected === dept.id ? null : dept.id)}
          >
            {dept.short}
          </button>
        </Html>
        {hovered === dept.id && (
          <Html position={[0, h + 0.7, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <HoverCard dept={dept} />
          </Html>
        )}
      </group>
    </group>
  );
}

function edgeEnds(edgeId: string): [string, string] {
  const e = systemMap.edges.find((x) => x.id === edgeId);
  return e ? [e.from, e.to] : ["", ""];
}
