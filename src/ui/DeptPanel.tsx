import { useMemo } from "react";

import { departmentsById, rolesById, systemMap } from "@/data/systemMap";
import type { Department, Edge } from "@/data/types";
import { deptName, isDeptGhost, responsibilitiesFor, rolesFor, visibleEdges } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { MaturityChip, MaturityDot } from "./Chips";
import { RolePill } from "./RolePill";
import { RolePopover } from "./RolePopover";

const ERP_REPO = "https://github.com/Sunnies-daise/Lincoln-ERP-product-demo/blob/main/";

export function DeptPanel({ dept }: { dept: Department }) {
  const mode = useMapStore((s) => s.mode);
  const select = useMapStore((s) => s.select);
  const selectedRole = useMapStore((s) => s.selectedRole);
  const highlightedEdge = useMapStore((s) => s.highlightedEdge);
  const highlightEdge = useMapStore((s) => s.highlightEdge);

  const roles = rolesFor(dept, mode);
  const tasks = responsibilitiesFor(dept, mode);
  const edges = useMemo(() => visibleEdges(mode), [mode]);
  const outputs = edges.filter((e) => e.from === dept.id);
  const inputsFrom = edges.filter((e) => e.to === dept.id);
  const role = selectedRole ? rolesById[selectedRole] : null;
  const ghost = isDeptGhost(dept, mode);
  const ladder = dept.id === "quotation" ? systemMap.targetModel.approvalLadder : null;

  const toggleEdge = (e: Edge) => highlightEdge(highlightedEdge === e.id ? null : e.id);

  return (
    <aside className="dept-panel" data-testid="dept-panel" style={{ "--dept": dept.color } as React.CSSProperties}>
      <header className="dept-panel-head">
        <div>
          <div className="eyebrow">Department</div>
          <h2 data-testid="dept-panel-title">{dept.name}</h2>
          <div className="chips">
            <MaturityChip maturity={dept.maturity} />
            {ghost && <span className="chip chip-ghost">Not built yet</span>}
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close panel" onClick={() => select(null)}>
          ×
        </button>
      </header>

      {role && <RolePopover role={role} />}

      <p className="blurb">{dept.blurb}</p>

      <section>
        <h3>
          Roles <span className="muted">({roles.length})</span>
        </h3>
        <div className="pills" data-testid="role-pills">
          {roles.map((r) => (
            <RolePill key={r.id} role={r} deptId={dept.id} />
          ))}
        </div>
        <p className="hint">Click a pill to see what the role does and how they work.</p>
      </section>

      {ladder && (
        <section data-testid="approval-ladder">
          <h3>Approval ladder</h3>
          <p className="muted">{mode === "target" ? ladder.target.summary : ladder.asBuilt.summary}</p>
          <ol className="ladder">
            {(mode === "target" ? ladder.target.steps : ladder.asBuilt.steps).map((s) => (
              <li key={s.step}>
                <b>{s.who}</b> — {s.does}
                {s.gate && <code className="perm-chip">{s.gate}</code>}
              </li>
            ))}
          </ol>
          <p className="note">
            {mode === "target" ? `Today: ${ladder.asBuilt.summary}` : `Target: ${ladder.target.summary}`}
          </p>
        </section>
      )}

      <section>
        <h3>
          Responsibilities <span className="muted">({tasks.length})</span>
        </h3>
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t.label}>
              <MaturityDot maturity={t.maturity} />
              <span>{t.label}</span>
              {t.page && <code className="page-chip">{t.page}</code>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Crucial data this department enters</h3>
        <ul className="input-list">
          {dept.inputs.map((i) => (
            <li key={i.record}>
              <div className="input-head">
                <b>{i.record}</b>
                <MaturityChip maturity={i.maturity} small />
              </div>
              <div className="fields">
                {i.fields.map((f) => (
                  <span key={f} className="field">
                    {f}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>
          Data flowing out <span className="muted">({outputs.length})</span>
        </h3>
        {outputs.length === 0 && <p className="muted">No outgoing flows in this view.</p>}
        <ul className="flow-list" data-testid="outputs">
          {outputs.map((e) => (
            <li key={e.id}>
              <FlowRow edge={e} other={departmentsById[e.to]} arrow="→" active={highlightedEdge === e.id} onClick={() => toggleEdge(e)} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>
          Data flowing in <span className="muted">({inputsFrom.length})</span>
        </h3>
        {inputsFrom.length === 0 && <p className="muted">No incoming flows in this view.</p>}
        <ul className="flow-list" data-testid="inputs">
          {inputsFrom.map((e) => (
            <li key={e.id}>
              <FlowRow edge={e} other={departmentsById[e.from]} arrow="←" active={highlightedEdge === e.id} onClick={() => toggleEdge(e)} />
            </li>
          ))}
        </ul>
      </section>

      {(dept.asBuiltNote || dept.targetNote) && (
        <section>
          <h3>Today vs target</h3>
          {dept.asBuiltNote && (
            <p className="note note-asbuilt">
              <b>Today.</b> {dept.asBuiltNote}
            </p>
          )}
          {dept.targetNote && (
            <p className="note note-target">
              <b>Target.</b> {dept.targetNote}
            </p>
          )}
        </section>
      )}

      {dept.pages.length > 0 && (
        <section>
          <h3>
            Screens in the ERP <span className="muted">({dept.pages.length})</span>
          </h3>
          <ul className="page-list">
            {dept.pages.map((p) => (
              <li key={p.url}>
                <span>{p.title}</span>
                <code className="page-chip">{p.url}</code>
                {p.permission && <code className="perm-chip">{p.permission}</code>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>
          Tables <span className="muted">({dept.tables.length})</span>
        </h3>
        <div className="tables">
          {dept.tables.map((t) => (
            <code key={t.name} className={`table-chip${t.inSchema ? "" : " table-proto"}`} title={t.inSchema ? `server/domains/${t.domain}` : "Prototype table created by direct DDL (not in the Drizzle schema)"}>
              {t.name}
              {!t.inSchema && "*"}
            </code>
          ))}
        </div>
        {dept.tables.some((t) => !t.inSchema) && <p className="hint">* prototype table, created by direct DDL on the demo DB.</p>}
      </section>
    </aside>
  );

  function FlowRow({ edge, other, arrow, active, onClick }: { edge: Edge; other: Department; arrow: string; active: boolean; onClick: () => void }) {
    return (
      <button type="button" className={`flow-row${active ? " active" : ""}`} data-testid={`flow-${edge.id}`} aria-pressed={active} onClick={onClick} style={{ "--other": other.color } as React.CSSProperties}>
        <span className="flow-dir">
          {arrow} <b>{deptName(other.id)}</b>
        </span>
        <span className="flow-record">{edge.record}</span>
        <MaturityChip maturity={edge.maturity} small />
        {active && (
          <span className="flow-detail">
            <span>{edge.trigger}</span>
            {edge.statusPath && <span className="status-path">{edge.statusPath.join(" → ")}</span>}
            <span className="evidence">
              {edge.evidence.map((ev) => (
                <a key={ev} href={ERP_REPO + ev} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  {ev}
                </a>
              ))}
            </span>
          </span>
        )}
      </button>
    );
  }
}
