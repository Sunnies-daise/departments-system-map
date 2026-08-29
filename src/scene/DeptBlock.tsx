import { Edges, Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { systemMap } from "@/data/systemMap";
import type { Department } from "@/data/types";
import { blockWidth, chipSize, tileHeight } from "@/lib/layout";
import { isDeptGhost, relatedDepartments } from "@/lib/selectors";
import { focusId, useMapStore } from "@/state/useMapStore";
import { HoverCard } from "@/ui/HoverCard";

type Emphasis = "active" | "related" | "dimmed" | "idle";

const WHITE = new THREE.Color("#ffffff");
const INK = "#2a2f52";
const GHOST_SIDE = new THREE.Color("#dfe3ef");

function shade(base: THREE.Color, towards: THREE.Color, amount: number) {
  return base.clone().lerp(towards, amount);
}

/** Flat-shaded box: white/pastel top, darker +x side, lighter +z side (isometric look). */
function IsoBox({
  size,
  top,
  sideX,
  sideZ,
  topRef,
  outline,
  position,
}: {
  size: [number, number, number];
  top: THREE.Color;
  sideX: THREE.Color;
  sideZ: THREE.Color;
  topRef?: React.Ref<THREE.MeshBasicMaterial>;
  outline: string;
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial attach="material-0" color={sideX} transparent />
      <meshBasicMaterial attach="material-1" color={sideX} transparent />
      <meshBasicMaterial attach="material-2" color={top} transparent ref={topRef} />
      <meshBasicMaterial attach="material-3" color={sideX} transparent />
      <meshBasicMaterial attach="material-4" color={sideZ} transparent />
      <meshBasicMaterial attach="material-5" color={sideZ} transparent />
      <Edges color={outline} threshold={15}>
        <lineBasicMaterial color={outline} transparent opacity={0.55} />
      </Edges>
    </mesh>
  );
}

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

  const w = blockWidth(dept);
  const h = tileHeight(dept);
  const c = chipSize(dept);
  const color = useMemo(() => new THREE.Color(dept.color), [dept.color]);
  const palette = useMemo(
    () =>
      ghost
        ? { tileTop: WHITE, tileX: GHOST_SIDE, tileZ: shade(GHOST_SIDE, WHITE, 0.4), chipTop: shade(GHOST_SIDE, WHITE, 0.3), chipX: GHOST_SIDE, chipZ: shade(GHOST_SIDE, WHITE, 0.4), outline: "#b8bfd6" }
        : { tileTop: WHITE, tileX: shade(color, new THREE.Color("#000"), 0.22), tileZ: shade(color, WHITE, 0.12), chipTop: shade(color, WHITE, 0.42), chipX: shade(color, new THREE.Color("#000"), 0.16), chipZ: color, outline: INK },
    [ghost, color],
  );
  const hoverTop = useMemo(() => shade(WHITE, color, 0.16), [color]);

  const lift = useRef<THREE.Group>(null);
  const topMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    const g = lift.current;
    if (!g) return;
    const k = reduced ? 1 : Math.min(1, dt * 9);
    const targetY = emphasis === "active" ? 0.32 : emphasis === "related" ? 0.12 : 0;
    g.position.y += (targetY - g.position.y) * k;
    const targetOpacity = emphasis === "dimmed" ? (ghost ? 0.25 : 0.35) : ghost ? 0.7 : 1;
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      for (const mat of Array.isArray(m) ? m : [m]) {
        const base = (mat as { userData?: { baseOpacity?: number } }).userData?.baseOpacity ?? 1;
        mat.opacity += (targetOpacity * base - mat.opacity) * k;
      }
    });
    if (topMat.current && !ghost) topMat.current.color.lerp(emphasis === "active" || emphasis === "related" ? hoverTop : WHITE, k);
  });

  const hoverOn = () => setHovered(dept.id);
  const hoverOff = () => {
    if (useMapStore.getState().hovered === dept.id) setHovered(null);
  };
  const outlinePts = useMemo(() => {
    const hw = w / 2 + 0.02;
    const y = h + 0.01;
    return [
      new THREE.Vector3(-hw, y, -hw),
      new THREE.Vector3(hw, y, -hw),
      new THREE.Vector3(hw, y, hw),
      new THREE.Vector3(-hw, y, hw),
      new THREE.Vector3(-hw, y, -hw),
    ];
  }, [w, h]);

  return (
    <group position={[dept.position[0], 0, dept.position[2]]}>
      {/* Drop shadow — offset so it reads as sitting on the grid. */}
      <mesh position={[0.32, 0.004, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, w]} />
        <meshBasicMaterial color="#1b2140" transparent opacity={ghost ? 0.05 : 0.11} userData={{ baseOpacity: ghost ? 0.05 : 0.11 }} />
      </mesh>
      <group ref={lift}>
        <group
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
            // A click on the DOM label is handled by the label itself.
            if (!(e.nativeEvent.target instanceof HTMLCanvasElement)) return;
            select(selected === dept.id ? null : dept.id);
          }}
        >
          <IsoBox size={[w, h, w]} position={[0, h / 2, 0]} top={palette.tileTop} sideX={palette.tileX} sideZ={palette.tileZ} topRef={topMat} outline={palette.outline} />
          <IsoBox size={[c, c, c]} position={[0, h + c / 2, 0]} top={palette.chipTop} sideX={palette.chipX} sideZ={palette.chipZ} outline={palette.outline} />
        </group>
        {ghost && <Line points={outlinePts} color="#9aa3c2" lineWidth={1} dashed dashSize={0.18} gapSize={0.12} transparent opacity={0.9} />}
        <Html position={[0, h + c + 0.12, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
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
            {dept.name}
          </button>
        </Html>
        {hovered === dept.id && (
          <Html position={[0, h + c + 0.7, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
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
