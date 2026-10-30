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
