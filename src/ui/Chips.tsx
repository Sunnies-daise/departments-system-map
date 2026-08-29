import type { Maturity } from "@/data/types";
import { MATURITY_LABEL } from "@/lib/selectors";

export function MaturityChip({ maturity, small }: { maturity: Maturity; small?: boolean }) {
  return (
    <span className={`chip maturity-${maturity}${small ? " chip-sm" : ""}`} data-maturity={maturity}>
      {MATURITY_LABEL[maturity]}
    </span>
  );
}

export function MaturityDot({ maturity }: { maturity: Maturity }) {
  return <span className={`dot maturity-${maturity}`} title={MATURITY_LABEL[maturity]} aria-label={MATURITY_LABEL[maturity]} />;
}
