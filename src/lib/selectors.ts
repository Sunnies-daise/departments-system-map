import { departmentsById, rolesById, systemMap } from "@/data/systemMap";
import type { Department, Edge, Maturity, Mode, Role } from "@/data/types";

/** Is something with this maturity part of the picture in this mode? */
export function isVisible(maturity: Maturity, mode: Mode): boolean {
  return mode === "target" || maturity !== "target";
}

/** A block is "built" when it has real behaviour today (live or prototype). */
export function isDeptBuilt(dept: Department): boolean {
  return dept.maturity === "live" || dept.maturity === "prototype";
}

/** Ghosted = drawn as a wireframe placeholder (As-built mode, nothing shipped). */
export function isDeptGhost(dept: Department, mode: Mode): boolean {
  return mode === "asBuilt" && !isDeptBuilt(dept);
}

export function visibleEdges(mode: Mode): Edge[] {
  return systemMap.edges.filter((e) => isVisible(e.maturity, mode));
}

export function edgesTouching(deptId: string, mode: Mode): Edge[] {
  return visibleEdges(mode).filter((e) => e.from === deptId || e.to === deptId);
}

export function relatedDepartments(deptId: string, mode: Mode): Set<string> {
  const out = new Set<string>();
  for (const e of edgesTouching(deptId, mode)) out.add(e.from === deptId ? e.to : e.from);
  return out;
}

/** Roles shown on a block: the department's own plus roles that list it in `alsoIn`. */
export function rolesFor(dept: Department, mode: Mode): Role[] {
  const ids = new Set(dept.roles);
  for (const r of systemMap.roles) if (r.alsoIn?.includes(dept.id)) ids.add(r.id);
  return [...ids]
    .map((id) => rolesById[id])
    .filter((r): r is Role => Boolean(r))
    .filter((r) => isVisible(r.maturity, mode))
    .sort((a, b) => maturityRank(a.maturity) - maturityRank(b.maturity));
}

export function responsibilitiesFor(dept: Department, mode: Mode) {
  return dept.responsibilities.filter((r) => isVisible(r.maturity, mode));
}

export function maturityRank(m: Maturity): number {
  return ["live", "prototype", "schema-only", "target"].indexOf(m);
}

export function deptName(id: string): string {
  return departmentsById[id]?.name ?? id;
}

/** Group "resource.action" keys by resource for the permission chips. */
export function groupPermissions(keys: string[]): { resource: string; actions: string[] }[] {
  const map = new Map<string, string[]>();
  for (const k of keys) {
    const [resource, action] = k.split(".");
    map.set(resource, [...(map.get(resource) ?? []), action]);
  }
  return [...map.entries()]
    .map(([resource, actions]) => ({ resource, actions: actions.sort() }))
    .sort((a, b) => a.resource.localeCompare(b.resource));
}

export const MATURITY_LABEL: Record<Maturity, string> = {
  live: "Live",
  prototype: "Prototype",
  "schema-only": "Schema only",
  target: "Target",
};
