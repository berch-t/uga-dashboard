/** Shared colour vocabulary for charts, badges and the network graph. */

import type { OaStatus } from "./types";

/** Open Access colours, aligned with the community's conventional palette. */
export const OA_COLORS: Record<OaStatus, { tremor: string; hex: string; label: string }> = {
  diamond: { tremor: "sky", hex: "#38bdf8", label: "Diamant" },
  gold: { tremor: "amber", hex: "#f59e0b", label: "Or (gold)" },
  hybrid: { tremor: "orange", hex: "#fb923c", label: "Hybride" },
  green: { tremor: "emerald", hex: "#10b981", label: "Vert (green)" },
  bronze: { tremor: "yellow", hex: "#ca8a04", label: "Bronze" },
  closed: { tremor: "gray", hex: "#9ca3af", label: "Accès fermé" },
};

/** Qualitative palette for Louvain communities (color-blind-aware ordering). */
export const COMMUNITY_PALETTE = [
  "#2563eb", "#dc2626", "#059669", "#d97706",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
  "#475569", "#ea580c",
];

export const communityColor = (community: number): string =>
  COMMUNITY_PALETTE[community % COMMUNITY_PALETTE.length] ?? "#475569";

/** Tremor colour names used by multi-series charts. */
export const SERIES_COLORS = ["blue", "emerald", "amber", "violet", "rose", "cyan"] as const;
