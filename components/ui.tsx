"use client";
import { useEffect } from "react";
import type { Ra } from "@/lib/session";

export function PageHeader({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-soft">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: React.ReactNode; tone?: "up" | "down" | "warn" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-ink-soft">{label}</div>
      <div className={`mt-1.5 font-mono text-[22px] font-semibold tabular-nums tracking-tight ${c}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

export function RaSelect({ ras, value, onChange, allowUnassigned = true, className = "" }: {
  ras: Ra[]; value: string; onChange: (v: string) => void; allowUnassigned?: boolean; className?: string;
}) {
  return (
    <select className={`input w-auto min-w-[190px] ${className}`} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Referral agent">
      <option value="">All clients</option>
      {allowUnassigned && <option value="assigned">Assigned clients only</option>}
      {allowUnassigned && <option value="unassigned">Unassigned clients</option>}
      {ras.map((r) => (
        <option key={r.id} value={r.id}>{r.name}{r.admin_name ? ` · ${r.admin_name}` : ""}{r.is_active ? "" : " (disabled)"}</option>
      ))}
    </select>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-14 text-center text-sm text-ink-faint">{children}</div>;
}

export function ErrorNote({ error }: { error?: string | null }) {
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded-lg border border-down/20 bg-down/5 px-3 py-2 text-sm text-down">{error}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md p-5" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const kindChip: Record<string, string> = {
  PURCHASE: "bg-up/10 text-up",
  REDEMPTION: "bg-navy-50 text-navy-700",
  REJECTION: "bg-down/10 text-down",
};
