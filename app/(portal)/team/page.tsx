"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { count } from "@/lib/format";
import { useSession } from "@/lib/session";
import { Empty, ErrorNote, Modal, PageHeader } from "@/components/ui";

type Row = { id: number; name: string; email: string; phone: string | null; role: "ADMIN" | "RA"; parent_id: number; parent_name: string | null; is_active: boolean; clients: number; ras: number };

export default function Team() {
  const { user, reloadRas } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<null | { role: "ADMIN" | "RA"; name: string; email: string; phone: string; password: string; admin_id: string }>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reset, setReset] = useState<Row | null>(null);
  const [pw, setPw] = useState("");

  useEffect(() => { if (user.role === "RA") router.replace("/dashboard"); }, [user, router]);
  const load = useCallback(() => { api<Row[]>("/users").then(setRows).catch((e) => setError(e.message)); }, []);
  useEffect(load, [load]);

  const admins = (rows ?? []).filter((r) => r.role === "ADMIN");
  const ras = (rows ?? []).filter((r) => r.role === "RA");
  const open = (role: "ADMIN" | "RA") => { setFormError(null); setForm({ role, name: "", email: "", phone: "", password: "", admin_id: admins[0] ? String(admins[0].id) : "" }); };

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setFormError(null);
    try {
      await api("/users", { method: "POST", json: { ...form, phone: form.phone || null, admin_id: form.role === "RA" && user.role === "MASTER" ? Number(form.admin_id) : null } });
      setForm(null); load(); reloadRas();
    } catch (err: any) { setFormError(err.message); }
  }
  async function patch(id: number, json: object) {
    setError(null);
    try { await api(`/users/${id}`, { method: "PATCH", json }); load(); reloadRas(); } catch (e: any) { setError(e.message); }
  }

  const table = (list: Row[], kind: "ADMIN" | "RA") => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="th">Name</th><th className="th">Email</th><th className="th">Phone</th>
          {kind === "RA" && user.role === "MASTER" && <th className="th">Reports to</th>}
          <th className="th num">{kind === "ADMIN" ? "Agents" : "Clients"}</th><th className="th">Status</th><th className="th" />
        </tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="hover:bg-paper/60">
              <td className="td font-medium">{kind === "RA" ? <Link className="text-navy-700 hover:underline" href={`/clients?ra=${r.id}`}>{r.name}</Link> : r.name}</td>
              <td className="td text-ink-soft">{r.email}</td><td className="td text-ink-soft">{r.phone ?? "–"}</td>
              {kind === "RA" && user.role === "MASTER" && (
                <td className="td">
                  <select className="input h-8 w-auto" value={r.parent_id} aria-label={`Admin for ${r.name}`} onChange={(e) => patch(r.id, { admin_id: Number(e.target.value) })}>
                    {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
              )}
              <td className="td num">{count(kind === "ADMIN" ? r.ras : r.clients)}</td>
              <td className="td"><span className={`chip ${r.is_active ? "bg-up/10 text-up" : "bg-paper text-ink-faint"}`}>{r.is_active ? "Active" : "Disabled"}</span></td>
              <td className="td whitespace-nowrap text-right text-xs">
                <button className="text-navy-700 hover:underline" onClick={() => { setPw(""); setFormError(null); setReset(r); }}>Reset password</button>
                <button className="ml-3 text-ink-soft hover:underline" onClick={() => patch(r.id, { is_active: !r.is_active })}>{r.is_active ? "Disable" : "Enable"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <PageHeader title="Team" sub={user.role === "MASTER" ? "Admins and their referral agents" : "Your referral agents"}>
        {user.role === "MASTER" && <button className="btn-ghost" onClick={() => open("ADMIN")}>Add admin</button>}
        <button className="btn-primary" disabled={user.role === "MASTER" && admins.length === 0} title={user.role === "MASTER" && admins.length === 0 ? "Create an admin first" : undefined} onClick={() => open("RA")}>Add referral agent</button>
      </PageHeader>
      <ErrorNote error={error} />
      {user.role === "MASTER" && (
        <section className="card mb-6 overflow-hidden">
          <div className="px-4 py-3 text-sm font-semibold">Admins</div>
          {!rows ? <Empty>Loading…</Empty> : admins.length ? table(admins, "ADMIN") : <Empty>No admins yet. Add one, then they (or you) can add referral agents.</Empty>}
        </section>
      )}
      <section className="card overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold">Referral agents</div>
        {!rows ? <Empty>Loading…</Empty> : ras.length ? table(ras, "RA") : <Empty>No referral agents yet.</Empty>}
      </section>

      {form && (
        <Modal title={form.role === "ADMIN" ? "Add admin" : "Add referral agent"} onClose={() => setForm(null)}>
          <form onSubmit={create} className="space-y-3">
            <ErrorNote error={formError} />
            <div><label className="label" htmlFor="f-name">Full name</label><input id="f-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="f-email">Email (used to sign in)</label><input id="f-email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label" htmlFor="f-phone">Phone (optional)</label><input id="f-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            {form.role === "RA" && user.role === "MASTER" && (
              <div><label className="label" htmlFor="f-admin">Reports to admin</label>
                <select id="f-admin" className="input" required value={form.admin_id} onChange={(e) => setForm({ ...form, admin_id: e.target.value })}>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select></div>
            )}
            <div><label className="label" htmlFor="f-pw">Temporary password (min 8 characters)</label><input id="f-pw" className="input font-mono" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary">Create</button></div>
          </form>
        </Modal>
      )}
      {reset && (
        <Modal title={`Reset password · ${reset.name}`} onClose={() => setReset(null)}>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setFormError(null);
            try { await api(`/users/${reset.id}`, { method: "PATCH", json: { password: pw } }); setReset(null); } catch (err: any) { setFormError(err.message); }
          }}>
            <ErrorNote error={formError} />
            <div><label className="label" htmlFor="r-pw">New password (min 8 characters)</label><input id="r-pw" className="input font-mono" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-ghost" onClick={() => setReset(null)}>Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
