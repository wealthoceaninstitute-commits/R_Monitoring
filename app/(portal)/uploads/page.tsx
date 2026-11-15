"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { count, dateLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, PageHeader } from "@/components/ui";

const TYPE: Record<string, string> = {
  AUM: "Investor Wise AUM", PURCHASE: "Processed transactions", REJECTION: "Transaction rejections",
  REDEMPTION: "Redemption payouts", REGISTRATION: "Registered clients (E-Wealth)",
};

export default function Uploads() {
  const { user, reloadPeriods } = useSession();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [asOn, setAsOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => { if (user.role === "RA") router.replace("/dashboard"); }, [user, router]);
  const load = useCallback(() => { api("/uploads").then(setHistory).catch((e) => setError(e.message)); }, []);
  useEffect(load, [load]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    Array.from(list).forEach((f) => { if (f.name.toLowerCase().endsWith(".xlsx") && !next.some((x) => x.name === f.name)) next.push(f); });
    setFiles(next);
  };

  async function submit() {
    setBusy(true); setError(null); setResults(null); setNote(null);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    if (asOn) fd.append("as_on", asOn);
    try { setResults(await api("/uploads", { method: "POST", body: fd })); setFiles([]); setAsOn(""); load(); reloadPeriods(); }
    catch (e: any) { setError(e.message); }
    setBusy(false);
  }

  async function remove(h: any) {
    setBusy(true); setError(null); setNote(null); setResults(null);
    try {
      const r = await api(`/uploads/${h.id}`, { method: "DELETE" });
      setNote(`Deleted “${h.filename}”: ${count(r.rows_removed)} rows removed${r.clients_removed ? `, ${count(r.clients_removed)} clients with no other data removed` : ""}.`);
      load(); reloadPeriods();
    } catch (e: any) { setError(e.message); }
    setConfirm(null); setBusy(false);
  }

  return (
    <>
      <PageHeader title="Monthly upload" sub="Drop the NJ reports together. Each file is recognised from its title; uploading a file twice never double-counts." />
      <ErrorNote error={error} />
      <div className="card p-5">
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-navy-500 bg-navy-50" : "border-line"}`}>
          <p className="text-sm font-medium">Drag the .xlsx files here</p>
          <p className="mt-1 text-xs text-ink-faint">Investor Wise AUM · Processed Transaction Detail · Transaction Rejection · MF Redemption Payout · E-Wealth Reg. Status</p>
          <button className="btn-ghost mt-4" onClick={() => input.current?.click()}>Choose files</button>
          <input ref={input} type="file" accept=".xlsx" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>
        {files.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line text-sm">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate">{f.name}</span>
                <button className="shrink-0 text-xs text-ink-soft hover:text-down" onClick={() => setFiles(files.filter((x) => x !== f))}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="u-ason">AUM as-on date (optional)</label>
            <input id="u-ason" type="date" className="input w-48" value={asOn} onChange={(e) => setAsOn(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={!files.length || busy} onClick={submit}>{busy ? "Processing…" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}</button>
          <p className="basis-full text-xs text-ink-faint">Leave the date empty to use the AUM report&apos;s own &ldquo;As on&rdquo; date. Every AUM date is kept separately, so you can upload one whenever you want to review; uploading the same date again replaces only that date. Transactions are filed under their own transaction date.</p>
        </div>
      </div>

      {note && <p className="mt-4 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft" role="status">{note}</p>}
      {results && (
        <div className="card mt-4 divide-y divide-line">
          {results.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className={`chip ${r.ok ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>{r.ok ? "Imported" : "Failed"}</span>
              <span className="font-medium">{r.ok ? TYPE[r.report_type] : r.filename}</span>
              {r.ok ? <span className="text-ink-soft">{count(r.rows_new)} new of {count(r.rows_total)} rows{r.as_on ? ` · as on ${dateLabel(r.as_on)}` : ""}{r.investors_created ? ` · ${r.investors_created} new clients` : ""}{r.rows_unmatched ? ` · ${r.rows_unmatched} need linking` : ""}</span>
                : <span className="text-down">{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold">Upload history</div>
        {!history ? <Empty>Loading…</Empty> : history.length === 0 ? <Empty>Nothing uploaded yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">When</th><th className="th">Report</th><th className="th">File</th><th className="th num">Rows</th><th className="th num">New</th><th className="th num">Unlinked</th><th className="th">By</th><th className="th" /></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className={confirm === h.id ? "bg-down/5" : ""}>
                    <td className="td whitespace-nowrap text-ink-soft">{new Date(h.uploaded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="td whitespace-nowrap font-medium">{TYPE[h.report_type] ?? h.report_type}{h.as_on ? <span className="font-normal text-ink-soft"> · as on {dateLabel(h.as_on)}</span> : ""}</td>
                    <td className="td max-w-[180px] truncate text-xs text-ink-soft" title={h.filename}>{h.filename}</td>
                    <td className="td num">{count(h.rows_total)}</td><td className="td num">{count(h.rows_new)}</td><td className="td num">{h.rows_unmatched || "–"}</td>
                    <td className="td text-ink-soft">{h.uploaded_by}</td>
                    <td className="td whitespace-nowrap text-right text-xs">
                      {!h.can_delete ? null : confirm === h.id ? (
                        <>
                          <span className="mr-2 text-down">Sure?</span>
                          <button className="font-medium text-down hover:underline" disabled={busy} onClick={() => remove(h)}>Yes, delete</button>
                          <button className="ml-3 text-ink-soft hover:underline" onClick={() => setConfirm(null)}>Cancel</button>
                        </>
                      ) : <button className="text-ink-soft hover:text-down hover:underline" onClick={() => setConfirm(h.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-4 py-2 text-xs text-ink-faint">Deleting a file removes only the rows that file added. Rows it skipped as duplicates belong to the earlier upload and stay.</p>
      </section>
    </>
  );
}
