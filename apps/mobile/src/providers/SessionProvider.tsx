import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { getActiveMonthKey, getMonthPaths, SESSION_HEARTBEAT_MS, SESSION_TIMEOUT_MS } from "@jimpitan/core";
import { nativeAuth, nativeDatabase } from "../services/firebase";

type Session = { name: string; uid: string; isAdmin: boolean } | null;
type SessionValue = { session: Session; startPetugas(name: string): Promise<void>; signInAdmin(email: string, password: string): Promise<void>; signOut(): Promise<void>; releaseLock(): Promise<void> };
const Context = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const activeLock = useRef<string | null>(null);
  const month = getActiveMonthKey();
  const releaseLock = useCallback(async () => { if (activeLock.current) { await nativeDatabase.ref(activeLock.current).remove(); activeLock.current = null; } }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state !== "active") void releaseLock(); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!session) return;
    const sessionPath = `${getMonthPaths(month).sessions}/${session.uid}`;
    const write = () => nativeDatabase.ref(sessionPath).set({ nama: session.name, lastActiveAt: Date.now(), isAdmin: session.isAdmin });
    void write();
    const timer = setInterval(() => void write(), SESSION_HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [month, session]);
  const startPetugas = useCallback(async (name: string) => {
    const cleanName = name.trim(); if (!cleanName) throw new Error("Nama petugas wajib diisi.");
    const credential = await nativeAuth.signInAnonymously();
    const sessions = (await nativeDatabase.ref(getMonthPaths(month).sessions).once("value")).val() as Record<string, { lastActiveAt?: number }> | null;
    const active = Object.entries(sessions ?? {}).filter(([uid, item]) => uid !== credential.user.uid && typeof item.lastActiveAt === "number" && Date.now() - item.lastActiveAt < SESSION_TIMEOUT_MS);
    if (active.length >= 4) { await nativeAuth.signOut(); throw new Error("Maksimal empat petugas aktif."); }
    setSession({ name: cleanName, uid: credential.user.uid, isAdmin: false });
  }, [month]);
  const signInAdmin = useCallback(async (email: string, password: string) => { const credential = await nativeAuth.signInWithEmailAndPassword(email, password); const admin = await nativeDatabase.ref(`admins/${credential.user.uid}`).once("value"); if (!admin.exists()) { await nativeAuth.signOut(); throw new Error("Akun ini bukan admin."); } setSession({ name: admin.val()?.nama ?? email, uid: credential.user.uid, isAdmin: true }); }, []);
  const signOut = useCallback(async () => { await releaseLock(); if (session) await nativeDatabase.ref(`${getMonthPaths(month).sessions}/${session.uid}`).remove(); await nativeAuth.signOut(); setSession(null); }, [month, releaseLock, session]);
  return <Context.Provider value={useMemo(() => ({ session, startPetugas, signInAdmin, signOut, releaseLock }), [releaseLock, session, signInAdmin, signOut, startPetugas])}>{children}</Context.Provider>;
}
export function useSession() { const value = useContext(Context); if (!value) throw new Error("SessionProvider tidak tersedia."); return value; }
