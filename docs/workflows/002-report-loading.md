# Workflow 002 — Loading Unduh & Simpan Laporan

Tanggal dokumentasi dan verifikasi: 31 Oktober 2026. Status: implementasi tersedia dalam working tree; menunggu review. [Log utama](../ai-development-log.md).

## Tujuan

Memberikan umpan balik selama proses async pembuatan PNG dan penyimpanan metadata, serta mencegah operasi ganda akibat klik berulang.

## Temuan dan bukti

Diff `src/pages/Home.tsx` terhadap HEAD menunjukkan tombol lama tidak memiliki state loading, disabled, atau guard sinkron. Cleanup class capture dan scroll sebelumnya berada setelah `await html2canvas`, sehingga dapat terlewat jika capture menolak. Ini bukti analisis kode; log error implementasi awal **belum tersedia**. Tes sekarang mensimulasikan `Simulated canvas failure` dan `permission_denied`, bukan error Firebase nyata.

## Keputusan teknis

- `isSavingReport` mengatur label `Memproses laporan...`, `disabled`, dan `aria-busy`.
- `savingReportRef` memblokir pemanggilan kedua sebelum React melakukan render ulang; state saja tidak menjamin guard sinkron.
- `finally` bagian capture memulihkan `disable-sticky-capture`, `scrollLeft`, dan `scrollTop`; `finally` terluar mereset guard dan loading pada sukses/gagal.
- Dynamic import `html2canvas`, pemicu unduhan PNG sebelum `set()` metadata, path `reports/${bulanAktif}/${tanggal}`, serta payload laporan tetap mengikuti alur kode sebelumnya. PNG tidak disimpan sebagai file di Firebase.

## File yang berubah pada workflow

`src/pages/Home.tsx`. Bukti regresi terkait ada di [workflow component testing](003-component-testing.md). Tugas dokumentasi ini tidak mengubah source tersebut.

## Bukti verifikasi ulang — 31 Oktober 2026

Branch aktual: `feature/report-loading`. Node `v24.21.0`, npm `11.19.0`.

| Perintah | Hasil aktual |
|---|---|
| `npm run test` | Exit 0; reporter menampilkan 1 file lulus (`tests/monthly.test.mjs`), berisi 6 definisi kasus uji |
| `npm run test:component` | Exit 0; 1 file, 4 tests lulus |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; Vite 8.1.6, 117 modul; ada peringatan `Unknown at rule: @tailwind` untuk base/components/utilities |

Hasil ini memverifikasi kondisi workspace, bukan commit tertentu. Tanggal implementasi awal dan commit khusus workflow **belum diverifikasi**. Pengujian ini memakai mock; bukan bukti integrasi Firebase live. Tidak ada akses Firebase production.

## Keterbatasan dan pekerjaan berikutnya

- Sticky header, posisi scroll visual, kualitas PNG, dan unduhan browser nyata **belum diverifikasi** secara manual.
- Klik ganda, sukses, kegagalan canvas, dan penolakan write diuji melalui mock. Kegagalan dynamic import dan blob `null` belum menjadi kasus tes tersendiri.
- Jika unduhan telah dipicu lalu write gagal, kedua tahap tidak bersifat atomik. Pesan error masih umum; evaluasi hasil parsial dan pesan per tahap sebagai pekerjaan terpisah tanpa mengubah aturan bisnis diam-diam.
- Review diff dan uji browser hanya dengan Firebase DEMO yang telah dikonfirmasi; commit belum dilakukan oleh agent.
