import type { Role } from "@/data/types";
import { departmentsById } from "@/data/systemMap";
import { useMapStore } from "@/state/useMapStore";

export function RolePill({ role, deptId }: { role: Role; deptId: string }) {
  const selectedRole = useMapStore((s) => s.selectedRole);
  const selectRole = useMapStore((s) => s.selectRole);
  const color = departmentsById[role.department ?? deptId]?.color ?? "#94a3b8";
  const isTarget = role.maturity === "target";
  const active = selectedRole === role.id;
  return (
    <button
      type="button"
      className={`role-pill${isTarget ? " role-pill-target" : ""}${active ? " active" : ""}`}
      style={{ "--dept": color } as React.CSSProperties}
      data-testid={`role-pill-${role.id}`}
      data-maturity={role.maturity}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        selectRole(active ? null : role.id);
      }}
      title={isTarget ? "Target role — not in the code yet" : role.blurb}
    >
      <span className="role-pill-swatch" />
      {role.label}
      {isTarget && <span className="role-pill-tag">target</span>}
      {role.maturity === "prototype" && <span className="role-pill-tag">proto</span>}
    </button>
  );
}
