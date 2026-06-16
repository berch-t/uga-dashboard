"use client";

import { BarList } from "@tremor/react";
import { formatInt } from "@/lib/format";

/** Reusable ranked horizontal bar list (top journals, top authors, …). */
export function RankedBarList({
  data,
  color = "blue",
}: {
  data: Array<{ name: string; value: number }>;
  color?: string;
}) {
  return <BarList data={data} valueFormatter={formatInt} color={color} className="mt-2" />;
}
