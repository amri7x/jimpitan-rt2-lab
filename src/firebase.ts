import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

/**
 * Clone khusus portofolio. Semua koneksi Firebase harus menunjuk project DEMO.
 * Jangan tambahkan konfigurasi production di file ini.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredFields = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value.includes("GANTI_DENGAN"))
  .map(([field]) => field);

if (import.meta.env.VITE_FIREBASE_ENV !== "demo" || requiredFields.length) {
  throw new Error(
    `Firebase demo belum dikonfigurasi. Periksa .env.local: ${requiredFields.join(", ")}`
  );
}

// Pengaman ekstra terhadap project production yang diketahui dari arsip asal.
// Isolasi utama tetap berasal dari project Firebase, IAM, dan database rules TERPISAH.
const prohibitedProject = "jimpitanapp-621f8";
if (
  firebaseConfig.projectId === prohibitedProject ||
  firebaseConfig.databaseURL.includes(prohibitedProject) ||
  firebaseConfig.authDomain.includes(prohibitedProject)
) {
  throw new Error("Diblokir: clone tidak boleh terhubung ke Firebase production.");
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
