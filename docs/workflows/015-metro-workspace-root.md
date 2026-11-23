# Workflow 015 — Batas root Metro workspace mobile

Tanggal verifikasi: 12 November 2026. Branch diperiksa: `feature/report-loading`.

## Temuan dan solusi

Bundling Android berulang kali berhenti pada 99,89% setelah menemukan 1.861 modul. Proses Metro tetap aktif dan memakai CPU, sementara RAM tersedia 4,2 GiB; ini bukan bukti kekurangan RAM. Log Expo menunjukkan server root dinaikkan ke root monorepo dan autolinking workspace aktif.

Skrip start mobile sekarang menetapkan `EXPO_NO_METRO_WORKSPACE_ROOT=1`, guard resmi Expo untuk mencegah kenaikan root Metro ke workspace parent. Verifikasi server pada port 8082 menunjukkan server root dan project root kembali ke workspace mobile, dengan autolinking workspace nonaktif.

## Verifikasi aktual

| Pemeriksaan | Hasil |
| --- | --- |
| Metro offline port 8082 | Mulai sukses; root server/project dibatasi ke workspace mobile. |
| `npm run mobile:typecheck` | Exit 0. |
| `npm run lint` | Exit 0 dengan empat warning mobile yang sudah ada. |
| `npm run build` | Exit 0; build web mentransformasi 119 modul. |
| `git diff --check` | Exit 0. |

Bundling perangkat setelah perubahan root Metro belum diverifikasi; server aktif lama perlu dihentikan dan dimulai ulang.
