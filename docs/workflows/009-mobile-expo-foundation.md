# Workflow 009 — Fondasi Mobile Expo

Tanggal verifikasi: 12 November 2026. Branch: `feature/report-loading`.

Ditambahkan monorepo bertahap: `packages/core` untuk kontrak domain (WIB, saldo, path, normalisasi, sesi) dan `apps/mobile` untuk Android Expo development build. Web Vite tetap di root dan mengimpor core melalui re-export.

Mobile memakai Expo Router, NativeWind v4/Tailwind v3, React Native Firebase modular, login anonymous/admin `admins/<uid>`, heartbeat 30 detik, timeout 2 menit, batas empat petugas, pelepasan lock saat background, input grid warga/hari, rekap/keuangan realtime, serta capture PNG/share dan metadata `reports/<bulan>/<tanggal>`.

Guard menolak Firebase selain `demo`, ID production terlarang, atau project ID kosong. Google services dan environment lokal di-ignore. Rules, deploy, dan Firebase production tidak diakses.

Hasil aktual: `npm run test` 6/6 lulus; `npm run test:component` 4/4 lulus; `npm run mobile:typecheck` dan `npm run build` lulus. `npm run lint` exit 0 dengan dua peringatan provider React. Device Android, Firebase DEMO live, reconnect/background, dan share sheet nyata belum diverifikasi karena file Google services DEMO tidak ada di workspace.

`npm install --package-lock-only --ignore-scripts` melaporkan 19 temuan audit (1 low, 8 moderate, 10 high); audit paket bukan bukti eksploitabilitas. Tambahkan mock Firebase dan uji Android nyata sebelum rilis.

## Pembaruan konfigurasi Android — 12 November 2026

Log `expo run:android` membuktikan modul Auth dan Database tidak boleh didaftarkan sebagai Expo config plugin; hanya `@react-native-firebase/app` yang dipertahankan. Prebuild berikutnya berhenti dengan benar karena `GOOGLE_SERVICES_JSON` tidak tersedia. `npx expo install react-native` menyelaraskan React Native ke `0.86.3`; augmentasi tipe NativeWind v4 dibuat eksplisit untuk workspace ini. Sesudahnya `npm run mobile:typecheck` lulus dan lint exit 0 dengan dua peringatan non-blokir yang sama. Android build belum dapat diverifikasi sampai file Firebase DEMO tersedia.
