import type { Department } from "@/data/types";
import { deptName, relatedDepartments, responsibilitiesFor, rolesFor } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { MaturityChip, MaturityDot } from "./Chips";

export function HoverCard({ dept }: { dept: Department }) {
  const mode = useMapStore((s) => s.mode);
  const roles = rolesFor(dept, mode);
  const tasks = responsibilitiesFor(dept, mode);
  const related = [...relatedDepartments(dept.id, mode)];
  return (
    <div className="hover-card" data-testid={`hover-card-${dept.id}`} style={{ "--dept": dept.color } as React.CSSProperties}>
      <div className="hover-card-head">
        <span className="swatch" />
        <strong>{dept.name}</strong>
        <MaturityChip maturity={dept.maturity} small />
      </div>
      <div className="hover-card-stats" data-testid="hover-stats">
        <span>
          <b>{roles.length}</b> {roles.length === 1 ? "role" : "roles"}
        </span>
        <span>·</span>
        <span>
          <b>{tasks.length}</b> {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>
      <ul className="hover-card-tasks">
        {tasks.slice(0, 3).map((t) => (
          <li key={t.label}>
            <MaturityDot maturity={t.maturity} />
            {t.label}
          </li>
        ))}
        {tasks.length > 3 && <li className="muted">+{tasks.length - 3} more — click to open</li>}
      </ul>
      {related.length > 0 && (
        <div className="hover-card-related">
          Flows with {related.map(deptName).join(" · ")}
        </div>
      )}
    </div>
  );
}
