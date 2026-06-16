import { OA_COLORS } from "@/lib/colors";
import type { OaStatus } from "@/lib/types";

/** Small coloured pill describing a publication's Open Access status. */
export function OaBadge({ status }: { status: OaStatus | null }) {
  if (!status) return null;
  const oa = OA_COLORS[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${oa.hex}22`, color: oa.hex }}
    >
      {oa.label}
    </span>
  );
}
