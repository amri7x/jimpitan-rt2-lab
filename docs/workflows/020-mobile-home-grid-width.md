# Workflow 020 — Perbaikan lebar grid Home mobile

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Memperbaiki tampilan Home Android ketika grid tanggal tidak terlihat dan menjelaskan keadaan ketika tidak ada warga pada Firebase DEMO.

## Akar masalah dan keputusan

Screenshot Android menunjukkan panel `No / Nama` saja, sementara header tanggal serta grid setoran tidak terlihat. Inspeksi `apps/mobile/app/(tabs)/home.tsx` menemukan `ScrollView` horizontal grid berada dalam container `flex-row` tetapi tidak memiliki `flex-1`. Pada layout React Native, panel tersebut dapat kolaps ke lebar nol karena tidak meminta sisa ruang.

`className="flex-1"` ditambahkan ke `ScrollView` horizontal. Grid tanggal sekarang menggunakan sisa lebar layar di sebelah panel warga dan tetap dapat digeser horizontal. Tidak ada fungsi seed warga pada workspace mobile; jika listener Firebase DEMO mengembalikan data kosong, daftar sebelumnya terlihat kosong tanpa penjelasan. UI kini menampilkan `Belum ada warga.` pada panel kiri, tanpa menulis data baru ke Firebase.

## File yang berubah

- `apps/mobile/app/(tabs)/home.tsx`
- `docs/ai-development-log.md`
- `docs/workflows/020-mobile-home-grid-width.md`

## Pengujian dan hasil aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Inspeksi bundle Metro aktif | Memuat `className: "flex-1"` untuk `ScrollView` horizontal dan teks `Belum ada warga.`. |
| `npm run test` | Exit 0; 6/6 lulus. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning lama pada plugin Firebase dan `SessionProvider`. |
| `npm run build` | Exit 0; Vite mentransformasi 119 modul dalam 955 ms dengan heap maksimum 1.536 MiB. |
| Runtime perangkat | Belum diverifikasi setelah perubahan; perlu reload penuh pada HP. |

## Risiko dan pekerjaan berikutnya

- Perbaikan memastikan ruang grid tersedia, tetapi tidak membuat data warga. Isi Firebase DEMO untuk bulan aktif tetap perlu tersedia agar baris warga muncul.
- Reload penuh aplikasi Android dan geser grid ke kanan/kiri untuk memastikan tanggal terlihat. Jika status kosong tampil, verifikasi sumber data DEMO melalui proses yang disetujui; jangan memakai Firebase production.
- Tidak ada perubahan Rules, deployment, data Firebase, atau konfigurasi production.
