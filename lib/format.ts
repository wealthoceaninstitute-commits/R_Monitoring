const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const signed = (n: number, f: Intl.NumberFormat) => (n < 0 ? "-₹" : "₹") + f.format(Math.abs(n));
export const money = (n?: number | null) => (n === null || n === undefined ? "–" : signed(Math.round(n), inr));
export const money2 = (n?: number | null) => (n === null || n === undefined ? "–" : signed(n, inr2));
export const count = (n?: number | null) => inr.format(n ?? 0);

/** 66754308 -> "₹6.68 Cr", 1250000 -> "₹12.50 L" */
export function compact(n?: number | null) {
  if (n === null || n === undefined) return "–";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
  return s + "₹" + inr.format(Math.round(a));
}

export const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "–");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (p?: string | null) => (p ? `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}` : "–");
export const dateLabel = (d?: string | null) => (d ? `${d.slice(8, 10)} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : "–");
