# Workflow 014 — Alias Metro CSS Interop

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Temuan dan solusi

Log bundling Android memuat `Unable to resolve "react-native-css-interop/jsx-runtime"` dari `@expo/log-box`. Paket CSS Interop versi `0.2.7` tersedia sebagai dependency NativeWind di `node_modules/nativewind/node_modules`, tetapi `@expo/log-box` yang ter-hoist tidak dapat mencapai lokasi tersebut melalui resolusi Metro normal.

`apps/mobile/metro.config.js` menambahkan `resolver.extraNodeModules["react-native-css-interop"]` ke direktori dependency NativeWind yang telah terpasang. Tidak ada dependency baru atau perubahan Tailwind web.

## Verifikasi aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Muat Metro config | Alias terpasang ke `node_modules/nativewind/node_modules/react-native-css-interop`. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning mobile yang sudah ada. |
| `npm run build` | Exit 0; build web mentransformasi 119 modul. |
| `git diff --check` | Exit 0. |

Bundling Android dari perangkat setelah alias ini **belum diverifikasi**; restart Metro dengan `--clear` diperlukan untuk menghapus cache resolver lama.
