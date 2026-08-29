import * as THREE from "three";

import { systemMap } from "@/data/systemMap";
import type { Department, Edge } from "@/data/types";

/** Every block sits centred in its own CELL×CELL square of the background grid. */
export const CELL = 9;
export const BLOCK_WIDTH = 4;
export const TILE_HEIGHT = 0.5;
export const LINE_Y = 0.02;

export function blockWidth(d: Department): number {
  return BLOCK_WIDTH * d.size;
}
export function tileHeight(d: Department): number {
  return TILE_HEIGHT * (d.size < 1 ? 0.85 : 1);
}
/** The block chip that sits on the tile. */
export function chipSize(d: Department): number {
  return 1.2 * d.size;
}

export interface EdgePath {
  points: THREE.Vector3[];
  curve: THREE.CurvePath<THREE.Vector3>;
  bends: THREE.Vector3[];
}

/**
 * Orthogonal (Manhattan) connector on the ground plane. Paired edges (A→B and
 * B→A) run in opposite lanes so both stay readable; ends are trimmed to the
 * tile edge so the port dots sit on the tile border.
 */
export function edgePath(edge: Edge, from: Department, to: Department): EdgePath {
  const y = LINE_Y;
  const sign = edge.from < edge.to ? 1 : -1;
  const lane = 0.6 * sign;
  const a = new THREE.Vector3(from.position[0], y, from.position[2]);
  const b = new THREE.Vector3(to.position[0], y, to.position[2]);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const pts: THREE.Vector3[] = [];
  if (Math.abs(dz) < 0.01) {
    pts.push(new THREE.Vector3(a.x, y, a.z + lane), new THREE.Vector3(b.x, y, b.z + lane));
  } else if (Math.abs(dx) < 0.01) {
    pts.push(new THREE.Vector3(a.x + lane, y, a.z), new THREE.Vector3(b.x + lane, y, b.z));
  } else {
    const mz = (a.z + b.z) / 2 + lane * 0.8;
    pts.push(
      new THREE.Vector3(a.x + lane, y, a.z),
      new THREE.Vector3(a.x + lane, y, mz),
      new THREE.Vector3(b.x - lane, y, mz),
      new THREE.Vector3(b.x - lane, y, b.z),
    );
  }
  trim(pts, 0, 1, blockWidth(from) / 2 + 0.1);
  trim(pts, pts.length - 1, pts.length - 2, blockWidth(to) / 2 + 0.1);

  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return { points: pts, curve, bends: pts.slice(1, -1) };
}

/** Move pts[i] toward pts[j] by `by`, leaving the segment at least a hair long. */
function trim(pts: THREE.Vector3[], i: number, j: number, by: number) {
  const dir = pts[j].clone().sub(pts[i]);
  const len = dir.length();
  if (len <= by + 0.2) return;
  pts[i].add(dir.normalize().multiplyScalar(by));
}

/** World-space points that must stay on screen: the cell plates and the tops of the chips + labels. */
export const MAP_BOUNDS: THREE.Vector3[] = systemMap.departments.flatMap((d) => {
  const [x, , z] = d.position;
  const half = CELL / 2 - 0.4;
  const top = tileHeight(d) + chipSize(d) + 1.6;
  return [
    new THREE.Vector3(x - half, 0, z - half),
    new THREE.Vector3(x + half, 0, z - half),
    new THREE.Vector3(x - half, 0, z + half),
    new THREE.Vector3(x + half, 0, z + half),
    new THREE.Vector3(x, top, z),
  ];
});

export const MAP_CENTER: THREE.Vector3 = (() => {
  const c = new THREE.Vector3();
  for (const d of systemMap.departments) c.add(new THREE.Vector3(d.position[0], 0, d.position[2]));
  return c.divideScalar(systemMap.departments.length);
})();

/** Isometric: camera on the (1,1,1) diagonal looking at the map centre. */
export const CAMERA_POSITION: [number, number, number] = [MAP_CENTER.x + 30, 30, MAP_CENTER.z + 30];

/** Width of the department panel (px) — the camera fits the map into what is left. */
export const PANEL_WIDTH = 440;
export const PANEL_BREAKPOINT = 720;
