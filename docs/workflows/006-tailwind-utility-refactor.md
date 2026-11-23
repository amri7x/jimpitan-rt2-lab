# Workflow 006 — Refactor className ke utility Tailwind v4

Tanggal dokumentasi dan verifikasi: 11 November 2026. Branch diperiksa: `feature/report-loading`. Status: selesai dan terverifikasi dengan pemeriksaan otomatis; pemeriksaan visual browser belum dilakukan.

## Tujuan

Menggantikan seluruh `className` pada file di `src/pages/` dan `src/components/` dari selector CSS lokal menjadi utility Tailwind CSS v4, tanpa mengubah alur login, Firebase, kalkulasi jimpitan, status setoran, routing, atau kontrak data.

## Temuan dan keputusan teknis

`src/index.css` sebelumnya mengandung selector untuk header, halaman keuangan, formulir admin, tabel jimpitan, popup numpad, serta state tabel. File tersebut dipakai sebagai referensi nilai visual dan tidak diubah dalam workflow ini sesuai batas target refactor.

Perubahan dipusatkan pada markup berikut:

- `src/components/Header.tsx`: header, merek, navigasi aktif/hover, dan responsif.
- `src/pages/Data_Keuangan.tsx`, `src/pages/Rekap_Jimpitan.tsx`, dan `src/pages/Settings.tsx`: halaman, toolbar, tabel, ringkasan, formulir, pesan error, serta tombol.
- `src/pages/Home.tsx`: login petugas, tabel setoran beserta state dinamis, popup, numpad, dan tombol laporan.

Kelas state dinamis pada Home dipetakan langsung ke utility Tailwind: nilai nol, hari di luar tanggal aktif, sel terkunci, dan animasi flash. Mekanisme `html2canvas` tetap menambahkan/menghapus `disable-sticky-capture`; tabel kini memiliki arbitrary variant Tailwind yang membuat `thead`, `tr`, `th`, dan `td` statis serta tanpa transform saat class itu aktif. Build menghasilkan selector tersebut, sehingga perilaku capture non-sticky tidak hilang akibat penghapusan class `sticky-col`.

`src/components/Layout.tsx` tidak memiliki `className` dan tidak berubah. Selector CSS lama masih berada di `src/index.css`, tetapi tidak lagi dirujuk oleh `className` pada target; pembersihannya merupakan pekerjaan terpisah agar dapat ditinjau tanpa mencampur refactor markup ini.

## Pengujian dan hasil aktual

Baseline sebelum refactor:

| Perintah | Hasil aktual |
|---|---|
| `npm run test` | Exit 0; 6/6 kasus fungsi bulan lulus |
| `npm run test:component` | Exit 0; 4/4 test komponen lulus |

Sesudah refactor:

| Perintah | Hasil aktual |
|---|---|
| `npm run test` | Exit 0; 6/6 kasus lulus |
| `npm run test:component` | Exit 0; 4/4 test lulus |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; 117 modul ditransformasi |
| Pemeriksaan CSS build | Selector `disable-sticky-capture` untuk elemen tabel ditemukan pada aset CSS hasil build |
| `git diff --check` | Exit 0 |

Tidak ada perubahan Firebase Rules, konfigurasi environment, data demo, dependency, deployment, commit, atau push. Test memakai mock dan tidak mengakses Firebase production.

## Keterbatasan dan tindak lanjut

- Tidak ada browser/E2E test atau pemeriksaan visual manual dalam lingkungan ini. Kesetaraan tampilan responsif, sticky column, popup, dan hasil PNG perlu dikonfirmasi di browser.
- Test yang ada tidak mencakup seluruh interaksi halaman Home, Settings, dan tabel rekap; hasil otomatis tidak membuktikan kesetaraan UI menyeluruh.
- `src/index.css` masih menyimpan selector yang kini tidak dirujuk. Hapus hanya setelah audit selector dan pemeriksaan visual terpisah agar tidak mencampur pengurangan CSS dengan refactor ini.
- Tidak ada perubahan aturan bisnis maupun otorisasi. Integrasi Firebase live dan authorization Emulator tetap belum diverifikasi.
