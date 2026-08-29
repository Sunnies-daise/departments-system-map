import { useEffect } from "react";

import { departmentsById } from "@/data/systemMap";
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

  useEffect(() => {
    window.__mapDebug = { getState: useMapStore.getState, setState: useMapStore.setState };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  return (
    <div className="app">
      <TopBar />
      <main className="stage">
        <Scene />
        <HoverCard />
        <GlossaryDrawer />
        {dept && <DeptPanel key={dept.id} dept={dept} />}
      </main>
      <HelpOverlay />
    </div>
  );
}
