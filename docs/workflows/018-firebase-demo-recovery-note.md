# Workflow 018 — Catatan pemulihan guard Firebase DEMO

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Merekam titik kerja terakhir setelah VS Code crash karena tekanan RAM, ketika perangkat menampilkan pesan yang secara substansi mewajibkan penggunaan Firebase DEMO. Catatan ini dibuat agar status pemulihan dapat ditemukan tanpa membaca environment lokal atau konfigurasi Firebase sensitif.

## Temuan dan bukti

- `apps/mobile/src/services/firebase.ts` telah memuat `assertDemoFirebase()`. Guard menolak jika `EXPO_PUBLIC_FIREBASE_ENV` bukan `demo`, project ID dari aplikasi native kosong, atau project ID sama dengan ID production yang dilarang oleh clone ini.
- `apps/mobile/app/_layout.tsx` menjalankan guard tersebut saat layout dimuat. Jika gagal, aplikasi menampilkan error konfigurasi Firebase mobile dan tidak meneruskan ke sesi aplikasi.
- `apps/mobile/app.config.ts` hanya meneruskan `EXPO_PUBLIC_FIREBASE_ENV` menjadi `extra.firebaseEnvironment`. File Google services native hanya digunakan apabila variabel `GOOGLE_SERVICES_JSON` tersedia.
- `apps/mobile/.env.example` menyatakan environment hanya untuk Firebase DEMO dan melarang `google-services.json` masuk Git. `.gitignore` juga mengabaikan `.env.local` dan `google-services.json`.
- Pemeriksaan proses pada sesi pemulihan tidak menemukan proses Expo, Metro, Gradle, atau Java aktif. Memori tersedia sekitar 4,5 GiB dan swap tidak terpakai pada saat pemeriksaan.
- Artefak `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` tidak ditemukan pada pemeriksaan pemulihan, meskipun Workflow 016 sebelumnya mencatat build APK debug berhasil. Penyebab hilangnya artefak belum diverifikasi.

Pesan perangkat konsisten dengan guard yang ada. Namun, akar penyebab runtime yang spesifik belum dapat dipastikan: pemeriksaan ini sengaja tidak membuka atau mencatat isi `.env.local`, file Google services, identitas project DEMO, token, maupun data Firebase.

## Keputusan teknis

Tidak dilakukan perubahan source atau konfigurasi Firebase. Guard Firebase DEMO dipertahankan dan tidak boleh dilewati dengan konfigurasi production. Perbaikan hanya dapat dilanjutkan setelah environment lokal yang aman untuk project DEMO tersedia dan pengguna memilih untuk menjalankan verifikasi perangkat.

## File yang berubah

- `docs/ai-development-log.md`
- `docs/workflows/018-firebase-demo-recovery-note.md`

## Pengujian dan hasil aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Inspeksi source guard Firebase mobile | Guard dan layar error ditemukan; tidak ada perubahan file source. |
| Inspeksi konfigurasi Expo dan contoh environment | Konfigurasi hanya mendokumentasikan Firebase DEMO; tidak ada nilai sensitif dibaca atau dicatat. |
| Inspeksi proses build/dev aktif | Tidak ada Expo, Metro, Gradle, atau Java aktif. |
| Inspeksi artefak APK debug | APK tidak ditemukan pada saat pemeriksaan. |
| `npm run lint`, `npm run build`, typecheck, build APK, atau runtime perangkat | Tidak dijalankan dalam workflow ini; status hasil sebelumnya tidak dijadikan bukti verifikasi ulang. |

## Risiko dan pekerjaan berikutnya

- Runtime aplikasi pada perangkat dengan Firebase DEMO belum diverifikasi.
- Ketersediaan dan kecocokan file Google services DEMO belum diverifikasi; jangan memakai konfigurasi production sebagai pengganti.
- Jika akan melanjutkan, pastikan `EXPO_PUBLIC_FIREBASE_ENV=demo` dan jalur `GOOGLE_SERVICES_JSON` menunjuk ke file project DEMO yang disimpan di luar Git, lalu jalankan Metro atau build Android dengan profil low-memory. Rebuild APK hanya diperlukan bila artefak memang dibutuhkan kembali.
- Jangan mengubah Firebase Rules atau melakukan deploy tanpa persetujuan eksplisit dan konfirmasi target Firebase DEMO.
