# Jurnal AI-assisted development — Jimpitan RT 02 Lab

Dokumen ini sengaja mencatat keputusan teknis yang dapat dipertanggungjawabkan saat wawancara kerja. Jangan klaim AI atau developer sudah menguji sesuatu jika belum.

## Studi kasus 001 — Audit Firebase Realtime Database Rules

**Konteks:** clone dari aplikasi jimpitan yang digunakan masyarakat. Firebase demo dan data fiktif dibuat terpisah agar percobaan tidak mengganggu production.

**Tujuan:** memeriksa aturan akses, mencegah write yang tidak sah, dan mempertahankan perilaku bisnis penghitungan setoran serta pergantian bulan.

**Temuan audit statis:** aturan write parent bulan berlaku pada seluruh child; akun anonymous dapat membuat data bulan baru saat path kosong; beberapa write dibatasi hanya dengan `auth != null`.

**Keputusan developer:** tidak langsung mengubah rules karena pembuatan bulan baru masih bergantung pada write ke parent. Dibutuhkan rancangan otorisasi petugas/rollover terlebih dahulu.

**Pengujian yang benar-benar sudah dilakukan:** 6 unit tests logika bulan dengan `node:test` pada `tests/monthly.test.mjs`, termasuk pergantian bulan saat WIB sudah memasuki November, tahun kabisat, carry-over saldo, serta path database.

**Belum dilakukan:** emulator-based authorization tests, penetration test, perubahan rules, deployment keamanan baru. Jangan tampilkan pekerjaan tersebut sebagai sudah selesai.

**Bukti yang bisa ditautkan pada CV/portfolio:**
- `docs/security-audit.md` — analisis akar masalah dan rencana perbaikan
- `tests/monthly.test.mjs` — tes regresi fungsi murni
- commit Git saat kamu menambahkan paket tahap 2

## Template jurnal perubahan berikutnya

### [Nomor] Judul perubahan
- Masalah / expected behavior:
- Prompt atau instruksi kepada AI agent:
- File yang dianalisis:
- Rekomendasi AI yang diterima / ditolak:
- Perubahan yang disetujui developer:
- Pengujian dan hasil aktual:
- Risiko dan rollback:


## Pembaruan living documentation — 31 Oktober 2026

Branch diperiksa: `feature/report-loading`. Tiga workflow berikut direkonstruksi dari source/diff, konfigurasi aktual, bukti sesi patch sebelumnya, dan pemeriksaan ulang. Isi studi kasus 001 di atas dipertahankan sebagai riwayat; penyebutan commit di sana bukan bukti commit baru. Commit implementasi ketiga workflow berikut **belum diverifikasi**; perubahan terkait masih berada di working tree saat inspeksi.

| Workflow | Ringkasan keputusan dan hasil | Rincian |
|---|---|---|
| 001 — Isolasi proyek | Rekonstruksi safe clone, Firebase demo, data dummy, environment, root commit `19c1ee7`, dan branch; membedakan bukti lokal dari laporan pemilik | [Bukti, batasan dan tindak lanjut](workflows/001-project-isolation.md) |
| 002 — Loading laporan | State UI dan guard useRef sinkron, cleanup melalui finally; alur unduhan lalu write dipertahankan | [Tujuan, temuan, file, tes, batasan, tindak lanjut](workflows/002-report-loading.md) |
| 003 — Component testing | Vitest/jsdom/React Testing Library dengan Firebase/canvas/download mock; empat tes lulus | [Konfigurasi, skenario, bukti dan batasan](workflows/003-component-testing.md) |
| 004 — Dependency patch | Vite/PostCSS dan transitive kompatibel; audit 10 → 4 paket, seluruh sisa high pada Firebase/gRPC | [Versi, keputusan, regression testing dan risiko](workflows/004-dependency-security-patch.md) |
| 005 — Migrasi Tailwind CSS v4 | Integrasi Vite resmi ditambahkan dan entry CSS memakai `@import`; peringatan build `Unknown at rule: @tailwind` hilang | [Temuan, file, pengujian, risiko, dan tindak lanjut](workflows/005-tailwindcss-v4.md) |
| 006 — Refactor utility Tailwind | Seluruh `className` pada halaman dan komponen dipindahkan dari selector CSS lokal ke utility Tailwind v4; alur aplikasi dipertahankan | [Pemetaan, pengujian, batasan, dan tindak lanjut](workflows/006-tailwind-utility-refactor.md) |
| 007 — Perbaikan regresi tabel Home | Sticky column dipulihkan melawan cascade CSS global; warna tabel capture dibuat kompatibel dengan `html2canvas` | [Akar masalah, perbaikan, hasil test, dan batasan](workflows/007-home-table-capture-regression.md) |
| 008 — Perbaikan lapisan kolom sticky | Lebar dan z-index No/Nama Warga dibuat important agar tidak tertindih header tanggal saat scroll | [Bukti browser, perbaikan, test, dan batasan](workflows/008-home-sticky-layering.md) |

