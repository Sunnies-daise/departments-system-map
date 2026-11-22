import { useRef } from "react";

import { TABS, type TabId } from "@/lib/tabs";
import { useMapStore } from "@/state/useMapStore";

const SHOWN = TABS.filter((t) => !t.hidden);

interface Props {
  tab: TabId;
  onTab: (t: TabId) => void;
}

export function TopBar({ tab, onTab }: Props) {
  const glossaryOpen = useMapStore((s) => s.glossaryOpen);
  const setGlossaryOpen = useMapStore((s) => s.setGlossaryOpen);
  const setHelpOpen = useMapStore((s) => s.setHelpOpen);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const i = SHOWN.findIndex((t) => t.id === tab);
    const next = SHOWN[(i + (e.key === "ArrowRight" ? 1 : -1) + SHOWN.length) % SHOWN.length];
    onTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <header className="topbar">
      <div className="topbar-main">
        <h1>Operation System Map</h1>
        <div className="tabs" role="tablist" aria-label="Map view" onKeyDown={onKeyDown}>
          {SHOWN.map((t, i) => (
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
              // On a hidden tab's direct link, keep the first shown tab reachable by keyboard.
              tabIndex={tab === t.id || (i === 0 && !SHOWN.some((s) => s.id === tab)) ? 0 : -1}
              className="tab"
              data-testid={`tab-${t.id}`}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
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
