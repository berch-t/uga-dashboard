/**
 * GET /api/health — liveness probe for the two upstream data sources.
 * Used by infrastructure health checks (see docs/deployment.md).
 */

import { NextResponse } from "next/server";

const MAILTO = process.env.OPENALEX_MAILTO ?? "demo@uga-dashboard.fr";
const INSTITUTION = process.env.NEXT_PUBLIC_INSTITUTION_OPENALEX_ID ?? "I899635006";
const HAL_ACRONYM = process.env.HAL_STRUCT_ACRONYM ?? "UGA";

async function probe(name: string, url: string): Promise<{ name: string; ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    return { name, ok: res.ok, ms: Date.now() - start };
  } catch {
    return { name, ok: false, ms: Date.now() - start };
  }
}

export async function GET(): Promise<NextResponse> {
  const [openalex, hal] = await Promise.all([
    probe("openalex", `https://api.openalex.org/works?filter=institutions.id:${INSTITUTION}&per-page=1&mailto=${MAILTO}`),
    probe("hal", `https://api.archives-ouvertes.fr/search/?q=*:*&fq=structAcronym_s:${HAL_ACRONYM}&rows=0&wt=json`),
  ]);
  const ok = openalex.ok && hal.ok;
  return NextResponse.json({ status: ok ? "healthy" : "degraded", checks: [openalex, hal] }, { status: ok ? 200 : 503 });
}