### Pemeriksaan aktual pada tanggal dokumentasi

- `npm run test`: exit 0; reporter 1 file lulus, source berisi 6 definisi kasus bulanan.
- `npm run test:component`: exit 0; 4/4 tests lulus.
- `npm run lint` dan `npm run build`: exit 0; build memberi peringatan `Unknown at rule: @tailwind`.
- `npm ls` dependency target: exit 0. `npm audit` dan `npm audit --omit=dev`: masing-masing exit 1 dengan 4 high; lihat [audit keamanan](security-audit.md).
- UI/CSS browser, kualitas PNG, unduhan nyata, integrasi Firebase live, dan authorization Emulator **belum diverifikasi** dalam tugas ini.

### Pemakaian log selanjutnya

Setelah workflow selesai, tambahkan ringkasan bertanggal dan tautan detail di `docs/workflows/`; jangan mengganti riwayat lama. Pisahkan hasil aktual, bukti sesi terdahulu, rencana, dan status **belum diverifikasi**. Ikuti bagian Workflow Documentation di `../AGENTS.md`. [Peta proyek](../PROJECT_MAP.md) membantu menemukan source dan perintah terkait.


## Pelengkapan Workflow 001 — 31 Oktober 2026

[Workflow 001 — Isolasi proyek portofolio](workflows/001-project-isolation.md) ditambahkan setelah Workflow 002–004 untuk melengkapi urutan dokumentasi. Tanggal ini adalah tanggal rekonstruksi, bukan tanggal cloning. Root commit `19c1ee7` dan tiga branch lokal terverifikasi; setup Firebase live, waktu `git init`, dan testing pada baseline **belum diverifikasi**.

Nomor **Studi kasus 001 — Audit Firebase Realtime Database Rules** pada bagian historis di atas adalah nomor studi kasus, bukan Workflow 001. Isinya tetap dipertahankan; indeks workflow memakai namespace tersendiri dan kini berurutan 001–004 tanpa duplikasi file.

Pemeriksaan Git terbaru menunjukkan workflow lanjutan kini memiliki commit `c2ce297`, `cae9839`, dan `470346c`. Catatan sebelumnya tentang working tree/belum diverifikasi dipertahankan sebagai status pada saat pencatatan, bukan status Git terkini. `PROJECT_MAP.md` tidak diubah karena penambahan detail historis ini tidak mengubah alur, struktur utama, atau perintah proyek.

## Workflow 005 — Migrasi Tailwind CSS v4 — 11 November 2026

Branch diperiksa: `feature/report-loading`. Tailwind CSS dan plugin Vite teresolusi ke `4.3.5`; CSS entry beralih dari tiga direktif v3 ke `@import "tailwindcss"`. `npm run test` (6 kasus), `npm run test:component` (4 kasus), `npm run lint`, dan `npm run build` semuanya exit 0. Peringatan build `Unknown at rule: @tailwind` yang tercatat pada pemeriksaan 31 Oktober tidak muncul lagi. Detail, bukti, risiko Preflight, serta batas verifikasi browser ada di [Workflow 005](workflows/005-tailwindcss-v4.md).

