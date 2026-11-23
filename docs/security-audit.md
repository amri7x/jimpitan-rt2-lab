# Audit akses Firebase Realtime Database — Jimpitan RT 02 Lab

Tanggal peninjauan: 30 Oktober 2026. Lingkup: `database.rules.json`, `src/pages/Home.tsx`, `src/pages/Settings.tsx` dari **clone demo**, bukan layanan produksi.

## Batas pemeriksaan
- Ini adalah **audit statis**: kami meninjau kode/rules, tetapi belum menjalankan pengujian akses terhadap Firebase Emulator.
- Jangan menganggap rules sekarang aman untuk hosting publik; **jangan deploy perubahan ke production**.
- Kode clone tetap mempertahankan perilaku bisnis, termasuk membuat data bulan baru dari bulan sebelumnya secara otomatis.

## Temuan dan bukti

| ID | Prioritas | Bukti | Masalah | Target perbaikan |
|---|---|---|---|---|
| R-01 | Tinggi | `database.rules.json`: `jimpitan/months/$month/.write` mengizinkan akun apa pun yang sudah login membuat node bulan baru apabila `status === active` | Anonymous Auth tidak membuktikan bahwa pengguna adalah petugas tepercaya; penyerang dapat membuat bulan baru dengan data yang mereka tentukan | Pindahkan otorisasi pembentukan bulan ke admin atau backend tepercaya; validasi seluruh payload dan transisi bulan |
| R-02 | Tinggi | `.write` pada parent bulan berlaku juga bagi child di bawahnya | Pada pembuatan bulan, satu write ke parent dapat memasukkan subtree `recap` tanpa mengikuti aturan child `recap/days/$day` | Hindari broad grants; tambahkan `.validate` yang ketat atau pindahkan inisialisasi ke proses tepercaya |
| R-03 | Tinggi | `jimpitan/months/$month/warga/$residentId/.write` mengizinkan semua akun login mengedit warga di bulan aktif | Pengguna dapat memakai SDK/API langsung untuk mengubah nilai atau hari yang seharusnya tidak boleh diedit menurut UI | Role-based authorization dan validasi nilai, tanggal, serta transisi data di sisi server |
| R-04 | Sedang | `reports/$month/$date/.write` cukup dengan `auth != null` | Akun anonymous dapat menulis laporan harian tanpa memvalidasi relasi dengan petugas atau data sumber | Batasi izin, validasi struktur laporan, atau hasilkan laporan dari data tepercaya |
| R-05 | Sedang | `system/legacyDataImported/.write` cukup dengan `auth != null` | Marker migrasi dapat diubah oleh akun yang tidak berhak, mengganggu inisialisasi bulan | Izinkan hanya admin / proses migrasi backend; pada demo setelah seed, marker sebaiknya tidak ditulis klien |
| R-06 | Sedang | `locks/$month/$cell/.write` menerima semua anonymous user | Aplikasi lain bisa menimpa lock, termasuk lock milik petugas lain | Simpan owner UID dan validasi create/delete dengan UID serta masa berlaku |
| R-07 | Tinjau privasi | `finance/months/$month/.read: true` dan `jimpitan/months/$month/.read: true` | Seluruh konten pada jalur tersebut dapat dibaca tanpa login; cocok hanya jika memang data publik yang diizinkan | Tinjau kebutuhan privasi sebelum deploy publik; data demo tetap fiktif |

## Dependensi penting: pergantian bulan
`src/pages/Home.tsx` menjalankan `runTransaction()` pada path `jimpitan/months/$month` untuk membuat bulan baru ketika data belum ada. Fitur ini dijalankan dari klien oleh petugas yang mungkin masuk secara anonymous. Mengubah `.write` parent menjadi admin-only **langsung** akan menghentikan rollover tersebut. Solusi aman harus mencakup redesain alur, misalnya pembuatan bulan oleh admin, scheduled backend, atau perintah admin tepercaya.

## Matriks uji Firebase Rules Emulator yang harus dibuat selanjutnya

| Aktor | Operasi | Harapan setelah hardening |
|---|---|---|
| Tanpa login | Baca `admins/<uid>` | DENY |
| Anonymous | Tulis `admins/<uid>` | DENY |
| Anonymous | Mengubah `finance/months/2026-10/transactions/x` | DENY |
| Anonymous | Menulis `recap/days/1` | DENY |
| Anonymous | Membuat bulan arbitrer `2099-01` | DENY |
| Anonymous | Menulis `system/legacyDataImported` | DENY |
| Anonymous | Mengedit setoran pada hari yang tidak diizinkan | DENY |
| Admin | Menulis transaksi dengan format valid | ALLOW |
| Admin | Menulis transaksi dengan nominal tidak valid | DENY |
| Petugas terotorisasi | Mengisi setoran untuk hari yang berlaku | ALLOW |

Catatan: *Harapan setelah hardening* adalah target, **bukan** status uji saat ini.

## Urutan perbaikan yang aman
1. Putuskan model identitas petugas (akun email/password per petugas, identitas terverifikasi, atau backend pengotorisasi). Nama yang diketik pada UI tidak dapat dijadikan otorisasi.
2. Pindahkan pembuatan bulan baru ke proses tepercaya **sebelum** melarang anonymous membuatnya.
3. Ubah Security Rules di branch demo; tambahkan `.validate` untuk bentuk data, nilai, dan transisi status.
4. Buat automated tests Firebase Emulator untuk setiap kasus izin ALLOW/DENY.
5. Jalankan pengujian regression UI dan perhitungan bulanan.
6. Deploy rules hanya ke Firebase **demo** setelah pengujian lolos dan target project ID diverifikasi.

