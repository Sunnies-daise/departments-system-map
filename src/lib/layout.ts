import * as THREE from "three";

import type { Department, Edge } from "@/data/types";

export const BLOCK_WIDTH = 2.3;
export const BLOCK_HEIGHT = 1.25;

export function blockWidth(d: Department): number {
  return BLOCK_WIDTH * d.size;
}
export function blockHeight(d: Department): number {
  return BLOCK_HEIGHT * d.size;
}

/**
 * Curve for an edge: leaves the top of `from`, arcs over, lands on the top of `to`.
 * Paired edges (A→B and B→A) are offset sideways so both stay readable.
 */
export function edgeCurve(edge: Edge, from: Department, to: Department): THREE.QuadraticBezierCurve3 {
  const a = new THREE.Vector3(from.position[0], blockHeight(from), from.position[2]);
  const b = new THREE.Vector3(to.position[0], blockHeight(to), to.position[2]);
  const dir = b.clone().sub(a);
  const dist = dir.length();
  const perp = new THREE.Vector3().crossVectors(dir.clone().normalize(), new THREE.Vector3(0, 1, 0)).normalize();
  const sign = edge.from < edge.to ? 1 : -1;
  const side = perp.multiplyScalar(0.42 * sign);
  a.add(side);
  b.add(side);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += 1.1 + dist * 0.16;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

export const CAMERA_POSITION: [number, number, number] = [0.5, 9.5, 14];
export const CAMERA_TARGET: [number, number, number] = [0, 0.4, -1];
