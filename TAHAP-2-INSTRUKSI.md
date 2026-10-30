# Tahap 2 — Audit keamanan dan unit test

Paket incremental ini hanya menambahkan dokumen audit dan tes regresi. Tidak ada perubahan ke `database.rules.json`, kode React/Firebase, maupun `.env.local`.

## Cara memasang di project lokal yang sudah jalan

```bash
cd ~/Documents/Git-Projects/jimpitan-rt2-lab
unzip -n ~/Downloads/jimpitan-rt2-lab-tahap2-patch.zip -d .
npm pkg set 'scripts.test=node --experimental-strip-types --test tests/*.test.mjs'
npm run test
npm run lint
npm run build
```

`unzip -n` tidak menimpa file bernama sama. Paket mengandung dokumen ini, folder `tests/` dan `docs/`. Pastikan versi Node mendukung `--experimental-strip-types` (Node 22+ dianjurkan untuk tes ini). 

## Commit setelah review

```bash
git status
git add package.json tests/ docs/ TAHAP-2-INSTRUKSI.md
git commit -m "test: add monthly logic regression tests and security audit"
```

Jangan deploy rules yang sekarang ke hosting publik hanya berdasarkan unit test logika bulanan. Tes ini **bukan** Firebase Security Rules Emulator. Lihat `docs/security-audit.md` untuk temuan dan langkah berikutnya.