## Workflow 006 — Refactor utility Tailwind — 11 November 2026

Branch diperiksa: `feature/report-loading`. Semua `className` di `src/pages/` dan `src/components/` kini menggunakan utility Tailwind v4, termasuk state navigasi, sel tabel yang terkunci/aktif, serta mode non-sticky untuk capture PNG. `npm run test` (6/6), `npm run test:component` (4/4), `npm run lint`, dan `npm run build` semuanya exit 0. Verifikasi visual browser dan Firebase live **belum dilakukan**. Rincian perubahan dan batasan tersedia di [Workflow 006](workflows/006-tailwind-utility-refactor.md).

## Workflow 007 — Perbaikan regresi tabel Home — 11 November 2026

Branch diperiksa: `feature/report-loading`. Laporan pengguna setelah Workflow 006 memperlihatkan kolom No/Nama Warga tidak sticky dan proses unduh/simpan jatuh ke pesan error generik. CSS global `th, td { position: relative; }` terbukti mengalahkan utility Tailwind berlapis; sticky diubah menjadi `!sticky`. Warna pada tabel yang dicapture menggunakan hex, bukan palet default Tailwind v4 berbasis `oklch`, untuk kompatibilitas `html2canvas`. `npm run test` (6/6), `npm run test:component` (4/4), `npm run lint`, dan `npm run build` exit 0. Pemeriksaan browser dengan Firebase demo tetap **belum diverifikasi**. Detail tersedia di [Workflow 007](workflows/007-home-table-capture-regression.md).

## Workflow 008 — Perbaikan lapisan kolom sticky — 11 November 2026

Branch diperiksa: `feature/report-loading`. Screenshot pengguna menunjukkan Nama Warga menyempit dan tertindih kolom tanggal. CSS global `th, td` mengalahkan utility Tailwind normal untuk `min-width` dan `z-index`; tiga properti kolom sticky kini diberi modifier important. Browser headless dengan Firebase demo mengonfirmasi lebar Nama Warga `140px`, z-index `20`, dan posisi kiri tetap `46px` setelah horizontal scroll 180px; header tanggal z-index `10`. Semua test, lint, build, dan pemeriksaan diff lulus. Detail ada di [Workflow 008](workflows/008-home-sticky-layering.md).

## Workflow 009 — Fondasi Mobile Expo — 12 November 2026

Branch `feature/report-loading`. Ditambahkan workspace mobile Expo dan core bersama tanpa memindahkan web Vite. Test 6/6, component test 4/4, typecheck mobile, dan build web lulus; lint exit 0 dengan dua peringatan non-blokir. Firebase DEMO device/live belum diverifikasi. Detail: [Workflow 009](workflows/009-mobile-expo-foundation.md).

Pembaruan hari yang sama: error config plugin React Native Firebase diperbaiki dengan hanya memakai plugin App. Prebuild kini berhenti aman ketika Google services DEMO tidak tersedia. React Native diselaraskan ke 0.86.3; typecheck mobile lulus kembali.

## Workflow 010 — Pembatasan memori build web — 12 November 2026

Branch diperiksa: `feature/report-loading`. Skrip build Vite sebelumnya tidak membatasi heap Node; log crash lama tidak tersedia sehingga ini dinilai sebagai guardrail preventif, bukan akar masalah yang terbukti tunggal. `npm run build` kini membatasi heap menjadi 1.536 MiB untuk laptop RAM 8 GB. Build melalui skrip baru berhasil: 119 modul, exit 0, 0,85 detik, dan maksimum RSS 483.944 KiB. Lint exit 0 dengan empat peringatan mobile yang sudah ada; detail bukti dan keterbatasan ada di [Workflow 010](workflows/010-build-memory-cap.md).

## Workflow 011 — Build Android RAM terbatas — 12 November 2026

