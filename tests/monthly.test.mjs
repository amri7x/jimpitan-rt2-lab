import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptySetoran,
  getActiveMonthKey,
  getDaysInMonth,
  getMonthPaths,
  getPreviousMonthKey,
  getTodayInJakarta,
  prepareResidentForMonth,
} from '../src/data/monthly.ts';

test('bulan aktif dihitung menggunakan zona waktu Jakarta (bukan UTC)', () => {
  assert.equal(getActiveMonthKey(new Date('2026-10-31T17:30:00.000Z')), '2026-11');
  assert.equal(getTodayInJakarta(new Date('2026-10-31T17:30:00.000Z')), '2026-11-01');
});

test('jumlah hari sesuai kalender, termasuk tahun kabisat', () => {
  assert.equal(getDaysInMonth('2024-02'), 29);
  assert.equal(getDaysInMonth('2025-02'), 28);
  assert.equal(getDaysInMonth('2026-10'), 31);
  assert.throws(() => getDaysInMonth('2026-13'), /Format bulan tidak valid/);
});

test('perpindahan bulan Januari menuju Desember tahun sebelumnya', () => {
  assert.equal(getPreviousMonthKey('2026-01'), '2025-12');
  assert.equal(getPreviousMonthKey('2026-11'), '2026-10');
});

test('template setoran baru tidak berbagi objek antarhari', () => {
  const setoran = createEmptySetoran(2);
  assert.equal(setoran.length, 2);
  assert.notEqual(setoran[0], setoran[1]);
  assert.equal(setoran[0].nilai, null);
  assert.equal(setoran[1].isManual, false);
});

test('persiapan bulan baru membawa saldo, tetapi mengosongkan setoran', () => {
  const resident = {
    id: 1, nama: 'Warga Demo A', tunggakanAwal: 0, lebihAwal: 0,
    tunggakan: 2000, lebih: 3000, logHutangAwal: '', logHutang: 'Catatan contoh',
    setoranAwal: [{ nilai: 2000, asalTanggal: null, petugas: 'Demo', isManual: true, wasDash: false }],
    setoran: [{ nilai: 2000, asalTanggal: null, petugas: 'Demo', isManual: true, wasDash: false }],
  };
  const next = prepareResidentForMonth(resident, 30);
  assert.equal(next.tunggakanAwal, 2000);
  assert.equal(next.lebihAwal, 3000);
  assert.equal(next.setoran.length, 30);
  assert.ok(next.setoran.every((entry) => entry.nilai === null));
  assert.equal(resident.setoran[0].nilai, 2000, 'data bulan lama tidak berubah');
});

test('path database untuk data bulanan konsisten', () => {
  assert.deepEqual(getMonthPaths('2026-10'), {
    month: 'jimpitan/months/2026-10',
    warga: 'jimpitan/months/2026-10/warga',
    recap: 'jimpitan/months/2026-10/recap/days',
    transactions: 'finance/months/2026-10/transactions',
    deposits: 'finance/months/2026-10/deposits',
    sessions: 'sessions/2026-10',
    locks: 'locks/2026-10',
    reports: 'reports/2026-10',
  });
});
