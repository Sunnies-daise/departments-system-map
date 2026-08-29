import * as THREE from "three";

import type { Department, Edge } from "@/data/types";

/** Tile footprint (world units) and thickness for the isometric tiles. */
export const BLOCK_WIDTH = 2.4;
export const TILE_HEIGHT = 0.34;
export const LINE_Y = 0.02;

export function blockWidth(d: Department): number {
  return BLOCK_WIDTH * d.size;
}
export function tileHeight(d: Department): number {
  return TILE_HEIGHT * (d.size < 1 ? 0.85 : 1);
}
/** The block chip that sits on the tile. */
export function chipSize(d: Department): number {
  return 0.72 * d.size;
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
  const lane = 0.4 * sign;
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

/** Isometric: camera on the (1,1,1) diagonal looking at the target. */
export const CAMERA_POSITION: [number, number, number] = [16, 16, 16];
export const CAMERA_TARGET: [number, number, number] = [0.3, 0, -1.8];