Branch diperiksa: `feature/report-loading`. Build Android sebelumnya dapat menjalankan Gradle JVM 2 GiB, task paralel, empat ABI native, dan beberapa compiler C++ Ninja sekaligus. Profil baru menserialkan Gradle dan CMake/Ninja, membatasi heap Gradle 1.536 MiB, serta memilih `arm64-v8a` untuk perangkat yang diverifikasi. `npm run mobile:build:low-memory` berhasil (536 task; 2:46,94; maksimum RSS 1.482.496 KiB); typecheck mobile juga exit 0. Detail warning, batas verifikasi, dan cara memilih ABI emulator ada di [Workflow 011](workflows/011-mobile-build-low-memory.md).

## Workflow 012 — Startup Metro workspace Tailwind campuran — 12 November 2026

Branch diperiksa: `feature/report-loading`. Metro gagal karena NativeWind 4 yang ter-hoist mengambil Tailwind v4 root, padahal ia hanya mendukung v3; sesudah itu Expo CLI root tidak dapat menemukan Expo Router workspace. Resolver Metro kini mengisolasi Tailwind v3 untuk inisialisasi NativeWind dan skrip start menyediakan jalur dependency workspace untuk Expo CLI. Metro mencapai `Waiting on http://localhost:8081` dalam mode offline; typecheck mobile exit 0. Detail keputusan dan batas runtime tersedia di [Workflow 012](workflows/012-mobile-metro-workspace-tailwind.md).

## Workflow 013 — Konfigurasi Babel NativeWind — 12 November 2026

Branch diperiksa: `feature/report-loading`. Log bundling Android membuktikan `nativewind/babel` keliru ditempatkan sebagai plugin Babel; ia kini menjadi preset, sedangkan plugin Reanimated tetap terakhir. Konfigurasi Babel berhasil dimuat untuk `expo-router/entry.js`, typecheck mobile, lint, build web, dan pemeriksaan whitespace lulus. Export Android penuh belum diverifikasi karena proses Metro dihentikan setelah tidak menghasilkan output beberapa menit. Rincian: [Workflow 013](workflows/013-nativewind-babel-preset.md).

## Workflow 014 — Alias Metro CSS Interop — 12 November 2026

Branch diperiksa: `feature/report-loading`. Bundling perangkat kemudian menemukan `react-native-css-interop/jsx-runtime` tidak dapat ditemukan oleh `@expo/log-box` yang ter-hoist. Metro kini mengarahkan nama paket itu ke dependency NativeWind yang sudah tersedia. Alias, typecheck mobile, lint, build web, dan pemeriksaan whitespace terverifikasi; bundling pada perangkat setelah restart cache masih perlu dicoba. Rincian: [Workflow 014](workflows/014-metro-css-interop-alias.md).

## Workflow 015 — Batas root Metro workspace mobile — 12 November 2026

Branch diperiksa: `feature/report-loading`. Bundling 1.861 modul konsisten terhenti pada 99,89% tanpa tekanan RAM. Expo menaikkan server root ke monorepo; skrip start sekarang memakai `EXPO_NO_METRO_WORKSPACE_ROOT=1` agar Metro dibatasi pada workspace mobile. Metro port 8082 memverifikasi root tersebut; typecheck mobile, lint, build web, dan pemeriksaan whitespace lulus. Bundling perangkat setelah restart masih perlu dicoba. Rincian: [Workflow 015](workflows/015-metro-workspace-root.md).

## Workflow 016 — Build ulang APK debug Android — 12 November 2026

