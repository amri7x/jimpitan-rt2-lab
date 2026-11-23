# Workflow 011 — Build Android RAM terbatas

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Membuat build APK debug Android dapat dijalankan pada laptop RAM 8 GB tanpa lonjakan paralel Gradle dan CMake/Ninja yang menyebabkan build sebelumnya terhenti karena kekurangan RAM.

## Temuan dan bukti

`apps/mobile/android/gradle.properties` semula menetapkan JVM Gradle hingga 2.048 MiB dan `org.gradle.parallel=true`. Konfigurasi Gradle ringan (`:app:tasks`) sendiri mencapai maksimum RSS 888.808 KiB. Saat percobaan awal `assembleDebug` dengan Gradle satu worker, proses Ninja CMake masih membuka beberapa proses `clang++` paralel; Gradle daemon telah mencapai RSS 1.129.376 KiB saat proses-proses C++ tersebut berjalan. Percobaan dihentikan oleh agent sebelum menyelesaikan build agar tidak mempertaruhkan RAM host.

Perangkat Android yang terhubung melaporkan ABI `arm64-v8a`. Sebelumnya `reactNativeArchitectures` memuat empat ABI, sehingga build lokal dapat mengerjakan native library untuk arsitektur yang tidak diperlukan perangkat tersebut.

## Keputusan dan perubahan

- `apps/mobile/android/gradle.properties`: JVM Gradle dibatasi ke heap 1.536 MiB dan metaspace 384 MiB; daemon permanen dan mode paralel dimatikan; worker Gradle satu; compiler Kotlin memakai proses Gradle.
- `apps/mobile/package.json` dan root `package.json`: menambah `npm run mobile:build:low-memory`. Perintah menyusun `:app:assembleDebug`, memakai `--no-daemon`, satu worker, `CMAKE_BUILD_PARALLEL_LEVEL=1`, dan satu ABI. Default `arm64-v8a`; gunakan `MOBILE_ABI=x86_64 npm run mobile:build:low-memory` bila targetnya emulator x86_64.
- `apps/mobile/plugins/with-low-memory-gradle.cjs` dan `app.config.ts`: config plugin Expo menerapkan properti Gradle yang sama agar tetap ada saat native project dibuat ulang melalui prebuild.

Build low-memory menghasilkan APK debug, tetapi tidak memasang aplikasi ke perangkat dan tidak menghubungi Firebase.

## Verifikasi aktual

| Perintah | Hasil aktual |
| --- | --- |
| `adb -s c722a6d8 shell getprop ro.product.cpu.abi` | `arm64-v8a`. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run mobile:build:low-memory` | Exit 0; `BUILD SUCCESSFUL`; 536 task (75 dieksekusi, 461 up-to-date); 2 menit 46,94 detik; maksimum RSS 1.482.496 KiB. |

Build mengeluarkan peringatan SDK XML command-line tools, `NODE_ENV` tidak ditetapkan, API C++ React Native terdepresiasi, dan fitur Gradle terdepresiasi menuju Gradle 10. Tidak ada yang menghentikan build ini.

| `npm run lint` | Exit 0; empat warning lama pada workspace mobile (`no-useless-escape` dua kali, `only-export-components`, dan `exhaustive-deps`). |
| `npm run build` | Exit 0; build web Vite mentransformasi 119 modul. |
| `git diff --check` | Exit 0; tidak ada kesalahan whitespace. |

## Risiko dan tindak lanjut

Build sengaja lebih lambat karena serial. Batas JVM tidak membatasi seluruh penggunaan native compiler, namun `CMAKE_BUILD_PARALLEL_LEVEL=1` membatasi kompilasi Ninja yang menjadi sumber lonjakan paralel yang teramati. Integrasi config plugin pada proses `expo prebuild` **belum diverifikasi** dalam workflow ini agar tidak menimpa native project atau konfigurasi Firebase DEMO yang ada. APK/device runtime, instalasi, Metro, dan Firebase DEMO live juga belum diverifikasi.
