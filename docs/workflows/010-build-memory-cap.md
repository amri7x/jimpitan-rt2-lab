# Workflow 010 — Pembatasan memori build web

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Tujuan

Mencegah build web Vite mengambil heap Node tanpa batas pada laptop dengan RAM 8 GB setelah build sebelumnya berhenti ketika laptop kehabisan RAM.

## Temuan dan bukti

Skrip awal `build` pada `package.json` hanya menjalankan `vite build`, sehingga tidak menetapkan batas heap Node. Ini bukan bukti tunggal penyebab crash sebelumnya—log proses crash tidak tersedia—tetapi merupakan guardrail yang belum ada untuk proses bundler JavaScript.

Kondisi host saat pemeriksaan menunjukkan RAM total 7,6 GiB, memori tersedia 4,5 GiB, dan swap 2,0 GiB. Build diuji terlebih dahulu dengan `NODE_OPTIONS=--max-old-space-size=1536 npm run build`: berhasil (exit 0), mentransformasi 119 modul, selesai dalam 0,95 detik, dengan maximum resident set size 487.064 KiB menurut `/usr/bin/time`.

## Keputusan dan perubahan

`package.json` mengubah skrip `build` menjadi:

```json
"build": "node --max-old-space-size=1536 ./node_modules/vite/bin/vite.js build"
```

Batas 1.536 MiB menyisakan ruang bagi OS, browser, editor, dan proses pendukung pada RAM 8 GB, sementara hasil pengukuran build saat ini jauh di bawah batas tersebut. Pemanggilan lewat `node` memakai path lokal Vite sehingga tidak memerlukan package baru maupun konfigurasi environment shell khusus.

`PROJECT_MAP.md` diperbarui untuk mendokumentasikan perilaku perintah tersebut.

## Verifikasi aktual

| Perintah | Hasil aktual |
| --- | --- |
| `NODE_OPTIONS=--max-old-space-size=1536 npm run build` | Exit 0; 119 modul; maksimum RSS 487.064 KiB; 0,95 detik. |
| `npm run lint` | Exit 0 dengan empat peringatan yang sudah ada di workspace mobile: dua `no-useless-escape`, satu `only-export-components`, dan satu `exhaustive-deps`. Tidak ada error. |
| `npm run build` setelah perubahan skrip | Exit 0; 119 modul; maksimum RSS 483.944 KiB; 0,85 detik. |
| `git diff --check` | Exit 0; tidak ada kesalahan whitespace. |

## Risiko dan tindak lanjut

Batas heap hanya membatasi heap V8 proses Node utama; ia tidak menjadi jaminan bahwa seluruh child process atau aplikasi lain tidak akan memakai RAM. Jika build gagal dengan pesan heap out of memory setelah kode/aset bertambah, ukur ulang penggunaan puncak lalu naikkan batas secara bertahap, tanpa mengorbankan ruang untuk sistem operasi. Crash sebelumnya tidak dapat direproduksi tanpa log dan beban aplikasi saat itu.
