# Workflow 017 — Penyatuan React untuk Metro mobile

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Menghilangkan error runtime Android `Invalid hook call` yang terjadi sesudah `expo-router/entry` selesai dibundel.

## Akar masalah dan keputusan

Log perangkat menunjukkan `ExpoRoot` memanggil `useMemo` ketika dispatcher React bernilai `null`. Pemeriksaan `npm ls react --workspace=@jimpitan/mobile --all` memperlihatkan dua salinan React: `apps/mobile/node_modules/react` versi 19.2.3 dan root `node_modules/react` versi 19.2.7. React Native 0.86.3 menggunakan 19.2.7, sedangkan `metro.config.js` secara eksplisit mengarahkan `react` ke salinan mobile 19.2.3. Ketidaksamaan instance inilah yang menyebabkan hook dijalankan dengan dispatcher dari renderer berbeda.

`apps/mobile/package.json` kini menyatakan `react` 19.2.7, kemudian `npm install --workspace=@jimpitan/mobile` menyelaraskan lockfile dan menghapus dua paket duplikat. Metro dipertahankan memakai pemetaan singleton eksplisit, tetapi targetnya diubah dari `apps/mobile/node_modules` ke `node_modules` root. Setelah instalasi, `npm ls` menunjukkan seluruh dependency mobile memakai React 19.2.7 yang ter-deduplikasi; salinan `apps/mobile/node_modules/react` tidak lagi ada.

## File yang berubah

- `apps/mobile/package.json`
- `apps/mobile/metro.config.js`
- `package-lock.json`
- `docs/ai-development-log.md`
- `docs/workflows/017-react-singleton-metro.md`

## Verifikasi aktual

| Pemeriksaan | Hasil |
| --- | --- |
| `npm install --workspace=@jimpitan/mobile` | Exit 0; dua paket duplikat dihapus. Audit instalasi melaporkan 13 temuan dependency (3 moderate, 10 high); tidak diperbaiki dalam workflow ini. |
| `npm ls react --workspace=@jimpitan/mobile --all` | Exit 0; seluruh dependency mobile ter-deduplikasi ke React 19.2.7. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning non-blokir yang telah ada pada plugin Firebase dan `SessionProvider`. |
| `npm run build` | Exit 0; Vite mentransformasi 119 modul dalam 404 ms. |
| Metro offline + cache bersih | Server Expo berhasil berjalan pada port 8083. Permintaan bundle `node_modules/expo-router/entry` Android sukses: 1.904 modul dalam 15.110 ms. Tidak ada `Invalid hook call` dalam log bundling ini. |

Percobaan awal meneruskan parameter port melalui `npm run mobile:start` secara keliru sehingga Expo membaca `8083` sebagai project root dan berhenti dengan `Invalid project root`. Perintah CLI langsung berikut berhasil dan menjadi bukti pemeriksaan Metro:

```bash
EXPO_NO_METRO_WORKSPACE_ROOT=1 NODE_PATH=./node_modules ../../node_modules/.bin/expo start --dev-client --clear --offline --port 8083
```

Server dihentikan setelah verifikasi. Tidak ada deploy, perubahan Rules, atau koneksi Firebase production.

## Keterbatasan dan tindak lanjut

Bundling sukses membuktikan resolusi modul, tetapi belum membuktikan lifecycle runtime penuh pada perangkat. Hentikan server Metro lama, kemudian dari direktori `apps/mobile` jalankan `npm run start -- --clear` atau gunakan Expo CLI langsung, dan buka development build pada perangkat ARM64. Jika error hook tidak muncul kembali, perbaikan runtime dapat dianggap terkonfirmasi. APK debug tidak dibangun ulang pada workflow ini karena perubahan hanya dependency JavaScript/resolver Metro; lakukan rebuild bila ingin artefak development build baru.
