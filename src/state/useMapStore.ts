import { create } from "zustand";

interface MapState {
  hovered: string | null;
  selected: string | null;
  selectedRole: string | null;
  highlightedEdge: string | null;
  glossaryOpen: boolean;
  helpOpen: boolean;
  reducedMotion: boolean;
  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
  selectRole: (id: string | null) => void;
  highlightEdge: (id: string | null) => void;
  setGlossaryOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  closeAll: () => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const useMapStore = create<MapState>((set) => ({
  hovered: null,
  selected: null,
  selectedRole: null,
  highlightedEdge: null,
  glossaryOpen: false,
  helpOpen: false,
  reducedMotion: Boolean(prefersReducedMotion),
  setHovered: (hovered) => set({ hovered }),
  select: (selected) => set({ selected, selectedRole: null, highlightedEdge: null }),
  selectRole: (selectedRole) => set({ selectedRole }),
  highlightEdge: (highlightedEdge) => set({ highlightedEdge }),
  setGlossaryOpen: (glossaryOpen) => set({ glossaryOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  closeAll: () =>
    set((s) =>
      s.selectedRole
        ? { selectedRole: null }
        : s.glossaryOpen || s.helpOpen
          ? { glossaryOpen: false, helpOpen: false }
          : { selected: null, highlightedEdge: null },
    ),
}));

/** The block the scene is focused on: hover wins over selection. */
export function focusId(s: Pick<MapState, "hovered" | "selected">): string | null {
  return s.hovered ?? s.selected;
}
