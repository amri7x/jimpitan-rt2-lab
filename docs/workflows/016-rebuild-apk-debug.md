# Workflow 016 — Build ulang APK debug Android

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Membangun ulang APK debug Android melalui terminal setelah VS Code crash pada percobaan sebelumnya, tanpa deployment, instalasi perangkat, atau koneksi Firebase production.

## Temuan dan keputusan

Panggilan awal `npm run mobile:build:low-memory` selesai dengan `BUILD SUCCESSFUL` dalam 35 detik, tetapi task `:app:packageDebug` dan `:app:assembleDebug` berstatus `UP-TO-DATE`. Oleh karena itu, output modul aplikasi dibersihkan lalu APK dibangun ulang dengan perintah berikut:

```bash
cd apps/mobile/android && CMAKE_BUILD_PARALLEL_LEVEL=1 ./gradlew :app:clean :app:assembleDebug --no-daemon --max-workers=1 -PreactNativeArchitectures=arm64-v8a
```

Pilihan ini mempertahankan profil RAM rendah yang telah ada: satu worker Gradle, satu pekerjaan CMake/Ninja, dan ABI `arm64-v8a`. Hanya direktori output build aplikasi yang dibersihkan; source, Rules, konfigurasi Firebase, dan data tidak diubah.

## Hasil aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Build awal `npm run mobile:build:low-memory` | Exit 0; `BUILD SUCCESSFUL` dalam 35 detik; 536 task (19 dieksekusi, 517 up-to-date). |
| Build bersih `:app:clean :app:assembleDebug` | Exit 0; `BUILD SUCCESSFUL` dalam 2m59s; 540 task (66 dieksekusi, 474 up-to-date). |
| Artefak APK | `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`; 91.067.018 byte; waktu modifikasi 12 November 2026 20:46 WIB. |
| Metadata artefak | Debug APK `id.jimpitan.rt2.lab`, versi `0.1.0` (`versionCode` 1), minimum SDK 24, ABI build `arm64-v8a`. |
| `npm run lint` | Exit 0, dengan empat warning non-blokir yang sudah tercatat pada plugin Firebase dan `SessionProvider`. |
| `npm run build` | Exit 0; Vite mentransformasi 119 modul dalam 439 ms. |

Log Gradle memuat warning kompatibilitas Android SDK XML, `NODE_ENV` tidak disetel ketika `expo-constants` membaca `.env.local`/`.env`, dua warning override manifest debug, dan deprecation Gradle menuju Gradle 10. Semua adalah warning; tidak ada kegagalan task atau crash VS Code/Gradle pada build terminal ini.

## File yang berubah

- `docs/ai-development-log.md`
- `docs/workflows/016-rebuild-apk-debug.md`
- Output build terabaikan Git di `apps/mobile/android/app/build/`

## Risiko dan pekerjaan lanjutan

APK ini adalah debug/development build untuk `arm64-v8a`; belum diuji instalasi atau runtime di perangkat. Build Gradle tidak membuktikan bundling Metro dari perangkat atau akses Firebase DEMO. Warning SDK XML, `NODE_ENV`, manifest debug, dan deprecation Gradle belum ditangani karena tidak menghalangi permintaan build ulang dan tidak ada perubahan source yang diperlukan.
