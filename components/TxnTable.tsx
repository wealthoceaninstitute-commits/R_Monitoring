"use client";
import Link from "next/link";
import { dateLabel, money2 } from "@/lib/format";
import { kindChip } from "@/components/ui";

const LABEL: Record<string, string> = { PURCHASE: "Purchase", REDEMPTION: "Redemption", REJECTION: "Rejected" };

export function TxnTable({ items, showClient = true, showRa = false }: { items: any[]; showClient?: boolean; showRa?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="th">Date</th><th className="th">Status</th>{showClient && <th className="th">Client</th>}{showRa && <th className="th">Agent</th>}
          <th className="th">Scheme</th><th className="th">Folio</th><th className="th">Type</th>
          <th className="th num">Units</th><th className="th num">Amount</th><th className="th">Note</th>
        </tr></thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-paper/60">
              <td className="td whitespace-nowrap">{dateLabel(t.date)}</td>
              <td className="td"><span className={`chip ${kindChip[t.kind]}`}>{LABEL[t.kind]}</span></td>
              {showClient && <td className="td font-medium">{t.investor_id ? <Link className="text-navy-700 hover:underline" href={`/clients/${t.investor_id}`}>{t.investor}</Link> : <>{t.investor} <span className="font-mono text-xs text-ink-faint">{t.pan}</span></>}</td>}
              {showRa && <td className="td text-ink-soft">{t.ra_name ?? "–"}</td>}
              <td className="td max-w-[280px] truncate" title={t.scheme}>{t.scheme}</td>
              <td className="td font-mono text-xs text-ink-soft">{t.folio ?? "–"}</td>
              <td className="td whitespace-nowrap text-ink-soft">{t.type ?? "–"}</td>
              <td className="td num">{t.units?.toFixed(3) ?? "–"}</td>
              <td className="td num font-medium">{money2(t.amount)}</td>
              <td className="td max-w-[220px] truncate text-xs text-ink-soft" title={t.remark ?? ""}>
                {t.kind === "REJECTION" ? t.remark : t.kind === "REDEMPTION" ? (t.payout_date ? `Paid ${dateLabel(t.payout_date)}` : "Payout pending") : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
