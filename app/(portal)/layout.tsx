"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/api";
import { dateLabel, monthLabel } from "@/lib/format";
import { Ra, SessionContext, User } from "@/lib/session";

const NAV = [
  { href: "/dashboard", label: "Dashboard", roles: ["MASTER", "ADMIN", "RA"] },
  { href: "/clients", label: "Clients", roles: ["MASTER", "ADMIN", "RA"] },
  { href: "/transactions", label: "Transactions", roles: ["MASTER", "ADMIN", "RA"] },
  { href: "/team", label: "Team", roles: ["MASTER", "ADMIN"] },
  { href: "/uploads", label: "Monthly upload", roles: ["MASTER", "ADMIN"] },
];
const ROLE_LABEL = { MASTER: "Master", ADMIN: "Admin", RA: "Referral agent" } as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState<string | null>(null);
  const [aumDates, setAumDates] = useState<string[]>([]);
  const [asOn, setAsOn] = useState<string | null>(null);
  const [ras, setRas] = useState<Ra[]>([]);

  const reloadRas = useCallback(() => { api<Ra[]>("/ras").then(setRas).catch(() => {}); }, []);
  const reloadPeriods = useCallback(() => {
    api<{ periods: string[]; latest: string | null; aum_dates: string[]; latest_aum: string | null }>("/periods").then((p) => {
      setPeriods(p.periods);
      setPeriod((cur) => (cur && p.periods.includes(cur) ? cur : p.latest));
      setAumDates(p.aum_dates);
      setAsOn((cur) => (cur && p.aum_dates.includes(cur) ? cur : p.latest_aum));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api<User>("/auth/me").then((u) => { setUser(u); reloadRas(); reloadPeriods(); }).catch(() => {});
  }, [router, reloadRas, reloadPeriods]);
  // pick up new months right after an upload
  useEffect(() => { if (user && path !== "/uploads") reloadPeriods(); }, [path, user, reloadPeriods]);

  if (!user) return <div className="grid min-h-screen place-items-center text-sm text-ink-faint">Loading…</div>;
  const nav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <SessionContext.Provider value={{ user, periods, period, setPeriod, aumDates, asOn, setAsOn, ras, reloadRas, reloadPeriods }}>
      <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
        <aside className="flex flex-col bg-navy-900 text-white lg:sticky lg:top-0 lg:h-screen">
          <div className="px-5 pb-2 pt-5 text-sm font-semibold tracking-wide">Referral Portal</div>
          <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:py-4">
            {nav.map((n) => {
              const on = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${on ? "bg-white/12 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="text-xs text-white/50">{ROLE_LABEL[user.role]}</div>
            <button className="mt-3 text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
              onClick={() => { setToken(null); router.replace("/login"); }}>Sign out</button>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur lg:px-8">
            <div className="text-xs text-ink-faint lg:hidden">{user.name} · {ROLE_LABEL[user.role]}</div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <label htmlFor="ason" className="text-xs font-medium text-ink-soft">AUM as on</label>
              <select id="ason" className="input w-auto" value={asOn ?? ""} onChange={(e) => setAsOn(e.target.value)} disabled={!aumDates.length}>
                {!aumDates.length && <option value="">No AUM yet</option>}
                {aumDates.map((d) => <option key={d} value={d}>{dateLabel(d)}</option>)}
              </select>
              <label htmlFor="period" className="ml-2 text-xs font-medium text-ink-soft">Transactions</label>
              <select id="period" className="input w-auto" value={period ?? ""} onChange={(e) => setPeriod(e.target.value)} disabled={!periods.length}>
                {!periods.length && <option value="">No transactions yet</option>}
                {periods.map((p) => <option key={p} value={p}>{monthLabel(p)}</option>)}
              </select>
              <button className="btn-ghost lg:hidden" onClick={() => { setToken(null); router.replace("/login"); }}>Sign out</button>
            </div>
          </header>
          <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
