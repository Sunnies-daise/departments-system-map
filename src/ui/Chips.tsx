import type { Maturity } from "@/data/types";
import { MATURITY_LABEL } from "@/lib/selectors";

export function MaturityChip({ maturity, small }: { maturity: Maturity; small?: boolean }) {
  const label = MATURITY_LABEL[maturity];
  if (!label) return null;
  return (
    <span className={`chip maturity-${maturity}${small ? " chip-sm" : ""}`} data-maturity={maturity}>
      {label}
    </span>
  );
}

export function MaturityDot({ maturity }: { maturity: Maturity }) {
  const label = MATURITY_LABEL[maturity] ?? undefined;
  return <span className={`dot maturity-${maturity}`} title={label} aria-label={label} />;
}
