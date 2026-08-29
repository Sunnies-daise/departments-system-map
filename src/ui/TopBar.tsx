import { systemMap } from "@/data/systemMap";
import { visibleEdges } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { ModeToggle } from "./ModeToggle";

export function TopBar() {
  const mode = useMapStore((s) => s.mode);
  const glossaryOpen = useMapStore((s) => s.glossaryOpen);
  const setGlossaryOpen = useMapStore((s) => s.setGlossaryOpen);
  const setHelpOpen = useMapStore((s) => s.setHelpOpen);
  const flows = visibleEdges(mode).length;
  const roles = systemMap.roles.filter((r) => r.department && (mode === "target" || r.maturity !== "target")).length;
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>Lincoln System Map</h1>
        <p>
          {systemMap.departments.length} departments · {roles} roles · {flows} data flows
          {systemMap.erpCommit && <span className="muted"> · ERP @ {systemMap.erpCommit}</span>}
        </p>
      </div>
      <div className="topbar-actions">
        <ModeToggle />
        <button type="button" className={`btn${glossaryOpen ? " active" : ""}`} data-testid="glossary-btn" onClick={() => setGlossaryOpen(!glossaryOpen)}>
          Terminology
        </button>
        <button type="button" className="btn" aria-label="How to use this map" data-testid="help-btn" onClick={() => setHelpOpen(true)}>
          ?
        </button>
      </div>
    </header>
  );
}
