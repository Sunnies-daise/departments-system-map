import { useRef } from "react";

import { systemMap } from "@/data/systemMap";
import { TABS, type TabId } from "@/lib/tabs";
import { useMapStore } from "@/state/useMapStore";

interface Props {
  tab: TabId;
  onTab: (t: TabId) => void;
}

export function TopBar({ tab, onTab }: Props) {
  const glossaryOpen = useMapStore((s) => s.glossaryOpen);
  const setGlossaryOpen = useMapStore((s) => s.setGlossaryOpen);
  const setHelpOpen = useMapStore((s) => s.setHelpOpen);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flows = systemMap.edges.length;
  const roles = systemMap.roles.filter((r) => r.department).length;

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
    onTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>Departments System Map</h1>
        {tab === "system" && (
          <p>
            {systemMap.departments.length} departments · {roles} roles · {flows} data flows
            {systemMap.erpCommit && <span className="muted"> · ERP @ {systemMap.erpCommit}</span>}
          </p>
        )}
      </div>
      <div className="tabs" role="tablist" aria-label="Map view" onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(n) => {
              tabRefs.current[t.id] = n;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="tab"
            data-testid={`tab-${t.id}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="topbar-actions">
        {tab === "system" && (
          <>
            <button type="button" className={`btn${glossaryOpen ? " active" : ""}`} data-testid="glossary-btn" onClick={() => setGlossaryOpen(!glossaryOpen)}>
              Terminology
            </button>
            <button type="button" className="btn" aria-label="How to use this map" data-testid="help-btn" onClick={() => setHelpOpen(true)}>
              ?
            </button>
          </>
        )}
      </div>
    </header>
  );
}
