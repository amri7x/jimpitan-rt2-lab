# Jimpitan RT 02 — Portfolio/Lab (Safe Clone)

Source code berbasis aplikasi jimpitan RT 02 dengan React + Vite + Firebase Realtime Database.
Paket ini untuk development dan portofolio; **bukan** konfigurasi produksi.

## Apa yang dipertahankan?
- Routing, layout, styling, kalkulasi jimpitan, laporan/rekap, dan autentikasi sebagaimana proyek asal.
- Model data Firebase Realtime Database, termasuk rollover bulan.

## Apa yang berbeda agar aman?
- `src/firebase.ts` hanya mengambil config dari `.env.local`, dan memblokir project production yang dikenali.
- `.env.local`, `.env` production, `.git`, `node_modules`, folder build, dan PDF sumber lama **tidak disertakan**.
- `src/data/financeHistory.ts` diganti data **fiktif** untuk import riwayat demo.
- `demo-data/seed-2026-10.json` berisi 8 nama fiktif dan transaksi fiktif.
- File `database.rules.json` tetap dari source asal, **perlu audit keamanan sebelum demo dipublikasikan**.

## Langkah setup

1. Buat **Firebase Project baru** khusus demo di Firebase Console; **jangan** tambah Web App saja pada project production.
2. Di project baru, enable Authentication: **Anonymous** dan **Email/Password** sesuai alur aplikasi.
3. Buat Realtime Database baru (pilih region), pilih **locked mode** untuk inisialisasi.
4. Di Firebase Console project demo, salin Web App config dari **Project settings**; `databaseURL` didapat dari Realtime Database project demo.
5. `cp .env.example .env.local` lalu isi hanya dengan nilai project demo. Jangan commit `.env.local`.
6. Publikasikan `database.rules.json` hanya ke **project demo** setelah meninjau permission-nya. Jangan pernah menerapkan rules ini ke production tanpa audit.
7. Impor `demo-data/seed-2026-10.json` melalui **Realtime Database > Data > Import JSON** di project demo untuk menampilkan data contoh; lakukan pada root database demo. **Import JSON bisa mengganti isi data pada path yang dipilih.** Pastikan tidak di project production.
8. Buat akun admin demo di Authentication. Isi `admins/<UID_ADMIN_DEMO> = true` lewat console database demo untuk mengaktifkan halaman Settings admin.
9. Jalankan `npm ci && npm run dev` dan verifikasi halaman menggunakan data dummy. `npm run lint` dan `npm run build` untuk verifikasi dasar.
10. Untuk publishing hosting dan GitHub publik, audit database rules, riwayat, dan seluruh file sekali lagi.

## Batasan
- ZIP ini tidak menyalin data produksi, akun Firebase, atau database backend.
- Jika bulan saat membuka website bukan Oktober 2026, kode akan mencoba membuat bulan aktif dari bulan sebelumnya. Data seed Oktober hanya menjamin tampilan awal ketika Oktober 2026. Jika ingin demo setelah bulan berganti, siapkan data bulan sebelumnya atau data demo bulan aktif yang sesuai.
- Halaman yang tidak memiliki data di project demo akan kosong sebelum di-seed.
- Jangan mengandalkan `AGENTS.md` atau pengecekan `projectId` sebagai satu-satunya kontrol akses.
- Tidak ada konfigurasi Firebase Hosting otomatis pada paket ini.
