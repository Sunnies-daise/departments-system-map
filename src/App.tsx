import { useEffect, useState } from "react";

import { departmentsById } from "@/data/systemMap";
import { useTab } from "@/lib/tabs";
import { Scene } from "@/scene/Scene";
import { useMapStore } from "@/state/useMapStore";
import { DeptPanel } from "@/ui/DeptPanel";
import { GlossaryDrawer } from "@/ui/GlossaryDrawer";
import { HelpOverlay } from "@/ui/HelpOverlay";
import { HoverCard } from "@/ui/HoverCard";
import { TopBar } from "@/ui/TopBar";

declare global {
  interface Window {
    __mapDebug?: { getState: typeof useMapStore.getState; setState: typeof useMapStore.setState };
  }
}

const PROBLEM_MAP_SRC = `${import.meta.env.BASE_URL}problem-map.html`;

export default function App() {
  const selected = useMapStore((s) => s.selected);
  const closeAll = useMapStore((s) => s.closeAll);
  const dept = selected ? departmentsById[selected] : null;
  const [tab, setTab] = useTab();
  // Load the problem map the first time its tab opens, then keep it mounted so its state survives switching.
  const [problemsLoaded, setProblemsLoaded] = useState(tab === "problems");
  useEffect(() => {
    if (tab === "problems") setProblemsLoaded(true);
  }, [tab]);

  useEffect(() => {
    window.__mapDebug = { getState: useMapStore.getState, setState: useMapStore.setState };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tab === "system") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll, tab]);

  return (
    <div className="app">
      <TopBar tab={tab} onTab={setTab} />
      {/* Both tabs stay mounted; the hidden one keeps its pan, zoom and selection. */}
      <main className="stage" id="panel-system" role="tabpanel" aria-labelledby="tab-system" hidden={tab !== "system"}>
        <Scene active={tab === "system"} />
        <HoverCard />
        <GlossaryDrawer />
        {dept && <DeptPanel key={dept.id} dept={dept} />}
      </main>
      <main className="stage" id="panel-problems" role="tabpanel" aria-labelledby="tab-problems" hidden={tab !== "problems"}>
        {problemsLoaded && (
          <iframe className="tab-frame" src={PROBLEM_MAP_SRC} title="Lincoln Business Operations Problem Map" data-testid="problem-map-frame" />
        )}
      </main>
      {tab === "system" && <HelpOverlay />}
    </div>
  );
}
