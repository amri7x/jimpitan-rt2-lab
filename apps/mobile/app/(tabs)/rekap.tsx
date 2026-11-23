import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { getActiveMonthKey, getMonthPaths, type DailyRecapStatus } from "@jimpitan/core";
import { listen, unlisten } from "../../src/services/jimpitanRepository";
function readRecap(recap: Record<string, DailyRecapStatus | null>) { const rows: [string, DailyRecapStatus][] = []; for (const day in recap) { const item = recap[day]; if (item != null) rows.push([day, item]); } return rows.sort(([a], [b]) => Number(a) - Number(b)); }
export default function Rekap() { const month = getActiveMonthKey(); const [recap, setRecap] = useState<Record<string, DailyRecapStatus | null>>({}); useEffect(() => { const path = getMonthPaths(month).recap; listen<Record<string, DailyRecapStatus | null>>(path, (value) => setRecap(value ?? {})); return () => unlisten(path); }, [month]); return <ScrollView className="flex-1 bg-slate-50 p-4"><Text className="mb-4 text-xl font-bold">Rekap Jimpitan</Text>{readRecap(recap).map(([day, item]) => <View key={day} className="mb-2 rounded bg-white p-3"><Text>Hari {day}: <Text className="font-bold">{item.status}</Text></Text></View>)}</ScrollView>; }
