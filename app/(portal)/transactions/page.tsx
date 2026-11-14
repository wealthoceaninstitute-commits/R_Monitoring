"use client";
import { useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { count, money, monthLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader, RaSelect } from "@/components/ui";
import { TxnTable } from "@/components/TxnTable";

const TABS = [["PURCHASE", "Completed purchases"], ["REDEMPTION", "Redemptions"], ["REJECTION", "Rejected"]] as const;
const PAGE = 200;

export default function Transactions() {
  const { user, period, ras } = useSession();
  const [kind, setKind] = useState<string>("PURCHASE");
  const [ra, setRa] = useState("");
  const [q, setQ] = useState("");
  const [unmatched, setUnmatched] = useState(false);
  const [page, setPage] = useState(0);
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (new URLSearchParams(window.location.search).get("unmatched")) setUnmatched(true); }, []);
  useEffect(() => { setPage(0); }, [kind, ra, q, period, unmatched]);
  useEffect(() => {
    setError(null);
    const t = setTimeout(() => {
      api("/transactions" + qs(unmatched ? { unmatched: true, limit: PAGE, offset: page * PAGE } : { kind, period, ra_id: ra, q, limit: PAGE, offset: page * PAGE }))
        .then(setD).catch((e) => setError(e.message));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [kind, ra, q, period, unmatched, page]);

  return (
    <>
      <PageHeader title="Transactions" sub={unmatched ? "Not linked to a client – all months" : d ? <>{count(d.total)} transactions · {money(d.amount)} · {monthLabel(period)}</> : monthLabel(period)}>
        {!unmatched && <input className="input w-56" placeholder="Search client or scheme" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search transactions" />}
        {!unmatched && user.role !== "RA" && <RaSelect ras={ras} value={ra} onChange={setRa} />}
        {user.role === "MASTER" && <button className={unmatched ? "btn-primary" : "btn-ghost"} onClick={() => setUnmatched(!unmatched)}>{unmatched ? "Back to all" : "Unlinked"}</button>}
      </PageHeader>
      <ErrorNote error={error} />
      {unmatched ? (
        <p className="mb-3 rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 text-sm text-warn">
          These rows belong to investors who share a name. Open each same-name client from the Clients page and set the PAN shown here; the rows link themselves.
        </p>
      ) : (
        <div className="mb-3 flex gap-1" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${kind === k ? "bg-navy-700 text-white" : "text-ink-soft hover:bg-white"}`}>{label}</button>
          ))}
        </div>
      )}
      <div className="card overflow-hidden">
        {!d ? <Empty>Loading…</Empty> : d.items.length === 0 ? <Empty>Nothing for this month.</Empty> : <TxnTable items={d.items} showRa={user.role !== "RA" && !unmatched} />}
        {d && d.total > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-soft">
            <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, d.total)} of {count(d.total)}</span>
            <span className="flex gap-2">
              <button className="btn-ghost h-8" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn-ghost h-8" disabled={(page + 1) * PAGE >= d.total} onClick={() => setPage(page + 1)}>Next</button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
