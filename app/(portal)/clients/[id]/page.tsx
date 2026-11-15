"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { compact, dateLabel, money, monthLabel, pct } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader, Stat } from "@/components/ui";
import { TxnTable } from "@/components/TxnTable";

const TABS = [["", "All"], ["PURCHASE", "Purchases"], ["REDEMPTION", "Redemptions"], ["REJECTION", "Rejected"]] as const;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, period, asOn } = useSession();
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
  const snap = c.snapshots.find((x: any) => x.as_on === asOn);
  const flow = c.months.find((x: any) => x.period === period);
  const z = { amount: 0, count: 0 };
  const f = flow ?? { purchase: z, redemption: z, rejection: z };
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

      {!snap && (
        <p className="mb-4 rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 text-sm text-warn">
          {c.snapshots.length ? `No holding in the AUM report as on ${dateLabel(asOn)}.` : "Not invested yet: this client is not in any AUM report."}
          {c.registrations.length > 0 && ` Registered on E-Wealth (Ref ${c.registrations.map((g: any) => g.ref_no).join(", ")}).`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={asOn ? `AUM · ${dateLabel(asOn)}` : "AUM"} value={compact(snap?.aum_total ?? 0)} hint={money(snap?.aum_total ?? 0)} />
        <Stat label="Invested" value={compact(snap?.inv_total ?? 0)} hint={money(snap?.inv_total ?? 0)} />
        <Stat label="Gain / loss" value={compact(snap?.gain ?? 0)} tone={(snap?.gain ?? 0) >= 0 ? "up" : "down"} hint={pct(snap?.gain ?? 0, snap?.inv_total ?? 0)} />
        <Stat label={`Activity · ${monthLabel(period)}`} value={compact(f.purchase.amount - f.redemption.amount)} hint={`${f.purchase.count} bought · ${f.redemption.count} redeemed · ${f.rejection.count} rejected`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className="card overflow-hidden">
          <div className="px-4 py-3 text-sm font-semibold">AUM by date</div>
          {c.snapshots.length === 0 ? <Empty>Not in any AUM report yet.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="th">As on</th><th className="th num">Invested</th><th className="th num">AUM</th><th className="th num">Gain</th>
                  <th className="th num">Equity</th><th className="th num">Hybrid</th><th className="th num">Debt</th><th className="th num">Others</th>
                </tr></thead>
                <tbody>
                  {c.snapshots.map((x: any) => (
                    <tr key={x.as_on} className={x.as_on === asOn ? "bg-navy-50/50" : ""}>
                      <td className="td whitespace-nowrap font-medium">{dateLabel(x.as_on)}</td>
                      <td className="td num">{money(x.inv_total)}</td><td className="td num font-medium">{money(x.aum_total)}</td>
                      <td className={`td num ${x.gain < 0 ? "text-down" : x.gain > 0 ? "text-up" : ""}`}>{money(x.gain)}</td>
                      <td className="td num">{money(x.aum_equity)}</td><td className="td num">{money(x.aum_hybrid)}</td><td className="td num">{money(x.aum_debt)}</td><td className="td num">{money(x.aum_others + x.aum_physical)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="card overflow-hidden">
          <div className="px-4 py-3 text-sm font-semibold">Transactions by month</div>
          {c.months.length === 0 ? <Empty>No transactions.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Month</th><th className="th num">Purchases</th><th className="th num">Redeemed</th><th className="th num">Rejected</th></tr></thead>
                <tbody>
                  {c.months.map((x: any) => (
                    <tr key={x.period} className={x.period === period ? "bg-navy-50/50" : ""}>
                      <td className="td whitespace-nowrap font-medium">{monthLabel(x.period)}</td>
                      <td className="td num">{x.purchase.count ? money(x.purchase.amount) : "–"}</td>
                      <td className="td num">{x.redemption.count ? money(x.redemption.amount) : "–"}</td>
                      <td className={`td num ${x.rejection.count ? "text-down" : ""}`}>{x.rejection.count ? money(x.rejection.amount) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

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
