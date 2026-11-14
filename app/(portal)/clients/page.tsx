"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, qs } from "@/lib/api";
import { count, money, monthLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader, RaSelect } from "@/components/ui";

export default function Clients() {
  const { user, period, ras } = useSession();
  const canAssign = user.role !== "RA";
  const [ra, setRa] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[] | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const r = new URLSearchParams(window.location.search).get("ra"); if (r) setRa(r); }, []);

  const load = useCallback(() => {
    setError(null);
    api("/investors" + qs({ period, ra_id: ra })).then((r) => { setItems(r.items); setSel(new Set()); }).catch((e) => setError(e.message));
  }, [period, ra]);
  useEffect(load, [load]);

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (items ?? []).filter((i) => !k || i.name.toLowerCase().includes(k) || (i.pan ?? "").toLowerCase().includes(k));
  }, [items, q]);
  const tot = useMemo(() => shown.reduce((a, i) => ({ inv: a.inv + i.inv_total, aum: a.aum + i.aum_total, gain: a.gain + i.gain }), { inv: 0, aum: 0, gain: 0 }), [shown]);
  const allOn = shown.length > 0 && shown.every((i) => sel.has(i.id));

  async function assign() {
    setBusy(true); setError(null);
    try {
      await api("/investors/assign", { method: "POST", json: { investor_ids: [...sel], ra_id: target === "none" ? null : Number(target) } });
      setTarget(""); load();
    } catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="Clients" sub={<>{count(shown.length)} clients · AUM {money(tot.aum)} · {monthLabel(period)}</>}>
        <input className="input w-56" placeholder="Search name or PAN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
        {canAssign && <RaSelect ras={ras} value={ra} onChange={setRa} />}
      </PageHeader>
      <ErrorNote error={error} />

      {canAssign && sel.size > 0 && (
        <div className="sticky top-[61px] z-[5] mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm text-white shadow-card">
          <span className="font-medium">{sel.size} selected</span>
          <span className="text-white/50">Assign to</span>
          <select className="input w-auto min-w-[200px] text-ink" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Assign to referral agent">
            <option value="">Choose referral agent…</option>
            {ras.filter((r) => r.is_active).map((r) => <option key={r.id} value={r.id}>{r.name}{r.admin_name ? ` · ${r.admin_name}` : ""}</option>)}
            <option value="none">— Remove assignment —</option>
          </select>
          <button className="btn bg-white text-navy-900 hover:bg-navy-50" disabled={!target || busy} onClick={assign}>{busy ? "Saving…" : "Assign"}</button>
          <button className="ml-auto text-white/60 hover:text-white" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {!items ? <Empty>Loading…</Empty> : shown.length === 0 ? (
          <Empty>{items.length ? "No client matches that search." : user.role === "RA" ? "No clients have been assigned to you yet." : "No clients here yet."}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                {canAssign && <th className="th w-8"><input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(shown.map((i) => i.id)))} /></th>}
                <th className="th">Client</th><th className="th">PAN</th>{canAssign && <th className="th">Referral agent</th>}
                <th className="th num">Invested</th><th className="th num">AUM</th><th className="th num">Gain</th>
                <th className="th num">Purchases</th><th className="th num">Redeemed</th><th className="th num">Rejected</th>
              </tr></thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id} className={`hover:bg-paper/60 ${sel.has(i.id) ? "bg-navy-50/60" : ""}`}>
                    {canAssign && <td className="td"><input type="checkbox" aria-label={`Select ${i.name}`} checked={sel.has(i.id)}
                      onChange={() => setSel((s) => { const n = new Set(s); n.has(i.id) ? n.delete(i.id) : n.add(i.id); return n; })} /></td>}
                    <td className="td font-medium">
                      <Link className="text-navy-700 hover:underline" href={`/clients/${i.id}`}>{i.name}</Link>
                      {i.namesake && canAssign && <span className="chip ml-2 bg-warn/10 text-warn" title="Another client has the same name - confirm the PAN on the client page">same name</span>}
                      {!i.active && <span className="chip ml-2 bg-paper text-ink-faint">no holding</span>}
                    </td>
                    <td className="td font-mono text-xs text-ink-soft">{i.pan ?? "–"}</td>
                    {canAssign && <td className="td">{i.ra_name ?? <span className="text-ink-faint">Unassigned</span>}</td>}
                    <td className="td num">{money(i.inv_total)}</td><td className="td num font-medium">{money(i.aum_total)}</td>
                    <td className={`td num ${i.gain < 0 ? "text-down" : i.gain > 0 ? "text-up" : ""}`}>{money(i.gain)}</td>
                    <td className="td num">{i.purchases ? money(i.purchases) : "–"}</td>
                    <td className="td num">{i.redemptions ? money(i.redemptions) : "–"}</td>
                    <td className={`td num ${i.rejections ? "text-down" : ""}`}>{i.rejections ? money(i.rejections) : "–"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-paper/60 font-semibold">
                <td className="td" colSpan={canAssign ? 4 : 2}>Total</td>
                <td className="td num">{money(tot.inv)}</td><td className="td num">{money(tot.aum)}</td><td className="td num">{money(tot.gain)}</td><td className="td" colSpan={3} />
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
