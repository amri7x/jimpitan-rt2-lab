# PROJECT_MAP.md — Peta Jimpitan RT 02 Lab

## Ringkasan

Clone demo/portofolio aplikasi jimpitan, menggunakan data fiktif. Peta awal, terverifikasi sebagian pada 31 Oktober 2026; bukan inventaris lengkap atau pengganti pemeriksaan kode.

## Teknologi dan batasan

React 19 dan TypeScript, React Router, Vite 8, npm, Firebase Authentication/Realtime Database, serta html2canvas. Node teramati v24.21.0, npm 11.19.0; bukan deklarasi minimum runtime proyek. Vite 8.1.6 memerlukan Node `^20.19.0 || >=22.12.0`. Deployment belum diverifikasi; perubahan Rules/deploy memerlukan persetujuan dan target Firebase DEMO.

## Struktur penting

```text
src/main.tsx                 # Mount React dan CSS global
src/App.tsx                  # Router dan lazy pages
src/components/Layout.tsx    # Layout halaman
src/pages/Home.tsx           # Input jimpitan, rollover, laporan PNG dan metadata
src/data/monthly.ts          # Fungsi bulan dan persiapan data
packages/core/               # Kontrak domain bersama web/mobile
apps/mobile/                 # Expo Android development build, Expo Router dan NativeWind
src/firebase.ts              # Inisialisasi Firebase dari environment demo
src/index.css                # CSS global
vite.config.js               # Build/dev dan plugin React
vitest.config.js             # jsdom, component tests, envDir false
tests/monthly.test.mjs       # Tes fungsi bulan dengan node:test
tests/components/           # Tes React dengan mock Firebase/canvas
docs/ai-development-log.md   # Indeks living documentation
docs/workflows/             # Keputusan dan bukti per workflow
docs/security-audit.md      # Audit Rules dan dependency yang terbuka
```

## Entry point dan alur utama

`src/main.tsx → App → Layout → lazy pages`. Router memuat Home, Rekap_Jimpitan, Data_Keuangan, dan Settings. Pada laporan Home, html2canvas menghasilkan PNG untuk unduhan, lalu `set()` menyimpan metadata ke `reports/<bulan>/<tanggal>`. Detail payload dan guard ada di [workflow loading](docs/workflows/002-report-loading.md). README menjelaskan integrasi demo; environment sensitif tidak dibaca untuk menyusun peta.

## Area sensitif, data, dan kompatibilitas

- Firebase production dilarang diakses. Jangan salin identitas/data asli atau konfigurasi environment ke Git.
- Aturan bisnis dan rollover bulan harus dipertahankan. Audit Rules historis menjelaskan ketergantungan write parent bulan; pengujian authorization Emulator belum diverifikasi.
- Manifest/lockfile sudah memuat pekerjaan loading/testing/patch yang belum di-commit saat inspeksi; pertahankan perubahan pengguna.
- Temuan Firebase/gRPC belum selesai. Lihat [audit keamanan](docs/security-audit.md); patch development tidak membuktikan keamanan seluruh aplikasi.

## Pengujian dan konvensi

Perintah manifest: `npm run dev`, `npm run build`, `npm run lint` (oxlint), `npm run test` (Node strip-types), `npm run test:component` (Vitest), dan `npm run preview`. `npm run build` menjalankan Vite dengan heap Node maksimal 1.536 MiB agar lebih aman pada laptop RAM 8 GB; bila proyek kelak benar-benar memerlukan lebih, evaluasi berdasarkan pengukuran sebelum menaikkan batas. Untuk APK debug Android RAM terbatas gunakan `npm run mobile:build:low-memory`; ia membatasi Gradle dan CMake/Ninja ke satu pekerjaan serta default ke ABI `arm64-v8a` (ubah dengan `MOBILE_ABI=x86_64` untuk emulator yang sesuai). Component tests memakai mock, bukan Firebase live. Hasil terbaru dan keterbatasan ada di [log utama](docs/ai-development-log.md). Status CI, type-check terpisah, deployment, dan seluruh skema database **belum diverifikasi**.

## Bukti dan riwayat

Peta dibuat 31 Oktober 2026 dari AGENTS, README, source entry point/router/Home, manifest/lockfile, konfigurasi Vitest, tes, dan dokumentasi. Handoff lama memuat status patch yang usang; koreksi ditambahkan tanpa menghapus riwayat. Perbarui peta hanya jika struktur, alur penting, perintah, atau guardrail berubah.
