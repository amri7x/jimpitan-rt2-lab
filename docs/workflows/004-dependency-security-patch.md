# Workflow 004 — Dependency security patch berdasarkan npm audit

Tanggal dokumentasi dan verifikasi: 31 Oktober 2026. Status: patch tersedia dalam working tree; empat paket high masih terbuka. [Log utama](../ai-development-log.md) · [Audit keamanan](../security-audit.md).

## Tujuan dan temuan

Mengurangi temuan development dependency dengan perubahan semver kompatibel tanpa mengubah Firebase/Firestore/gRPC, source React, rules, atau hosting. Audit sebelum patch dalam sesi sebelumnya mencatat 10 paket (9 high, 1 moderate), termasuk 4 paket production high. Bukti JSON sesi tersebut masih dapat diperiksa saat dokumentasi disusun, tetapi berada di `/tmp` dan bukan artefak repository permanen.

## Keputusan teknis dan file yang berubah

Hanya `package.json` dan `package-lock.json` pada workflow patch. Metadata resmi npm digunakan untuk memverifikasi Vite 8.1.6, PostCSS 8.5.23, engine, serta peer plugin React/Vitest. Node 24 memenuhi engine Vite `^20.19.0 || >=22.12.0`.

Vite/PostCSS dipasang pada versi minimum yang diverifikasi dan disimpan sebagai rentang caret. Dependency transitive diperbarui melalui `npm update browserslist baseline-browser-mapping nanoid source-map-js --ignore-scripts`, mengikuti rentang semver induk. Resolusi awal yang lebih luas dikoreksi ke Vite 8.1.6/PostCSS 8.5.23 sebelum verifikasi akhir. Tidak ada override, direct dependency tambahan untuk memaksa transitive, perubahan mayor, atau `npm audit fix --force`.

| Dependency | Terpasang sebelum patch | Terpasang setelah patch dan verifikasi ulang |
|---|---|---|
| vite | 8.1.3 | 8.1.6 |
| postcss | 8.5.16 | 8.5.23 |
| browserslist | 4.28.5 | 4.29.5 |
| baseline-browser-mapping | 2.10.42 | 2.11.34 |
| nanoid | 3.3.15 | 3.3.20 |
| source-map-js | 1.2.1 | 1.2.2 |

Rentang manifest berubah dari Vite `^8.1.1` menjadi `^8.1.6`, dan PostCSS `^8.5.16` menjadi `^8.5.23`. Versi sebelum patch bukan selalu versi HEAD karena working tree sudah berisi pekerjaan testing.

## Perubahan transitive di luar target

- Rolldown 1.1.4 → 1.1.5 beserta binding; `@oxc-project/types` 0.138.0 → 0.139.0.
- Lightning CSS 1.32.0 → 1.33.0 beserta binding.
- `@napi-rs/wasm-runtime` 1.1.6 → 1.2.6; `@tybys/wasm-util` 0.10.3 → 0.10.4.
- `caniuse-lite` 1.0.30001803 → 1.0.30001820; `electron-to-chromium` 1.5.389 → 1.5.470; `node-releases` 2.0.51 → 2.0.62; `update-browserslist-db` 1.2.3 → 1.3.4.

Perbandingan entri lockfile sebelum/sesudah pada sesi patch menunjukkan Firebase/gRPC identik; versi aktual dicatat dalam audit keamanan.

## Bukti audit dan regression testing

| Pemeriksaan | Sebelum patch | Sesudah patch; dikonfirmasi ulang saat dokumentasi |
|---|---|---|
| `npm audit` | 9 high, 1 moderate | 4 high, 0 moderate |
| `npm audit --omit=dev` | 4 high | 4 high |

Kedua audit terbaru exit 1 karena temuan masih ada; bukan kegagalan koneksi registry. `npm ls --all` berhasil pada sesi patch; `npm ls` dengan daftar dependency target dan Firebase berhasil diulang saat dokumentasi. Pada sesi patch, dev server berhasil start dan HTTP 200; dihentikan setelah pemeriksaan. Dev server tidak diuji ulang untuk tugas dokumentasi.

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

- Empat paket Firebase/gRPC tetap terbuka; jangan klaim semua vulnerability selesai. Keterjangkauan advisory pada runtime browser **belum diverifikasi**.
- Peringatan `@tailwind` masih ada; kesamaan visual CSS sebelum/sesudah belum diuji di browser. Diagnosis dan perbaikan CSS memerlukan pekerjaan terpisah.
- Evaluasi opsi Firebase/gRPC beserta kompatibilitas secara terpisah; jangan terapkan major downgrade yang disarankan audit atau override tanpa analisis dan persetujuan.
- Review manifest/lockfile dan dokumentasi sebelum commit. Tidak ada commit/push/deploy pada workflow ini oleh agent.
