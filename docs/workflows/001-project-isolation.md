# Workflow 001 — Isolasi proyek portofolio

Tanggal dokumentasi dan pemeriksaan: 31 Oktober 2026. Branch diperiksa: `feature/report-loading`. Dokumen ini merekonstruksi persiapan awal, bukan mencatat pelaksanaan cloning ulang. [Log utama](../ai-development-log.md).

## Tujuan

Memisahkan eksperimen dan latihan pengembangan dari aplikasi masyarakat, serta menyiapkan portofolio Junior AI Developer dan bahan live coding interview. Nama aplikasi asal `jimpitan-rt2`, perannya sebagai production, dan tujuan karier ini dilaporkan pemilik proyek serta dicatat dalam [handoff](../CHATGPT_TO_CODEX_CONTEXT.md). Repository asal dan layanan production tidak diperiksa.

## Temuan dan tingkat bukti

| Area | Bukti repository yang diperiksa | Batas kepastian |
|---|---|---|
| Pemisahan aplikasi | Direktori aktif `jimpitan-rt2-lab`; README menyatakan safe clone untuk demo/portofolio; AGENTS melarang akses production | Cara penyalinan, tanggal cloning, serta kesetaraan dengan source production **belum diverifikasi** |
| Firebase demo | README mewajibkan Firebase Project baru, bukan sekadar Web App baru pada project production; `src/firebase.ts` membaca variabel `VITE_FIREBASE_*`, memeriksa penanda environment demo dan field wajib, serta memblokir production yang dikenali | Pembuatan project demo dan isolasi akun/database live **belum diverifikasi**; tidak ada koneksi Firebase untuk tugas ini |
| Data dummy | README menjelaskan seed 8 warga fiktif pada `demo-data/seed-2026-10.json`; `src/data/financeHistory.ts` memuat transaksi berlabel demo/contoh | Penggantian data masyarakat dilaporkan pemilik dan dokumentasi proyek; tidak dibandingkan dengan database asli. Import seed ke demo **belum diverifikasi** |
| Environment | `.env.example` tercatat di Git; `.gitignore` mengabaikan `.env` dan `.env.*` kecuali template; `git check-ignore .env.local` berhasil; `git ls-files '.env*'` hanya menampilkan template | Isi `.env.local` tidak dibaca. Validitas konfigurasi dan target live **belum diverifikasi** |
| Git portofolio | Root commit `19c1ee7` berjudul `chore: create portfolio baseline`; tidak memiliki parent dan mencatat 32 file | Waktu/perintah `git init`, lokasi repository sumber, serta urutan operasi sebelum commit **belum diverifikasi** |

## Keputusan persiapan yang tercatat

1. Gunakan clone lab untuk portofolio agar eksperimen tidak dilakukan pada aplikasi production. Pertahankan perilaku bisnis jimpitan; perubahan aturan bisnis harus diajukan terpisah.
2. Pisahkan Firebase Project demo dari production. Konfigurasi lokal mengikuti template `.env.example` melalui `.env.local`; nilai environment tidak ditulis dalam dokumentasi atau repository. Guard pada klien bukan pengganti otorisasi server.
3. Gunakan seed dan riwayat keuangan fiktif sebagai bahan demo. Jangan menyalin database, identitas, atau riwayat masyarakat untuk melengkapi demonstrasi.
4. Simpan titik awal portofolio dalam Git, lalu sediakan branch baseline, before-demo, dan pengembangan fitur. Bukti Git di bawah mengonfirmasi keadaan yang tersedia sekarang, bukan waktu pembuatan setiap branch.

## Baseline dan persiapan branch

`git show --no-patch --format=fuller 19c1ee7` menunjukkan hash lengkap `19c1ee7fe6e86b7a378e5d9ad35e75b1317450a9`, subject `chore: create portfolio baseline`, serta AuthorDate dan CommitDate **30 Oktober 2026 pukul 15:00:48 +0700**. Ini timestamp metadata Git, bukan bukti tanggal cloning atau pengujian.

`git rev-list --parents -n 1 19c1ee7` hanya mengembalikan hash commit itu sendiri, sehingga terbukti sebagai root commit pada riwayat ini.

| Branch lokal | Posisi saat pemeriksaan | Peran yang direncanakan menurut handoff |
|---|---|---|
| `main` | `19c1ee7` | Baseline/stabil |
| `demo/loading-before` | `19c1ee7` | Snapshot sebelum loading |
| `feature/report-loading` | `470346c` (branch aktif), turunan baseline | Pengembangan loading dan workflow lanjut |

Urutan commit yang terbukti pada branch aktif: `19c1ee7` → `c2ce297` (`feat: add report loading state`) → `cae9839` (`test: add report tests and patch dev tooling`) → `470346c` (`docs: document AI development workflows`). Tanggal pembuatan branch, perintah checkout awal, dan keadaan server remote saat ini **belum diverifikasi**; tidak ada fetch/push dalam pemeriksaan ini.

## File dan area hasil persiapan

Tree baseline mencakup `.env.example`, `.gitignore`, `AGENTS.md`, `README.md`, `src/firebase.ts`, `src/data/financeHistory.ts`, `demo-data/seed-2026-10.json`, source React, manifest/lockfile, tes bulanan, dan dokumentasi audit awal. Keberadaan file pada baseline terbukti melalui `git ls-tree` dan `git show --stat`; commit tunggal tidak membuktikan file mana yang disalin atau diubah dibanding aplikasi asal.

Tugas dokumentasi ini hanya menambahkan file workflow ini, memperbarui indeks log, dan melengkapi aturan penomoran di AGENTS. Workflow 002–004, source, dependency, dan Firebase tidak diubah.

## Bukti pemeriksaan dan keterbatasan testing

- Git: branch/status, log, metadata dan tree baseline, serta aturan ignore environment diperiksa secara lokal.
- Tidak tersedia bukti hasil testing yang secara khusus dijalankan pada baseline `19c1ee7` dalam tugas ini. Keberadaan tes dalam baseline bukan bukti bahwa tes telah lulus saat baseline dibuat.
- Lint/build workspace terkini diperiksa untuk perubahan dokumentasi; hasilnya tidak boleh diatribusikan ke baseline. Hasil pengujian workflow berikutnya tetap berada pada dokumen masing-masing.
- Tidak membaca environment lokal atau memeriksa aplikasi production. Deployment demo, import seed, dan pengujian koneksi Firebase **belum diverifikasi**.

## Pekerjaan berikutnya

Review pemisahan fakta Git dan laporan pemilik. Jika diperlukan, lengkapi bukti setup Firebase DEMO yang sudah dikonfirmasi tanpa menyertakan konfigurasi sensitif. Lanjutkan evaluasi keamanan melalui [audit](../security-audit.md); isolasi proyek tidak menyelesaikan seluruh temuan Rules/dependency. Gunakan [Workflow 002](002-report-loading.md) untuk pekerjaan fitur setelah baseline. Tidak melakukan commit, push, atau deploy otomatis.
