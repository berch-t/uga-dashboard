/**
 * GET /api/papers — live, filtered drill-down into the OpenAlex corpus.
 *
 * Query params: from, to (years), type (canonical), oa ("true"|"false"),
 * q (free text), sort ("citations"|"date"), limit.
 */

import { NextResponse } from "next/server";
import { fetchLivePapers, type PaperQuery } from "@/lib/openalex-client";

export const revalidate = 3600;

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const num = (k: string): number | undefined => {
    const v = searchParams.get(k);
    return v ? Number(v) : undefined;
  };

  const query: PaperQuery = {
    fromYear: num("from"),
    toYear: num("to"),
    type: searchParams.get("type") ?? undefined,
    openAccess: searchParams.has("oa") ? searchParams.get("oa") === "true" : undefined,
    search: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") === "date" ? "date" : "citations",
    perPage: num("limit") ?? 25,
  };

  try {
    const works = await fetchLivePapers(query);
    return NextResponse.json({ works, count: works.length });
  } catch (error) {
    return NextResponse.json(
      { error: "OpenAlex query failed", detail: String(error) },
      { status: 502 },
    );
  }
}
