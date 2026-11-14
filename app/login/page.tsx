"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { ErrorNote } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api<{ token: string }>("/auth/login", { method: "POST", json: { email, password } });
      setToken(r.token);
      router.replace("/dashboard");
    } catch (err: any) { setError(err.message); setBusy(false); }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-sm font-semibold tracking-wide">Referral Portal</div>
        <div>
          <p className="max-w-md text-4xl font-semibold leading-[1.15] tracking-tight">Every referred investor, every rupee of AUM, month by month.</p>
          <p className="mt-4 max-w-sm text-sm text-white/60">Master, admin and referral-agent views over your NJ Wealth mutual fund book.</p>
        </div>
        <svg aria-hidden className="pointer-events-none absolute -bottom-10 left-0 w-[140%] opacity-25" viewBox="0 0 1200 220" fill="none">
          <path d="M0 120c150-60 300-60 450 0s300 60 450 0 300-60 450 0v100H0z" fill="#1833b2" />
          <path d="M0 160c150-50 300-50 450 0s300 50 450 0 300-50 450 0v60H0z" fill="#3d58d6" />
        </svg>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">Use the email and password given to you.</p>
          <ErrorNote error={error} />
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input mb-4" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input mb-6" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary h-10 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}
