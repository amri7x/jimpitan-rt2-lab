import "../global.css";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SessionProvider } from "../src/providers/SessionProvider";
import { assertDemoFirebase } from "../src/services/firebase";
export default function Layout() { const [error, setError] = useState<string | null>(null); useEffect(() => { try { assertDemoFirebase(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Firebase tidak valid."); } }, []); if (error) return <View className="flex-1 items-center justify-center bg-red-50 p-6"><Text className="text-center text-red-700">{error}</Text></View>; return <SessionProvider><Stack screenOptions={{ headerShown: false }} /></SessionProvider>; }
