# Workflow 008 — Perbaikan lapisan dan lebar kolom sticky Home

Tanggal dokumentasi dan verifikasi: 11 November 2026. Branch diperiksa: `feature/report-loading`. Status: selesai dan diverifikasi melalui browser headless lokal serta pemeriksaan otomatis.

## Laporan masalah dan akar masalah

Pengguna melaporkan lewat screenshot bahwa saat tabel Home digeser horizontal, header/kolom `Nama Warga` tertindih kolom tanggal. Screenshot juga menunjukkan teks nama menjadi sangat sempit.

`src/index.css` memiliki aturan global tidak berlapis: `th, td { min-width: 42px; }` dan `th { z-index: 10; }`. Utility Tailwind v4 normal berada dalam layer utilities, sehingga nilai global tersebut menang atas `min-w-[140px]` dan `z-20` pada markup hasil refactor. Akibatnya Nama Warga mendapatkan min-width 42px dan z-index sama dengan header tanggal.

## Perbaikan minimal

Pada `src/pages/Home.tsx`, kolom sticky No/Nama Warga di header, body, dan total kini memakai:

- `!min-w-[35px]` atau `!min-w-[140px]` untuk mempertahankan lebar kolom;
- `!z-20` pada header agar berada di atas header tanggal z-index 10;
- `!z-[5]` pada sel body/total untuk eksplisit mempertahankan lapisan sticky;
- `!sticky` yang sudah ditambahkan pada workflow sebelumnya tetap dipertahankan.

Tidak ada perubahan data, Firebase, HTML capture, aturan bisnis, Rules, atau dependency.

## Bukti browser dan pengujian

Browser Chrome headless membuka aplikasi lokal dengan Firebase demo memakai label sesi non-identitas `Audit UI`; tidak ada setoran atau laporan dibuat. Pengukuran computed style setelah horizontal scroll 180px:

| Elemen | Lebar | z-index | Posisi setelah scroll |
|---|---:|---:|---:|
| Header No | 35px | 20 | 11px |
| Header Nama Warga | 140px | 20 | 46px |
| Header tanggal | 46.83px | 10 | 6.5px (berada di bawah kolom sticky) |
| Body No | 35px | 5 | 11px |
| Body Nama Warga | 140px | 5 | 46px |

| Perintah | Hasil aktual |
|---|---|
| `npm run test:component` | Exit 0; 4/4 test lulus |
| `npm run test` | Exit 0; 6/6 kasus lulus |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; 117 modul ditransformasi |
| `git diff --check` | Exit 0 |

## Keterbatasan dan tindak lanjut

- Pengukuran dilakukan pada Chrome headless desktop. Uji manual pada browser/ukuran layar pengguna masih dianjurkan, khususnya mobile.
- Sesi demo `Audit UI` mengandalkan cleanup `onDisconnect`; penghapusan node sesi di Firebase tidak diverifikasi ulang.
- CSS global lama tetap ada dan dapat memerlukan modifier important di area lain yang direfactor ke Tailwind. Audit dan penghapusan CSS lama sebaiknya workflow terpisah dengan pemeriksaan visual menyeluruh.
