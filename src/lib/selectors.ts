import { departmentsById, rolesById, systemMap } from "@/data/systemMap";
import type { Department, Edge, Maturity, Role } from "@/data/types";

export function edgesTouching(deptId: string): Edge[] {
  return systemMap.edges.filter((e) => e.from === deptId || e.to === deptId);
}

export function relatedDepartments(deptId: string): Set<string> {
  const out = new Set<string>();
  for (const e of edgesTouching(deptId)) out.add(e.from === deptId ? e.to : e.from);
  return out;
}

/** Roles shown on a block: the department's own plus roles that list it in `alsoIn`. */
export function rolesFor(dept: Department): Role[] {
  const ids = new Set(dept.roles);
  for (const r of systemMap.roles) if (r.alsoIn?.includes(dept.id)) ids.add(r.id);
  return [...ids]
    .map((id) => rolesById[id])
    .filter((r): r is Role => Boolean(r))
    .sort((a, b) => maturityRank(a.maturity) - maturityRank(b.maturity));
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

/** "Schema only" is deliberately never shown as text — it reads like a warning to non-engineers. */
export const MATURITY_LABEL: Record<Maturity, string | null> = {
  live: "Live",
  prototype: "Prototype",
  "schema-only": null,
  target: "Target",
};
