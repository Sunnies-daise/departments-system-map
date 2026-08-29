import { systemMap } from "@/data/systemMap";
import { useMapStore } from "@/state/useMapStore";

export function Legend() {
  const mode = useMapStore((s) => s.mode);
  return (
    <div className="legend" data-testid="legend">
      <div className="legend-title">Legend</div>
      <div className="legend-row">
        {systemMap.departments.map((d) => (
          <span key={d.id} className="legend-dept" style={{ "--dept": d.color } as React.CSSProperties}>
            <span className="swatch" />
            {d.name}
          </span>
        ))}
      </div>
      <div className="legend-row">
        <span className="dot maturity-live" /> Live
        <span className="dot maturity-prototype" /> Prototype (demo branch)
        <span className="dot maturity-schema-only" /> Schema only
        <span className="dot maturity-target" /> Target (PM brief)
      </div>
      <div className="legend-row muted">
        Solid line = built flow · dashed = schema-only / target · wireframe block = nothing built yet
        {mode === "asBuilt" ? " · target items hidden or ghosted" : ""}
      </div>
      <div className="legend-row muted">
        Admin holds every permission and is not a department. Notifications fan out per department feed
        ({systemMap.notifications.departments.join(", ")}).
      </div>
    </div>
  );
}
