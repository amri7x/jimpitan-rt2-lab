# Workflow 013 — Konfigurasi Babel NativeWind

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Temuan dan solusi

Log perangkat menunjukkan `Android Bundling failed` dengan pesan `.plugins is not a valid Plugin property` ketika memproses `expo-router/entry.js`. `apps/mobile/babel.config.js` memasukkan `nativewind/babel` sebagai plugin. NativeWind v4 mengembalikan konfigurasi preset yang memiliki properti `plugins`; Babel menolaknya bila diletakkan di array plugin.

`nativewind/babel` dipindahkan ke array `presets` bersama `babel-preset-expo`. `react-native-reanimated/plugin` tetap di array plugin dan tetap terakhir.

## Verifikasi aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Muat konfigurasi Babel untuk `expo-router/entry.js` | Sukses: 2 preset, 1 plugin. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning mobile yang sudah ada. |
| `npm run build` | Exit 0; build web mentransformasi 119 modul. |
| `git diff --check` | Exit 0. |

Percobaan `expo export --platform android` dimulai dan Metro berjalan, namun dihentikan sengaja setelah tidak menghasilkan output selama beberapa menit; bundling Android penuh **belum diverifikasi** pada workflow ini. Tidak ada Firebase DEMO live, deploy, atau instalasi perangkat yang dilakukan.
