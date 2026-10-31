# AGENTS.md — Jimpitan RT 02 Lab

- Source ini **hanya untuk demo/portofolio**. Jangan membaca, menyalin, atau terhubung dengan Firebase production.
- Semua konfigurasi Firebase berasal dari `.env.local` milik project DEMO dan tidak boleh ditulis ke repository.
- Jangan menyalin database asli, riwayat warga, atau identitas pengguna ke dataset demo.
- Pertahankan perilaku bisnis jimpitan selama clonning; ajukan perubahan aturan bisnis sebagai usulan terpisah.
- Analisis akar masalah sebelum mengedit; tuliskan bukti dari error/log untuk setiap perbaikan.
- Periksa output `npm run lint` dan `npm run build` setelah perubahan.
- Tidak boleh mengubah rules atau melakukan deploy tanpa persetujuan pengguna dan konfirmasi target Firebase DEMO.

## Workflow Documentation

- Dokumentasikan setiap workflow yang selesai
  dan telah diverifikasi.
- Perbarui docs/ai-development-log.md.
- Simpan penjelasan detail di docs/workflows/.
- Catat masalah, solusi, file, hasil test,
  risiko, dan pekerjaan lanjutan.
- Jangan menghapus riwayat sebelumnya.
- Jangan mengklaim test berhasil jika belum diuji.
- Jangan mengubah dokumentasi pada tugas
  read-only tanpa persetujuan.
- Jangan commit atau push otomatis.

### Format dan bukti workflow

- Setelah workflow selesai, tambahkan entri bertanggal ke `docs/ai-development-log.md` dan tautkan detail di `docs/workflows/<nomor>-<topik>.md`. Pertahankan isi lama; koreksi informasi usang dengan catatan pembaruan yang jelas.
- Gunakan Bahasa Indonesia. Catat tujuan, temuan beserta bukti kode/error/log, keputusan teknis, file yang berubah, perintah testing dan hasil aktual, keterbatasan, serta pekerjaan berikutnya.
- Cantumkan branch yang diperiksa dan tanggal verifikasi. Pisahkan bukti pemeriksaan terbaru dari laporan sesi sebelumnya; tulis **belum diverifikasi** untuk informasi tanpa bukti. Jangan mengarang commit atau hasil pengujian.
- Untuk dependency/security, catat versi dan jumlah/severity temuan sebelum/sesudah serta temuan yang belum selesai di `docs/security-audit.md`. Audit paket tidak membuktikan eksploitabilitas aplikasi.
- Jangan menyimpan environment, secret, token, identitas warga asli, atau data produksi. Gunakan ringkasan log yang aman; file sementara bukan bukti permanen.
- Perbarui `PROJECT_MAP.md` bila struktur, alur, perintah, atau guardrail berubah. Dokumentasi tidak memberi izin mengubah source, dependency, Rules, atau melakukan deploy di luar lingkup tugas.
