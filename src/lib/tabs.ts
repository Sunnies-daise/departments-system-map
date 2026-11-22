import { useCallback, useEffect, useState } from "react";

export type TabId = "problems" | "solutions" | "system";

/**
 * `page` tabs show a static page from public/ in an iframe; the "system" tab is the 3D map.
 * `hidden` tabs are left out of the tab bar but still open from a direct link (#solutions, #architecture).
 */
export const TABS: { id: TabId; label: string; hash: string; page?: string; hidden?: boolean }[] = [
  { id: "problems", label: "Problem map", hash: "", page: "problem-map.html" },
  { id: "solutions", label: "Solutions map", hash: "#solutions", page: "solutions-map.html", hidden: true },
  { id: "system", label: "Digital Brain architecture", hash: "#architecture", hidden: true },
];

// The Problem map is the landing tab; unknown hashes (and old #problems links) land there.
const fromHash = (): TabId => TABS.find((t) => t.hash && t.hash === window.location.hash)?.id ?? "problems";

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
