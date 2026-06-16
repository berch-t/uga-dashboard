/**
 * GET /api/explore — requêtage interactif et multi-sources.
 *
 * Paramètres : source (openalex|hal|scanr), q (recherche), from, to (années),
 * type, oa ("true"|"false"). Renvoie un `ExploreResult` normalisé (décompte,
 * résultats, facettes, URL réellement appelée pour la transparence).
 */

import { NextResponse } from "next/server";
import { runExplore, type ExploreParams, type ExploreSource } from "@/lib/explore";

export const revalidate = 1800;

const SOURCES: ExploreSource[] = ["openalex", "hal", "scanr"];

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get("source") ?? "openalex") as ExploreSource;
  if (!SOURCES.includes(source)) {
    return NextResponse.json({ error: "source inconnue" }, { status: 400 });
  }

  const num = (k: string): number | undefined => {
    const v = searchParams.get(k);
    return v ? Number(v) : undefined;
  };

  const params: ExploreParams = {
    source,
    q: searchParams.get("q") ?? undefined,
    fromYear: num("from"),
    toYear: num("to"),
    type: searchParams.get("type") ?? undefined,
    oa: searchParams.has("oa") ? searchParams.get("oa") === "true" : undefined,
  };

  try {
    const result = await runExplore(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "requête échouée", detail: String(error) }, { status: 502 });
  }
}
