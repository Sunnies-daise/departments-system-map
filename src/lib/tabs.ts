import { useCallback, useEffect, useState } from "react";

export type TabId = "system" | "problems";

export const TABS: { id: TabId; label: string; hash: string }[] = [
  { id: "system", label: "System map", hash: "" },
  { id: "problems", label: "Problem map", hash: "#problems" },
];

const fromHash = (): TabId => (window.location.hash === "#problems" ? "problems" : "system");

/** Active tab, kept in the URL hash so each tab can be linked to and Back switches tabs. */
export function useTab(): [TabId, (t: TabId) => void] {
  const [tab, setTabState] = useState<TabId>(fromHash);
  useEffect(() => {
    const onHash = () => setTabState(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const setTab = useCallback((t: TabId) => {
    const hash = TABS.find((x) => x.id === t)!.hash;
    if (hash) window.location.hash = hash;
    else history.pushState(null, "", window.location.pathname + window.location.search);
    setTabState(t);
  }, []);
  return [tab, setTab];
}
