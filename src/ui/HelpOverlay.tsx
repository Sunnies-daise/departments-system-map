import { useMapStore } from "@/state/useMapStore";

export function HelpOverlay() {
  const open = useMapStore((s) => s.helpOpen);
  const setOpen = useMapStore((s) => s.setHelpOpen);
  if (!open) return null;
  return (
    <div className="help-backdrop" onClick={() => setOpen(false)} data-testid="help">
      <div className="help" role="dialog" aria-label="How to use this map" onClick={(e) => e.stopPropagation()}>
        <h2>How to read the map</h2>
        <ul>
          <li>
            <b>Hover a block</b> — see how many roles and tasks the department has; the departments it exchanges data with light up and the flow animates.
          </li>
          <li>
            <b>Click a block</b> — open the department: roles, responsibilities, the crucial data it enters, and where that data goes.
          </li>
          <li>
            <b>Click a role pill</b> — what the role does, how they handle their work, and the permissions behind it.
          </li>
          <li>
            <b>Click a flow</b> in the panel — highlight that path on the map, with the trigger, status path and the source files.
          </li>
          <li>
            <b>Target / As-built</b> — switch between the organisation model being designed and what the code does today.
          </li>
          <li>Drag to orbit, scroll to zoom. Esc closes.</li>
        </ul>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Got it
        </button>
      </div>
    </div>
  );
}
