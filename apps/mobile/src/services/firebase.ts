import Constants from "expo-constants";
import { getApp } from "@react-native-firebase/app";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut } from "@react-native-firebase/auth";
import { getDatabase, get, onValue, ref, remove, set, type DataSnapshot } from "@react-native-firebase/database";
const app = getApp(); const auth = getAuth(app); const database = getDatabase(app); const PROHIBITED_PROJECT_ID = "jimpitanapp-621f8";
export function assertDemoFirebase() { const environment = Constants.expoConfig?.extra?.firebaseEnvironment; if (environment !== "demo" || !app.options.projectId || app.options.projectId === PROHIBITED_PROJECT_ID) throw new Error("Konfigurasi Firebase mobile harus memakai project DEMO yang diizinkan."); }
export const nativeAuth = { signInAnonymously: () => signInAnonymously(auth), signInWithEmailAndPassword: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password), signOut: () => signOut(auth) };
export const nativeDatabase = { ref: (path: string) => { const reference = ref(database, path); return { set: (value: unknown) => set(reference, value), remove: () => remove(reference), once: (_event: "value") => get(reference), on: (_event: "value", callback: (snapshot: DataSnapshot) => void) => onValue(reference, callback), off: () => undefined }; } };
