import raw from "./system-map.json";
import type { Department, Role, SystemMap } from "./types";

export const systemMap = raw as unknown as SystemMap;

export const departmentsById: Record<string, Department> = Object.fromEntries(
  systemMap.departments.map((d) => [d.id, d]),
);
export const rolesById: Record<string, Role> = Object.fromEntries(
  systemMap.roles.map((r) => [r.id, r]),
);
