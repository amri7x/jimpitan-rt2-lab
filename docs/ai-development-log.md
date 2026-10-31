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
| 002 — Loading laporan | State UI dan guard useRef sinkron, cleanup melalui finally; alur unduhan lalu write dipertahankan | [Tujuan, temuan, file, tes, batasan, tindak lanjut](workflows/002-report-loading.md) |
| 003 — Component testing | Vitest/jsdom/React Testing Library dengan Firebase/canvas/download mock; empat tes lulus | [Konfigurasi, skenario, bukti dan batasan](workflows/003-component-testing.md) |
| 004 — Dependency patch | Vite/PostCSS dan transitive kompatibel; audit 10 → 4 paket, seluruh sisa high pada Firebase/gRPC | [Versi, keputusan, regression testing dan risiko](workflows/004-dependency-security-patch.md) |

### Pemeriksaan aktual pada tanggal dokumentasi

- `npm run test`: exit 0; reporter 1 file lulus, source berisi 6 definisi kasus bulanan.
- `npm run test:component`: exit 0; 4/4 tests lulus.
- `npm run lint` dan `npm run build`: exit 0; build memberi peringatan `Unknown at rule: @tailwind`.
- `npm ls` dependency target: exit 0. `npm audit` dan `npm audit --omit=dev`: masing-masing exit 1 dengan 4 high; lihat [audit keamanan](security-audit.md).
- UI/CSS browser, kualitas PNG, unduhan nyata, integrasi Firebase live, dan authorization Emulator **belum diverifikasi** dalam tugas ini.

### Pemakaian log selanjutnya

Setelah workflow selesai, tambahkan ringkasan bertanggal dan tautan detail di `docs/workflows/`; jangan mengganti riwayat lama. Pisahkan hasil aktual, bukti sesi terdahulu, rencana, dan status **belum diverifikasi**. Ikuti bagian Workflow Documentation di `../AGENTS.md`. [Peta proyek](../PROJECT_MAP.md) membantu menemukan source dan perintah terkait.
