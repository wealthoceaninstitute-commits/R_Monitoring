"use client";
import { createContext, useContext } from "react";

export type Role = "MASTER" | "ADMIN" | "RA";
export type User = { id: number; name: string; email: string; role: Role };
export type Ra = { id: number; name: string; admin_id: number | null; admin_name: string | null; is_active: boolean };

export type Session = {
  user: User;
  periods: string[];
  period: string | null;
  setPeriod: (p: string) => void;
  ras: Ra[];
  reloadRas: () => void;
};

export const SessionContext = createContext<Session | null>(null);
export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession outside portal layout");
  return s;
}
