import type { Role } from "@/data/types";
import { deptName, groupPermissions } from "@/lib/selectors";
import { useMapStore } from "@/state/useMapStore";

import { MaturityChip } from "./Chips";

export function RolePopover({ role }: { role: Role }) {
  const selectRole = useMapStore((s) => s.selectRole);
  const perms = role.maturity === "target" ? role.proposedPermissions : role.permissions;
  const groups = groupPermissions(perms);
  return (
    <div className="role-popover" role="dialog" aria-label={`${role.label} role`} data-testid={`role-popover-${role.id}`}>
      <div className="role-popover-head">
        <div>
          <div className="eyebrow">
            Role · {role.department ? deptName(role.department) : "Platform"}
            {role.alsoIn?.length ? ` · also in ${role.alsoIn.map(deptName).join(", ")}` : ""}
          </div>
          <h3>{role.label}</h3>
          <code className="role-id">{role.id}</code>
        </div>
        <div className="role-popover-actions">
          <MaturityChip maturity={role.maturity} small />
          <button type="button" className="icon-btn" aria-label="Close role" onClick={() => selectRole(null)}>
            ×
          </button>
        </div>
      </div>
      <p className="role-blurb">{role.blurb}</p>
      <h4>How they handle their work</h4>
      <ol className="how-list">
        {role.howTheyWork.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ol>
      <h4>
        {role.maturity === "target" ? "Proposed permissions" : "Permissions"}{" "}
        <span className="muted">({perms.length})</span>
      </h4>
      {groups.length === 0 ? (
        <p className="muted">None proposed yet.</p>
      ) : (
        <div className="perm-groups">
          {groups.map((g) => (
            <div key={g.resource} className="perm-group">
              <span className="perm-resource">{g.resource}</span>
              {g.actions.map((a) => (
                <code key={a} className="perm-chip" data-testid={`perm-${g.resource}.${a}`}>
                  {a}
                </code>
              ))}
            </div>
          ))}
        </div>
      )}
      {role.seedUser && (
        <p className="muted seed-user">
          Demo login: <b>{role.seedUser.name}</b> · {role.seedUser.email}
        </p>
      )}
      {role.maturity === "target" && (
        <p className="note note-target">Target role from the PM's org brief — no login, permission or screen exists for it yet.</p>
      )}
    </div>
  );
}
