import { systemMap } from "@/data/systemMap";
import { useMapStore } from "@/state/useMapStore";


export function TopBar() {
  const glossaryOpen = useMapStore((s) => s.glossaryOpen);
  const setGlossaryOpen = useMapStore((s) => s.setGlossaryOpen);
  const setHelpOpen = useMapStore((s) => s.setHelpOpen);
  const flows = systemMap.edges.length;
  const roles = systemMap.roles.filter((r) => r.department).length;
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>Departments System Map</h1>
        <p>
          {systemMap.departments.length} departments · {roles} roles · {flows} data flows
          {systemMap.erpCommit && <span className="muted"> · ERP @ {systemMap.erpCommit}</span>}
        </p>
      </div>
      <div className="topbar-actions">
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
