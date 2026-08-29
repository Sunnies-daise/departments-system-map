import type { Mode } from "@/data/types";
import { useMapStore } from "@/state/useMapStore";

const OPTIONS: { value: Mode; label: string; hint: string }[] = [
  { value: "target", label: "Target", hint: "The organisation model the PM is designing toward" },
  { value: "asBuilt", label: "As-built", hint: "What the code does today — target-only items are ghosted" },
];

export function ModeToggle() {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);
  return (
    <div className="mode-toggle" role="radiogroup" aria-label="View mode" data-testid="mode-toggle">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={mode === o.value}
          className={mode === o.value ? "active" : ""}
          data-testid={`mode-${o.value}`}
          title={o.hint}
          onClick={() => setMode(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
