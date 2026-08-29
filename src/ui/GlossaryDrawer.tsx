import { useMemo, useState } from "react";

import { departmentsById, systemMap } from "@/data/systemMap";
import { useMapStore } from "@/state/useMapStore";

export function GlossaryDrawer() {
  const open = useMapStore((s) => s.glossaryOpen);
  const setOpen = useMapStore((s) => s.setGlossaryOpen);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const terms = systemMap.terms.filter(
      (t) => !needle || t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle),
    );
    const map = new Map<string, typeof terms>();
    for (const t of terms) {
      const key = t.section ?? "Other";
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()];
  }, [q]);
  if (!open) return null;
  return (
    <aside className="glossary" data-testid="glossary" role="dialog" aria-label="Glossary">
      <header className="glossary-head">
        <h2>Terminology</h2>
        <button type="button" className="icon-btn" aria-label="Close glossary" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>
      <input
        type="search"
        placeholder="Search terms (e.g. IVN, CRFQ, whiteboard)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        data-testid="glossary-search"
        autoFocus
      />
      <div className="glossary-body">
        {groups.length === 0 && <p className="muted">No term matches “{q}”.</p>}
        {groups.map(([section, terms]) => (
          <section key={section}>
            <h3>{section}</h3>
            <dl>
              {terms.map((t) => {
                const dept = t.department ? departmentsById[t.department] : null;
                return (
                  <div key={t.term} className="term" data-testid="term">
                    <dt>
                      {dept && <span className="swatch" style={{ "--dept": dept.color } as React.CSSProperties} />}
                      {t.term}
                    </dt>
                    <dd>
                      {t.definition}
                      <span className="term-source">{t.source}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </aside>
  );
}
