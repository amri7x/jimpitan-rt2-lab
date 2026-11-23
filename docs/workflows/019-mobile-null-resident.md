# Workflow 019 — Toleransi data warga kosong di mobile

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Memperbaiki crash Android saat listener Firebase menerima entri warga atau rekap kosong dan menghilangkan warning Expo Router pada layout tab.

## Akar masalah dan keputusan

Log Android menunjukkan `TypeError: Cannot read property 'setoran' of null` pada `normalizeResidentDays`. Listener Home sebelumnya mengubah seluruh hasil `Object.values(data ?? {})` langsung menjadi `ResidentRecord`, padahal Firebase dapat mengembalikan nilai `null` untuk key warga yang kosong atau telah dihapus. `normalizeResidentDays` memang membutuhkan `ResidentRecord` valid, sehingga crash terjadi sebelum UI dapat dirender. Percobaan awal menggunakan helper array menghasilkan `TypeError: undefined is not a function` pada perangkat; posisi error berada pada pemanggilan `Object.values` di listener Home.

Log berikutnya juga menunjukkan `TypeError: Cannot read property 'status' of null` pada Rekap. Home dan Rekap sekarang mengiterasi record dengan `for...in`, mengabaikan nilai `null` atau `undefined` sebelum normalisasi atau render. Warga valid tetap dinormalisasi dan diurutkan berdasarkan ID, sedangkan status rekap valid tetap diurutkan berdasarkan hari. Pendekatan ini memakai fungsi core yang sudah digunakan aplikasi dan menghindari `Object.values`/`Object.entries` pada jalur runtime Android ini.

Warning `Layout children must be of type Screen` disebabkan `Tabs.Screen` Admin dirender secara kondisional. Screen sekarang selalu dideklarasikan; `href: null` menyembunyikannya ketika sesi bukan admin.

## File yang berubah

- `apps/mobile/app/(tabs)/home.tsx`
- `apps/mobile/app/(tabs)/rekap.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx`
- `docs/ai-development-log.md`
- `docs/workflows/019-mobile-null-resident.md`

## Pengujian dan hasil aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Inspeksi bundle Metro aktif | Bundle Android memuat `readResidents` dan `readRecap`, dengan iterasi `for...in` serta guard nilai null pada listener Home dan render Rekap. |
| `npm run test` | Exit 0; 6/6 lulus. |
| `npm run test:component` | Exit 0; 4/4 lulus. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning lama yang tidak terkait pada plugin Firebase dan `SessionProvider`. |
| `npm run build` | Exit 0; Vite mentransformasi 119 modul dalam 288 ms dengan heap maksimum 1.536 MiB. |
| Runtime perangkat | Belum diverifikasi; perlu reload penuh manual dengan Firebase DEMO. |

## Risiko dan pekerjaan berikutnya

- Perubahan menangani nilai warga `null` dan `undefined`; record warga non-null tetapi rusak belum divalidasi secara skematis agar aturan bisnis existing tidak berubah tanpa keputusan terpisah.
- Lakukan reload penuh aplikasi pada perangkat dengan Firebase DEMO untuk memastikan crash dan warning tidak muncul kembali. Metro dibiarkan berjalan pada port 8081 agar log runtime berikutnya dapat diperiksa.
- Tidak ada perubahan Rules, deployment, data Firebase, atau konfigurasi production.
