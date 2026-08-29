import { departmentsById } from "@/data/systemMap";
import { deptName, relatedDepartments, rolesFor } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { MaturityChip, MaturityDot } from "./Chips";

/** Fixed in the empty bottom-left corner so it never covers the map; hidden while a panel is open. */
export function HoverCard() {
  const hovered = useMapStore((s) => s.hovered);
  const selected = useMapStore((s) => s.selected);
  const dept = hovered && !selected ? departmentsById[hovered] : null;
  if (!dept) return null;
  const roles = rolesFor(dept);
  const tasks = dept.responsibilities;
  const related = [...relatedDepartments(dept.id)];
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
          Flows with{" "}
          {related.map((id) => (
            <span key={id} className="related-chip" style={{ "--dept": departmentsById[id]?.color } as React.CSSProperties}>
              <span className="swatch" />
              {deptName(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
