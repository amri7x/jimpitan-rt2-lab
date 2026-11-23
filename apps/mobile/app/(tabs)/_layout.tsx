import { Tabs } from "expo-router";
import { useSession } from "../../src/providers/SessionProvider";
export default function TabsLayout() { const { session } = useSession(); return <Tabs><Tabs.Screen name="home" options={{ title: "Input" }} /><Tabs.Screen name="rekap" options={{ title: "Rekap" }} /><Tabs.Screen name="keuangan" options={{ title: "Keuangan" }} /><Tabs.Screen name="settings" options={{ title: "Admin", href: session?.isAdmin ? undefined : null }} /></Tabs>; }
