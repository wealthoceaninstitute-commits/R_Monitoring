"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, qs } from "@/lib/api";
import { compact, count, dateLabel, money, monthLabel, pct } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader, RaSelect, Stat } from "@/components/ui";

const MIX = [["equity", "Equity", "bg-navy-700"], ["hybrid", "Hybrid", "bg-navy-500"], ["debt", "Debt", "bg-[#7f93e6]"], ["others", "Others", "bg-[#b9c3f0]"], ["physical", "Physical", "bg-[#d9def5]"]] as const;

export default function Dashboard() {
  const { user, period, ras, setPeriod } = useSession();
  const [ra, setRa] = useState("");
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api("/dashboard" + qs({ period, ra_id: ra })).then(setD).catch((e) => setError(e.message));
  }, [period, ra]);

  if (error) return <ErrorNote error={error} />;
  if (!d) return <Empty>Loading…</Empty>;
  const t = d.totals;
  const who = ra === "unassigned" ? "Unassigned clients" : ra ? ras.find((r) => String(r.id) === ra)?.name : user.role === "RA" ? "Your clients" : user.role === "ADMIN" ? "Your team" : "Whole book";

  if (!d.period) return (
    <>
      <PageHeader title="Dashboard" />
      <div className="card"><Empty>No reports have been uploaded yet.{user.role !== "RA" && <> <Link className="text-navy-700 underline" href="/uploads">Upload this month&apos;s files</Link> to begin.</>}</Empty></div>
    </>
  );

  return (
    <>
      <PageHeader title="Dashboard" sub={<>{who} · {monthLabel(d.period)}{t.as_on ? ` · AUM as on ${dateLabel(t.as_on)}` : ""}</>}>
        {user.role !== "RA" && <RaSelect ras={ras} value={ra} onChange={setRa} />}
      </PageHeader>

      {user.role === "MASTER" && d.unmatched_transactions > 0 && (
        <Link href="/transactions?unmatched=1" className="mb-4 block rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 text-sm text-warn">
          {d.unmatched_transactions} transactions could not be linked to a single client (same-name investors). Review them →
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total AUM" value={compact(t.aum)} hint={money(t.aum)} />
        <Stat label="Invested" value={compact(t.invested)} hint={money(t.invested)} />
        <Stat label="Gain / loss" value={compact(t.gain)} tone={t.gain >= 0 ? "up" : "down"} hint={`${pct(t.gain, t.invested)} on invested`} />
        <Stat label="Clients" value={count(t.clients)} hint={`${count(t.active_clients)} holding this month`} />
        <Stat label="Purchases" value={compact(t.purchase.amount)} tone="up" hint={`${count(t.purchase.count)} completed`} />
        <Stat label="Redemptions" value={compact(t.redemption.amount)} hint={`${count(t.redemption.count)} payouts`} />
        <Stat label="Rejected" value={compact(t.rejection.amount)} tone={t.rejection.count ? "down" : undefined} hint={`${count(t.rejection.count)} failed`} />
        <Stat label="Net flow" value={compact(t.purchase.amount - t.redemption.amount)} tone={t.purchase.amount - t.redemption.amount >= 0 ? "up" : "down"} hint="Purchases − redemptions" />
      </div>

      {t.aum > 0 && (
        <div className="card mt-4 p-4">
          <div className="mb-2 text-xs font-medium text-ink-soft">AUM by asset class</div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-paper" role="img" aria-label="AUM split by asset class">
            {MIX.map(([k, , c]) => t.mix[k] > 0 && <div key={k} className={c} style={{ width: `${(t.mix[k] / t.aum) * 100}%` }} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {MIX.map(([k, label, c]) => t.mix[k] > 0 && (
              <span key={k} className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-sm ${c}`} />{label}<b className="font-mono font-medium">{compact(t.mix[k])}</b><span className="text-ink-faint">{pct(t.mix[k], t.aum)}</span></span>
            ))}
          </div>
        </div>
      )}

      {d.by_ra.length > 0 && !ra && (
        <section className="card mt-6 overflow-hidden">
          <div className="px-4 py-3 text-sm font-semibold">Referral agents</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="th">Agent</th>{user.role === "MASTER" && <th className="th">Admin</th>}
                <th className="th num">Clients</th><th className="th num">AUM</th><th className="th num">Share</th>
                <th className="th num">Purchases</th><th className="th num">Redemptions</th><th className="th num">Rejected</th>
              </tr></thead>
              <tbody>
                {d.by_ra.map((r: any) => (
                  <tr key={r.ra_id ?? "u"} className="hover:bg-paper/60">
                    <td className="td font-medium">
                      <Link className="text-navy-700 hover:underline" href={`/clients?ra=${r.ra_id ?? "unassigned"}`}>{r.name}</Link>
                      {!r.is_active && <span className="chip ml-2 bg-paper text-ink-faint">disabled</span>}
                    </td>
                    {user.role === "MASTER" && <td className="td text-ink-soft">{r.admin_name ?? "–"}</td>}
                    <td className="td num">{count(r.clients)}</td><td className="td num">{money(r.aum)}</td>
                    <td className="td num text-ink-faint">{pct(r.aum, d.by_ra.reduce((s: number, x: any) => s + x.aum, 0))}</td>
                    <td className="td num">{money(r.purchase)}</td><td className="td num">{money(r.redemption)}</td><td className="td num">{money(r.rejection)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold">Month-wise</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Month</th><th className="th num">Clients holding</th><th className="th num">Invested</th><th className="th num">AUM</th>
              <th className="th num">Purchases</th><th className="th num">Redemptions</th><th className="th num">Rejected</th>
            </tr></thead>
            <tbody>
              {d.by_month.map((m: any) => (
                <tr key={m.period} className={`cursor-pointer hover:bg-paper/60 ${m.period === d.period ? "bg-navy-50/50" : ""}`} onClick={() => setPeriod(m.period)}>
                  <td className="td font-medium">{monthLabel(m.period)}</td>
                  <td className="td num">{m.aum === null ? "–" : count(m.active_clients)}</td>
                  <td className="td num">{money(m.invested)}</td><td className="td num">{money(m.aum)}</td>
                  <td className="td num">{money(m.purchase.amount)} <span className="text-ink-faint">({m.purchase.count})</span></td>
                  <td className="td num">{money(m.redemption.amount)} <span className="text-ink-faint">({m.redemption.count})</span></td>
                  <td className="td num">{money(m.rejection.amount)} <span className="text-ink-faint">({m.rejection.count})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-2 text-xs text-ink-faint">A dash under AUM means no AUM report was uploaded for that month.</p>
      </section>
    </>
  );
}
