import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../../src/providers/SessionProvider";
export default function Settings() { const { session, signOut } = useSession(); if (!session?.isAdmin) { router.replace("/(tabs)/home"); return null; } return <View className="flex-1 bg-slate-50 p-4"><Text className="mb-2 text-xl font-bold">Admin / Settings</Text><Text className="mb-6">{session.name}</Text><Pressable onPress={() => void signOut().then(() => router.replace("/"), () => Alert.alert("Gagal keluar"))} className="rounded bg-red-600 p-3"><Text className="text-center font-bold text-white">Keluar</Text></Pressable></View>; }
