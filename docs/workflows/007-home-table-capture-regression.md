# Workflow 007 — Perbaikan regresi tabel Home dan capture laporan

Tanggal dokumentasi dan verifikasi: 11 November 2026. Branch diperiksa: `feature/report-loading`. Status: perbaikan source dan pemeriksaan otomatis selesai; verifikasi browser/Firebase demo belum dilakukan.

## Tujuan dan laporan masalah

Setelah refactor utility Tailwind, pengguna melaporkan dua regresi pada `src/pages/Home.tsx`:

1. Kolom `No` dan `Nama Warga` tidak lagi sticky saat tabel digeser horizontal.
2. Tombol Unduh & Simpan Laporan menampilkan pesan kegagalan generik tentang Firebase.

Screenshot pengguna memperlihatkan kedua kolom ikut bergeser. Pesan aplikasi berasal dari satu blok `catch`, sehingga kegagalan `html2canvas` dan penolakan Firebase memakai teks yang sama.

## Akar masalah dan keputusan

Di `src/index.css`, selector global `th, td` menetapkan `position: relative`. Aturan CSS lokal yang tidak berada dalam layer menang atas utility Tailwind v4 yang digenerasikan dalam layer, sehingga class `sticky` pada sel tabel tidak berlaku. Semua sel sticky Home sekarang memakai `!sticky`; offset dan z-index yang sudah ada tetap dipertahankan.

Refactor sebelumnya juga memberi elemen tabel utility warna default Tailwind v4. Palet default tersebut diekspresikan sebagai `oklch`, sedangkan `html2canvas@1.4.1` pada alur laporan tidak dijamin mem-parsenya. Karena canvas dan write Firebase memakai catch yang sama, kegagalan capture dapat tampil sebagai kegagalan Firebase. Warna elemen di dalam tabel yang dicapture diganti dengan arbitrary utility berisi nilai hex setara dari CSS sebelumnya. Tidak ada perubahan Rules, path laporan, payload Firebase, atau urutan unduh sebelum write.

## File berubah

- `src/pages/Home.tsx`: menambahkan `!sticky` pada kolom header/body/total; mengganti warna tabel dan tombol setoran yang berada dalam target `html2canvas` ke hex kompatibel.
- `docs/ai-development-log.md` dan dokumen ini: bukti masalah, keputusan, dan batas verifikasi.

## Pengujian dan hasil aktual

| Perintah | Hasil aktual |
|---|---|
| `npm run test:component` | Exit 0; 4/4 test lulus, termasuk alur capture berhasil, kegagalan canvas, penolakan Firebase, cleanup sticky/scroll, dan retry |
| `npm run test` | Exit 0; 6/6 kasus fungsi bulan lulus |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; 117 modul ditransformasi |

Tidak ada akses Firebase production, perubahan Firebase Rules, deployment, commit, atau push. Test komponen menggunakan mock Firebase dan canvas; tidak membuktikan write ke Firebase demo maupun renderer browser nyata.

## Keterbatasan dan tindak lanjut

- Buka Home di browser dengan data demo, scroll horizontal, dan pastikan dua kolom pertama tetap diam di viewport.
- Jalankan Unduh & Simpan Laporan di Firebase demo untuk mengonfirmasi `html2canvas` dan izin write `reports/<bulan>/<tanggal>` pada runtime nyata.
- Bila masih gagal, ambil pesan console browser yang aman (tanpa environment/token) untuk membedakan error canvas dari `permission_denied` Firebase. Jangan mengubah Rules atau deploy tanpa persetujuan dan konfirmasi target demo.
