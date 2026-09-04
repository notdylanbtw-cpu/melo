import { gstOf } from "@/lib/format";
import type { LineItem } from "./types";

export function totals(items: LineItem[], discount = 0) {
  const exRaw = items.filter((i) => !i.optional).reduce((s, i) => s + i.qty * i.sell, 0);
  const ex = Math.round((exRaw - discount) * 100) / 100;
  const gst = gstOf(ex);
  const inc = Math.round((ex + gst) * 100) / 100;
  const cost = Math.round(items.reduce((s, i) => s + i.qty * i.cost, 0) * 100) / 100;
  const margin = Math.round((ex - cost) * 100) / 100;
  const marginPct = ex ? Math.round((margin / ex) * 1000) / 10 : 0;
  return { ex, gst, inc, cost, margin, marginPct };
}
