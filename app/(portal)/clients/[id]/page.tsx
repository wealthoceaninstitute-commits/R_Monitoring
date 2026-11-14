"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { compact, money, monthLabel, pct } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader, Stat } from "@/components/ui";
import { TxnTable } from "@/components/TxnTable";

const TABS = [["", "All"], ["PURCHASE", "Purchases"], ["REDEMPTION", "Redemptions"], ["REJECTION", "Rejected"]] as const;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, period } = useSession();
  const [c, setC] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("");
  const [pan, setPan] = useState<string | null>(null);

  const load = useCallback(() => { api(`/investors/${id}`).then(setC).catch((e) => setError(e.message)); }, [id]);
  useEffect(load, [load]);

  async function savePan() {
    setError(null);
    try { await api(`/investors/${id}`, { method: "PATCH", json: { pan } }); setPan(null); load(); }
    catch (e: any) { setError(e.message); }
  }

  if (!c) return error ? <ErrorNote error={error} /> : <Empty>Loading…</Empty>;
  const m = c.months.find((x: any) => x.period === period) ?? c.months.find((x: any) => x.active) ?? c.months[0];
  const txns = c.transactions.filter((t: any) => !tab || t.kind === tab);

  return (
    <>
      <Link href="/clients" className="mb-3 inline-block text-xs text-ink-soft hover:text-navy-700">← All clients</Link>
      <PageHeader title={c.name} sub={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>PAN <b className="font-mono font-medium text-ink">{c.pan ?? "not known"}</b></span>
          {user.role !== "RA" && pan === null && <button className="text-navy-700 underline" onClick={() => setPan(c.pan ?? "")}>{c.pan ? "edit" : "add"}</button>}
          {user.role !== "RA" && <span>· Agent <b className="font-medium text-ink">{c.ra_name ?? "Unassigned"}</b></span>}
        </span>} />
      <ErrorNote error={error} />
      {pan !== null && (
        <div className="card mb-4 flex flex-wrap items-end gap-2 p-4">
          <div><label className="label" htmlFor="pan">PAN</label>
            <input id="pan" className="input w-48 font-mono uppercase" maxLength={10} value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} /></div>
          <button className="btn-primary" onClick={savePan}>Save</button>
          <button className="btn-ghost" onClick={() => setPan(null)}>Cancel</button>
          <p className="w-full text-xs text-ink-faint">The AUM report has no PAN. Setting it here links this client&apos;s transactions when two clients share a name.</p>
        </div>
      )}

      {m && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`AUM · ${monthLabel(m.period)}`} value={compact(m.aum_total)} hint={money(m.aum_total)} />
          <Stat label="Invested" value={compact(m.inv_total)} hint={money(m.inv_total)} />
          <Stat label="Gain / loss" value={compact(m.gain)} tone={m.gain >= 0 ? "up" : "down"} hint={pct(m.gain, m.inv_total)} />
          <Stat label="Month activity" value={compact(m.purchase.amount - m.redemption.amount)} hint={`${m.purchase.count} bought · ${m.redemption.count} redeemed · ${m.rejection.count} rejected`} />
        </div>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold">Month-wise</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Month</th><th className="th num">Invested</th><th className="th num">AUM</th><th className="th num">Equity</th><th className="th num">Hybrid</th><th className="th num">Debt</th><th className="th num">Others</th>
              <th className="th num">Purchases</th><th className="th num">Redeemed</th><th className="th num">Rejected</th>
            </tr></thead>
            <tbody>
              {c.months.map((x: any) => (
                <tr key={x.period} className={x.period === period ? "bg-navy-50/50" : ""}>
                  <td className="td font-medium">{monthLabel(x.period)}</td>
                  {x.active ? (<>
                    <td className="td num">{money(x.inv_total)}</td><td className="td num font-medium">{money(x.aum_total)}</td>
                    <td className="td num">{money(x.aum_equity)}</td><td className="td num">{money(x.aum_hybrid)}</td><td className="td num">{money(x.aum_debt)}</td><td className="td num">{money(x.aum_others + x.aum_physical)}</td>
                  </>) : <td className="td text-center text-xs text-ink-faint" colSpan={6}>not in that month&apos;s AUM report</td>}
                  <td className="td num">{x.purchase.count ? money(x.purchase.amount) : "–"}</td>
                  <td className="td num">{x.redemption.count ? money(x.redemption.amount) : "–"}</td>
                  <td className={`td num ${x.rejection.count ? "text-down" : ""}`}>{x.rejection.count ? money(x.rejection.amount) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-semibold">Transactions</div>
          <div className="flex gap-1" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${tab === k ? "bg-navy-700 text-white" : "text-ink-soft hover:bg-paper"}`}>{label}</button>
            ))}
          </div>
        </div>
        {txns.length ? <TxnTable items={txns} showClient={false} /> : <Empty>No transactions.</Empty>}
      </section>
    </>
  );
}
