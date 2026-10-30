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
