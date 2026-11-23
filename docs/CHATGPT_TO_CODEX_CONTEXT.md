# Handoff Context — jimpitan-rt2-lab

> Ringkasan keputusan dari percakapan ChatGPT untuk digunakan sebagai konteks oleh Codex di VS Code. **Bukan sinkronisasi otomatis.**
> Diperbarui: 31 Oktober 2026. Informasi status berdasarkan laporan pengguna/Codex; verifikasi terhadap workspace dan Git lokal sebelum bertindak.

## Tujuan
Menyiapkan portofolio dan live coding interview posisi Junior AI Developer. Project asal `jimpitan-rt2` merupakan website nyata yang digunakan masyarakat. Clone `jimpitan-rt2-lab` harus aman untuk eksperimen, menggunakan Firebase **demo** dan data fiktif saja.

## Stack dan layanan
- React 19, TypeScript, Vite, Tailwind CSS, React Router.
- Firebase **Realtime Database** dan Authentication (Anonymous; Email/Password admin). Bukan Firestore untuk logika aplikasi.
- Pembuatan PNG laporan dengan `html2canvas`; Firebase menyimpan metadata laporan, bukan file PNG.
- Repository lokal di `~/Documents/Git-Projects/jimpitan-rt2-lab/` pada Zorin OS.
- `AGENTS.md` berisi aturan lingkungan khusus. Skill personal Codex berada di `~/.codex/skills/` dan mencakup `project-dev`, `refactor-skill`, `skill-maintenance`, `test-skill`.

## Git dan strategi demo
- `main`: baseline/stabil.
- `demo/loading-before`: snapshot sebelum fitur loading.
- `feature/report-loading`: branch pengembangan aktif menurut laporan terakhir.
- Pastikan `git status`, `git branch -avv` dan `git remote -v` sebelum mengedit/commit/push.
- Jangan reset/rebase/force-push atau mengubah baseline tanpa persetujuan pengguna.
- Untuk interview, tampilkan perbandingan before/after, prompt AI, review diff, test, dan penjelasan keputusan teknis. Tidak perlu membuat ulang project.

## Fitur loading laporan — status terakhir yang dilaporkan
Target: tombol **Unduh & Simpan Laporan** pada `src/pages/Home.tsx`, fungsi `eksekusiSelesaiDanKirim`.
- Sudah diimplementasikan: `isSavingReport`, guard `useRef` sinkron, label/loading disabled/`aria-busy`, reset dengan `finally`, cleanup scroll dan class capture dengan `finally` terpisah.
- Perilaku asli tetap: dynamic import `html2canvas`, urutan pemicu unduhan PNG lalu `set()` metadata laporan, path/payload, kalkulasi jimpitan, aturan penimpaan laporan tanggal yang sama.
- Tes komponen menggunakan `Vitest`, `jsdom`, React Testing Library dan mock Firebase/canvas/download. Laporan terbaru: 4/4 tes komponen lulus, tes bulanan lama, lint dan build juga lulus; `git diff --check` lulus.
- Keterbatasan: tampilan sticky, kualitas PNG, unduhan nyata, dan perilaku browser masih perlu verifikasi manual. Penanganan blob `null`, pesan error per tahap, dan hasil parsial PNG/Firebase merupakan pekerjaan terpisah.
- Jangan menganggap tes mock sebagai bukti integrasi Firebase live.

## Dependency/security — keputusan terakhir
- `npm audit`: 10 paket terdampak (9 high, 1 moderate); `npm audit --omit=dev`: 4 paket terhitung high, terutama rantai Firebase -> Firestore -> gRPC. Angka ini tidak berarti semuanya dapat dieksploitasi pada runtime browser.
- Analisis sebelumnya merekomendasikan patch dependency development kompatibel: Vite 8.1.6; PostCSS 8.5.23; Browserslist 4.28.7; baseline-browser-mapping 2.11.0; Nano ID 3.3.18; source-map-js 1.2.2. **Belum ada konfirmasi patch telah diterapkan.** Periksa dependency aktual dan advisory terbaru.
- Jangan paksa upgrade/downgrade Firebase ataupun override `@grpc/grpc-js` tanpa analisis dampak serta persetujuan eksplisit.
- Jangan pakai `npm audit fix --force`.
- Setelah patch: audit ulang, `npm ls`, tes bulanan, tes komponen, lint, build, git diff, dan pengujian manual CSS/browser.
- Firebase Security Rules memerlukan audit lanjut melalui Emulator. Jangan mengubah rules secara serampangan; fitur rollover bulanan bergantung pada sebagian izin saat ini.

## Batasan mutlak
- **Jangan** mengakses, mengubah, men-deploy, atau menguji Firebase **production**.
- **Jangan** mengganti data asli warga, kalkulasi keuangan, dan aturan bisnis tanpa persetujuan eksplisit.
- Gunakan mock/emulator atau Firebase demo yang telah diverifikasi; jangan menambahkan data sensitif ke Git.
- Jangan commit, push, deploy, install dependency baru, atau mengubah konfigurasi keamanan tanpa persetujuan sesuai tugas.
- Mulai setiap tugas dengan membaca `AGENTS.md`, memverifikasi Git status dan ruang lingkup, serta menyusun perubahan seminimal mungkin.

## Format latihan interview yang diminta pengguna
Selalu sertakan bagian berikut dalam hasil pembelajaran atau laporan:
1. **Misal interviewer bertanya:** pertanyaan contoh (termasuk Inggris bila relevan).
2. **Jawaban / Solusi:** penjelasan teknis sederhana dan akurat, sesuai implementasi aktual.
3. **Live Demo:** langkah yang dapat ditunjukkan di VS Code/browser.
4. **Bukti:** diff, test, commit, log yang relevan.

## Instruksi saat handoff ini dibaca Codex
1. Verifikasi isi dokumen ini terhadap keadaan repository; status dalam dokumen bisa sudah usang.
2. Laporkan perbedaan atau informasi yang belum terverifikasi.
3. Jangan melakukan perubahan hanya karena membaca dokumen ini.
4. Tanyakan persetujuan pengguna sebelum langkah yang berdampak pada dependency, Git remote, keamanan, atau Firebase.


## Koreksi status terverifikasi — 31 Oktober 2026

Catatan dependency di atas dipertahankan sebagai riwayat handoff. Patch sekarang telah diterapkan pada working tree: Vite 8.1.6 dan PostCSS 8.5.23 beserta pembaruan transitive. Audit ulang total/production masing-masing 4 high pada rantai Firebase/gRPC. Component tests 4/4, tes bulanan, lint, dan build lulus; build masih memperingatkan `@tailwind`. Rincian terkini: [log utama](ai-development-log.md), [workflow patch](workflows/004-dependency-security-patch.md), dan [audit](security-audit.md). Commit patch belum diverifikasi; jangan menganggapnya telah di-commit.
