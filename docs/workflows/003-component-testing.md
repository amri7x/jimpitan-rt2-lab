# Workflow 003 — Automated component testing dengan Vitest

Tanggal dokumentasi dan verifikasi: 31 Oktober 2026. Status: konfigurasi dan tes tersedia dalam working tree; menunggu review. [Log utama](../ai-development-log.md).

## Tujuan dan temuan

Menguji perilaku loading laporan melalui render komponen React dan interaksi DOM, termasuk klik dalam batch sebelum disabled terpasang. Diff manifest menunjukkan penambahan script `test:component` dan dependency testing; `vitest.config.js` serta `tests/components/report-loading.test.tsx` masih untracked saat inspeksi. Tes bulanan menggunakan runner Node terpisah dan tidak digantikan.

## Keputusan teknis

- Vitest 5.0.5, jsdom 30.1.3, React Testing Library 16.3.3, dan `@testing-library/dom` 10.4.2 sebagai devDependencies.
- `vitest.config.js`: plugin React, `environment: 'jsdom'`, `include: ['tests/components/**/*.test.tsx']`, `clearMocks: true`, dan `envDir: false` agar tes tidak memerlukan environment aplikasi.
- Mock modul inisialisasi Firebase beserta SDK auth/database mencegah pembuatan aplikasi Firebase. Canvas, URL blob, unduhan, dan alert dimock.
- Fake timers dan waktu tetap membuat proses deterministik. Fixture adalah warga/petugas fiktif. Stub fetch, WebSocket, dan XMLHttpRequest melempar error jika dipanggil; ini guard untuk jalur tes, bukan jaminan isolasi seluruh proses.
- Cleanup memulihkan timer, mock, global, dan DOM antar kasus.

## File yang berubah pada workflow

`package.json`, `package-lock.json`, `vitest.config.js`, dan `tests/components/report-loading.test.tsx`. Manifest/lockfile juga memuat patch dependency dari workflow berikutnya; jangan mengatribusikan seluruh diff kepada testing.

## Empat kasus yang terverifikasi

1. Sukses: loading, satu pemicu unduhan sebelum satu write, nama PNG, payload total numerik, fixture tidak berubah, dan cleanup URL/link.
2. Dua native click dalam satu batch sebelum render ulang serta klik saat write pending tidak menambah capture/unduhan/write; loading tetap sampai promise selesai.
3. Capture gagal: class dan scroll pulih, loading berhenti, tidak ada write, retry berhasil.
4. Write Firebase mock menolak: loading berhenti dan retry dapat dijalankan.

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

jsdom tidak memverifikasi layout visual, rasterisasi canvas asli, dialog download browser, autentikasi live, atau Security Rules. Coverage numerik **belum diverifikasi**; tidak ada klaim persentase coverage. Selanjutnya lakukan review dan pengujian browser DEMO, lalu tambah kasus berdasarkan kebutuhan perilaku, bukan sekadar meniru implementasi.
