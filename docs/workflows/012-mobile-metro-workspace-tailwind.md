# Workflow 012 — Startup Metro pada workspace Tailwind campuran

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Memperbaiki Metro Expo yang berhenti sebelum aplikasi mobile dapat dicoba.

## Temuan dan bukti

Metro gagal dengan `NativeWind only supports Tailwind CSS v3`. Pemeriksaan resolusi menunjukkan `apps/mobile` memasang Tailwind `3.4.19`, tetapi `nativewind@4.2.7` ter-hoist di root dan memuat Tailwind root `4.3.5` yang dipakai web Vite. NativeWind 4 memeriksa versi dari `tailwindcss/package.json` saat Metro dimuat dan hanya menerima major v3.

Setelah masalah tersebut dilewati, Metro menemukan `Cannot find module 'expo-router/_ctx-shared'`. `expo-router` ada di `apps/mobile/node_modules`, sedangkan Expo CLI ter-hoist di root sehingga proses CLI tidak memiliki jalur resolusi workspace tersebut.

## Keputusan dan perubahan

- `apps/mobile/metro.config.js` secara terbatas mengarahkan request Tailwind yang terjadi selama inisialisasi NativeWind ke dependency Tailwind v3 milik workspace mobile, lalu mengembalikan resolver Node normal. Build web Tailwind v4 tidak berubah.
- Skrip `apps/mobile` `start` menetapkan `NODE_PATH=./node_modules` sehingga Expo CLI yang ter-hoist dapat menemukan Expo Router workspace saat Metro berjalan.

NativeWind 5 mendukung Tailwind v4 tetapi masih release candidate dan kontraknya berbeda; tidak digunakan dalam perbaikan minimal ini.

## Verifikasi aktual

| Perintah | Hasil aktual |
| --- | --- |
| Muat `metro.config.js` dari direktori `apps/mobile` | Sukses. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run mobile:start -- --offline` | Metro dimulai dan mencapai `Waiting on http://localhost:8081`; error NativeWind dan Expo Router tidak muncul. Server dihentikan sengaja setelah verifikasi (exit 130 akibat Ctrl-C). |

## Risiko dan tindak lanjut

Jembatan resolver ditujukan hanya untuk NativeWind 4 dalam monorepo npm yang memiliki Tailwind v3 dan v4; evaluasi kembali saat NativeWind 5 stabil. Perangkat belum menjalankan bundle Metro dalam workflow ini; jalankan `npm run mobile:start` lalu buka development build pada perangkat untuk verifikasi runtime. Firebase DEMO live tidak diuji.
