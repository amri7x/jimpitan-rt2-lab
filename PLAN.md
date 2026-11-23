# Rancangan Mobile Jimpitan RT 02

## Ringkasan

Buat aplikasi Android native dengan Expo development build, React Native, TypeScript, React Native Firebase, Expo Router, dan NativeWind v4. NativeWind adalah padanan Tailwind untuk React Native; versi stabilnya masih menggunakan Tailwind CSS v3, sedangkan NativeWind v5/Tailwind v4 masih pre-release. [NativeWind overview](https://www.nativewind.dev/docs)

Aplikasi mobile dan web tetap memakai Firebase DEMO yang sama, path Realtime Database yang sama, Rules yang sama, serta perilaku bisnis jimpitan yang sama. React Native Firebase dipilih karena mengakses Auth dan Realtime Database melalui SDK native; Expo development build diperlukan, bukan Expo Go. [Expo Firebase guide](https://docs.expo.dev/guides/using-firebase/)

## Implementasi

- Jadikan repository sebagai monorepo bertahap: web Vite tetap di root, tambah `apps/mobile`, dan tambah `packages/core` untuk tipe data, kalkulasi bulan/WIB, saldo, rollover, normalisasi warga, serta builder path Firebase.
- Pindahkan logic murni dari `src/data/monthly.ts`, `financeBalance.ts`, dan bagian waterfall Home ke `packages/core`; web dan mobile mengimpor package yang sama.
- Buat adapter Firebase terpisah untuk web dan native, dengan kontrak path/data identik:
  - `jimpitan/months/<bulan>`
  - `finance/months/<bulan>`
  - `sessions/<bulan>`
  - `locks/<bulan>`
  - `reports/<bulan>/<tanggal>`
  - `admins/<uid>`
- Konfigurasi mobile hanya menerima Firebase DEMO. File native Firebase dan environment lokal tidak di-commit; gunakan secret file/build environment untuk development build dan CI. Guard penolakan project production tetap diwajibkan.
- Pertahankan identitas saat ini: petugas memakai Anonymous Auth dan nama sesi; admin memakai Email/Password dan validasi `admins/<uid>`.
- Implementasikan navigasi Expo Router:
  - Login petugas
  - Home/Input Jimpitan
  - Rekap Jimpitan
  - Riwayat Keuangan
  - Admin/Settings, hanya bila user admin
- Home mobile memakai grid beku adaptif: kolom Nomor dan Nama Warga tetap, hari digeser horizontal, input nominal memakai modal/bottom sheet native. Status nol, terkunci, readonly, hari aktif, tunggakan, dan setoran mempertahankan makna web.
- Gunakan `AppState`: saat background, lepaskan lock sel aktif; session tetap hidup dengan heartbeat 30 detik dan timeout 2 menit, mengikuti konstanta web saat ini. Saat foreground, buat ulang heartbeat dan subscribe realtime.
- Ganti `html2canvas` dengan capture view native, preview laporan PNG, lalu Android share sheet. Setelah capture berhasil, simpan metadata laporan dengan payload/path yang sama seperti web.

## Antarmuka dan kompatibilitas

- Tidak ada migrasi skema Firebase atau perubahan Firebase Rules pada tahap ini.
- Kontrak data `ResidentRecord`, `SetoranRecord`, transaksi keuangan, recap harian, lock, dan session menjadi public interface package `@jimpitan/core`.
- UI NativeWind tidak menyalin CSS web secara langsung; gunakan utility class pada `View`, `Text`, `Pressable`, `TextInput`, dan komponen native. Hindari fitur CSS web seperti tabel HTML, sticky CSS, dan `html2canvas`.
- Tetap gunakan Firebase DEMO saja; Firebase JavaScript SDK juga mendukung React Native/Realtime Database, tetapi stack yang dipilih adalah SDK native. [Firebase supported environments](https://firebase.google.com/docs/web/environments-js-sdk)

## Test dan penerimaan

- Unit test bersama untuk kalkulasi WIB, rollover, waterfall, saldo, dan path database dijalankan oleh web serta mobile.
- Test mobile dengan mock Firebase untuk login anonymous/admin, limit empat petugas, lock/release background, input setoran, recap, transaksi admin, dan retry error realtime.
- Uji perangkat Android nyata untuk reconnect/background, horizontal grid, sticky kolom, share PNG, dan payload laporan.
- Acceptance criteria: perubahan yang dibuat dari web tampil realtime di mobile dan sebaliknya; laporan mobile menulis metadata identik; aplikasi tidak pernah menerima konfigurasi Firebase production.

## Asumsi yang dikunci

- Rilis pertama Android saja.
- Cakupan fitur paritas penuh dengan web.
- Distribusi laporan: preview PNG lalu share, bukan simpan ke galeri.
- Expo Router dipakai sebagai router native standar.
- NativeWind v4 dipakai demi stabilitas; evaluasi NativeWind v5/Tailwind v4 dilakukan terpisah setelah stabil.
