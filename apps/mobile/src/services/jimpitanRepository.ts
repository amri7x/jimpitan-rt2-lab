import { getMonthPaths, type DailyRecapStatus, type ResidentRecord, type SetoranRecord } from "@jimpitan/core";
import { nativeDatabase } from "./firebase";

export const listen = <T,>(path: string, callback: (value: T | null) => void) => nativeDatabase.ref(path).on("value", (snap) => callback(snap.val() as T | null));
export const unlisten = (path: string) => nativeDatabase.ref(path).off();
export async function saveSetoran(monthKey: string, resident: ResidentRecord, dayIndex: number, record: SetoranRecord) {
  const paths = getMonthPaths(monthKey);
  await nativeDatabase.ref(`${paths.warga}/${resident.id}/setoran/${dayIndex}`).set(record);
}
export async function updateRecap(monthKey: string, day: number, status: DailyRecapStatus) { await nativeDatabase.ref(`${getMonthPaths(monthKey).recap}/${day}`).set(status); }
export async function saveReport(monthKey: string, date: string, payload: Record<string, unknown>) { await nativeDatabase.ref(`${getMonthPaths(monthKey).reports}/${date}`).set(payload); }
