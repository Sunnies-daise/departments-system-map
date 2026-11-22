import { useEffect, useState } from "react";

import { departmentsById } from "@/data/systemMap";
import { TABS, useTab, type TabId } from "@/lib/tabs";
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

export default function App() {
  const selected = useMapStore((s) => s.selected);
  const closeAll = useMapStore((s) => s.closeAll);
  const dept = selected ? departmentsById[selected] : null;
  const [tab, setTab] = useTab();
  // Load each page tab the first time it opens, then keep it mounted so its state survives switching.
  const [loaded, setLoaded] = useState<ReadonlySet<TabId>>(() => new Set([tab]));
  useEffect(() => {
    setLoaded((s) => (s.has(tab) ? s : new Set(s).add(tab)));
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
      {/* Tabs stay mounted once opened; hidden ones keep their pan, zoom and selection. */}
      <main className="stage" id="panel-system" role="tabpanel" aria-labelledby="tab-system" hidden={tab !== "system"}>
        <Scene active={tab === "system"} />
        <HoverCard />
        <GlossaryDrawer />
        {dept && <DeptPanel key={dept.id} dept={dept} />}
      </main>
      {TABS.filter((t) => t.page).map((t) => (
        <main key={t.id} className="stage" id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={tab !== t.id}>
          {loaded.has(t.id) && (
            <iframe className="tab-frame" src={import.meta.env.BASE_URL + t.page} title={t.label} data-testid={`${t.page!.replace(".html", "")}-frame`} />
          )}
        </main>
      ))}
      {tab === "system" && <HelpOverlay />}
    </div>
  );
}