Branch diperiksa: `feature/report-loading`. Build awal low-memory selesai, tetapi APK masih `UP-TO-DATE`; build bersih berikutnya menjalankan 66 task dan berhasil dalam 2m59s. APK debug baru untuk `arm64-v8a` tersedia di `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (91.067.018 byte; `id.jimpitan.rt2.lab` versi 0.1.0). `npm run lint` exit 0 dengan empat warning lama dan `npm run build` exit 0 (119 modul). Instalasi/runtime perangkat, bundling Metro dari perangkat, dan akses Firebase DEMO belum diverifikasi. Rincian perintah, warning, bukti artefak, serta batasan ada di [Workflow 016](workflows/016-rebuild-apk-debug.md).

## Workflow 017 — Penyatuan React untuk Metro mobile — 12 November 2026

Branch diperiksa: `feature/report-loading`. Error `Invalid hook call` terjadi karena Metro memaksa React mobile 19.2.3 ketika React Native renderer menggunakan 19.2.7. React mobile dan konfigurasi resolver kini menunjuk satu React root 19.2.7; `npm ls` mengonfirmasi seluruh dependency mobile ter-deduplikasi. Typecheck mobile, lint, dan build web exit 0. Metro cache bersih juga membundel entry Android Expo Router (1.904 modul, 15.110 ms) tanpa error hook. Runtime perangkat dan Firebase DEMO belum diverifikasi. Rincian bukti, perubahan, audit dependency, dan tindak lanjut tersedia di [Workflow 017](workflows/017-react-singleton-metro.md).

## Workflow 018 — Catatan pemulihan guard Firebase DEMO — 12 November 2026

Branch diperiksa: `feature/report-loading`. Setelah VS Code crash karena tekanan RAM, pemeriksaan read-only mengonfirmasi guard Firebase mobile telah tersimpan: aplikasi menolak environment selain `demo`, project ID kosong, dan ID production yang dilarang. Pesan perangkat yang mewajibkan Firebase DEMO karena itu konsisten dengan guard, tetapi penyebab konfigurasi runtime spesifik belum dapat dipastikan tanpa membuka data environment/kredensial lokal. Tidak ada proses Expo, Metro, Gradle, atau Java yang masih berjalan; APK debug yang sebelumnya tercatat dibangun tidak ditemukan lagi. Tidak ada source aplikasi, Rules, deploy, atau konfigurasi Firebase yang diubah dalam pemeriksaan ini. Verifikasi runtime pada perangkat dan Firebase DEMO tetap **belum diverifikasi**. Detail bukti, batasan, serta langkah pemulihan aman ada di [Workflow 018](workflows/018-firebase-demo-recovery-note.md).

## Workflow 019 — Toleransi data warga kosong di mobile — 12 November 2026

Branch diperiksa: `feature/report-loading`. Log Android membuktikan listener warga dan rekap menerima entri `null`; Home sebelumnya meneruskannya ke `normalizeResidentDays`, sehingga pembacaan `setoran` crash, sedangkan Rekap membaca `status` dari item null. Home dan Rekap kini mengiterasi record dengan `for...in`, mengabaikan `null`/`undefined` sebelum normalisasi atau render; bundle Metro aktif memuat kedua guard tersebut. Warning Expo Router tentang child Layout non-Screen juga ditangani dengan mendeklarasikan screen Admin statis dan menyembunyikannya untuk non-admin melalui `href: null`. Tidak ada Firebase Rules, deploy, atau koneksi production. Hasil verifikasi dan batas runtime perangkat ada di [Workflow 019](workflows/019-mobile-null-resident.md).

## Workflow 020 — Perbaikan lebar grid Home mobile — 12 November 2026

Branch diperiksa: `feature/report-loading`. Screenshot Android memperlihatkan kolom tanggal tidak terlihat karena `ScrollView` horizontal grid tidak memiliki `flex-1` di dalam container baris; panel grid dapat kolaps ke lebar nol. Grid kini mengambil sisa lebar layar, dan area warga menampilkan status kosong eksplisit apabila Firebase DEMO tidak memiliki warga pada bulan aktif. Tidak ada seed, write data, perubahan Rules, deploy, maupun akses production. `npm run test` 6/6, typecheck mobile, lint (empat warning lama), dan build web lulus; bundle Metro aktif memuat `flex-1` dan pesan status kosong. Detail bukti dan batas verifikasi perangkat ada di [Workflow 020](workflows/020-mobile-home-grid-width.md).