## Referensi resmi
- https://firebase.google.com/docs/database/security/core-syntax
- https://firebase.google.com/docs/database/security/rules-conditions
- https://firebase.google.com/docs/rules/unit-tests


## Audit dependency npm — pembaruan 31 Oktober 2026

Bagian ini menambahkan audit dependency tanpa menggantikan audit statis Rules tanggal 30 Oktober di atas. Pemeriksaan hanya membaca graph npm dan advisory registry; tidak menghubungi database Firebase.

Sesudah patch development, pemeriksaan ulang `npm audit --json` dan `npm audit --omit=dev --json` masing-masing melaporkan **4 paket high**, 0 moderate/critical, exit 1. Sebelum patch: total 10 paket (9 high, 1 moderate); production 4 high. Rincian patch: [workflow 004](workflows/004-dependency-security-patch.md).

| Paket terpasang | Severity audit paket | Jalur/asal temuan | Status |
|---|---|---|---|
| `firebase@12.15.0` | high | Mewarisi temuan Firestore dan Firestore compat | Ditunda, belum diperbaiki |
| `@firebase/firestore@4.16.0` | high | Mewarisi temuan `@grpc/grpc-js` | Ditunda, belum diperbaiki |
| `@firebase/firestore-compat@0.4.11` | high | Mewarisi temuan `@firebase/firestore` | Ditunda, belum diperbaiki |
| `@grpc/grpc-js@1.9.16` | high | Advisory langsung di bawah | Ditunda, belum diperbaiki |

Empat paket terdampak tidak berarti empat advisory independen. Graph `npm ls` menunjukkan `firebase → @firebase/firestore → @grpc/grpc-js` dan jalur compat menuju Firestore yang sama.

Advisory langsung pada gRPC menurut output audit:

- `GHSA-m9gg-hp2v-232j` (high): pada konfigurasi tertentu, `getAuthContext` dapat mengembalikan sertifikat tidak terotorisasi seolah terotorisasi.
- `GHSA-f596-whhp-79r4` (low): server dapat mengirim sebagian pesan error dari method handler ke klien.

Keduanya mencantumkan rentang terdampak `<1.13.6`. Severity paket gRPC tetap high karena severity tertinggi. Uraian ini berdasarkan output npm audit, bukan pengujian eksploitasi. Keterjangkauan pada bundle browser aplikasi **belum diverifikasi**; instalasi paket bukan bukti eksploitabilitas.

### Keputusan dan langkah berikutnya

Firebase/Firestore/gRPC tidak diubah. Output audit menawarkan `firebase@9.14.0` dengan `isSemVerMajor: true`; saran tersebut bukan persetujuan untuk downgrade. Jangan gunakan `npm audit fix --force` atau override tanpa evaluasi dan persetujuan tersendiri. Selanjutnya periksa kompatibilitas SDK dan jalur runtime, verifikasi pilihan perbaikan pada saat pengerjaan, lalu jalankan regression testing sebelum mengusulkan perubahan. Pengujian authorization Firebase Emulator pada audit Rules tetap belum dilakukan.

Tidak ada perubahan Rules, hosting, commit, push, deploy, atau akses Firebase production dalam pekerjaan dokumentasi ini.

## Pembaruan dependency — 11 November 2026

Workflow [005 — Migrasi Tailwind CSS v4](workflows/005-tailwindcss-v4.md) menambahkan development dependency `@tailwindcss/vite@^4.3.5` untuk integrasi Vite. Resolusi `tailwindcss` berubah dari 4.3.2 menjadi 4.3.5 dalam lockfile karena rentang manifest yang telah ada adalah `^4.3.2`. Tidak ada dependency Firebase, Firestore, atau gRPC yang diubah.

| Pemeriksaan | Sebelum migrasi | Sesudah migrasi |
|---|---:|---:|
| `npm audit --json` | 4 high, 0 moderate/critical (catatan audit 31 Oktober) | 4 high, 0 info/low/moderate/critical; exit 1 |
| `npm audit --omit=dev` | 4 high (catatan audit 31 Oktober) | 4 high; exit 1 |

Jumlah dan severity tidak berubah. Temuan tetap berada pada jalur Firebase/Firestore/gRPC yang telah dijelaskan di atas; audit paket tidak membuktikan eksploitabilitas aplikasi. `npm audit fix --force` tidak dijalankan karena menawarkan downgrade Firebase breaking. Tidak ada perubahan Rules, deployment, atau akses Firebase production.

## Pembaruan workspace mobile — 12 November 2026

Workspace `@jimpitan/mobile` menambahkan Expo 57.0.32, Expo Router 6.0.24, React Native Firebase 27.1.1, NativeWind 4.2.7, dan Tailwind 3.4.17. `npm install --package-lock-only --ignore-scripts` melaporkan 19 temuan: 1 low, 8 moderate, 10 high. Audit paket bukan bukti eksploitabilitas; `npm audit fix --force` tidak dijalankan. Rules, deploy, dan Firebase production tidak diubah.
