const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const KEY = "rp_token";

export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string | null) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {} };

export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body = init.body;
  if (init.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(init.json); }
  let res: Response;
  try { res = await fetch(BASE + path, { ...init, headers, body }); }
  catch { throw new Error("Cannot reach the server. Check your connection."); }
  if (res.status === 401 && !path.startsWith("/auth/login")) {
    setToken(null);
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join(", ") : `Request failed (${res.status})`);
  }
  return data as T;
}

export const qs = (o: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
};
