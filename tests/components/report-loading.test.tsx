import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Home } from '../../src/pages/Home';

const mocks = vi.hoisted(() => ({
  set: vi.fn(),
  capture: vi.fn(),
  residents: [] as unknown[],
}));

// Mock the initialization module as well as the SDK: no Firebase app is created.
vi.mock('../../src/firebase', () => ({ auth: { currentUser: { uid: 'demo-test' } }, db: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    callback({ uid: 'demo-test' });
    return () => {};
  },
  signInAnonymously: vi.fn(),
}));
vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => path,
  set: mocks.set,
  get: vi.fn(async () => ({ exists: () => false })),
  onDisconnect: () => ({ remove: vi.fn() }),
  onValue: (path: string, callback: (snapshot: unknown) => void) => {
    callback({ val: () => path.endsWith('/warga') ? mocks.residents : null });
    return () => {};
  },
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
  runTransaction: vi.fn(),
}));
vi.mock('html2canvas', () => ({ default: mocks.capture }));

const fixedTime = new Date('2026-10-30T05:00:00Z');
const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
let download: ReturnType<typeof vi.spyOn>;
let toBlob: ReturnType<typeof vi.fn>;
let downloadedNames: string[];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedTime);
  // Today's mixed values exercise numeric totals and exclude other dates.
  mocks.residents = [2, 3, 0, '-', null].map((nilai, index) => {
    const days = Array.from({ length: 31 }, (_, day) => ({
      nilai: day === 29 ? nilai : 99, asalTanggal: null,
      petugas: 'Fixture', isManual: false, wasDash: false,
    }));
    return { id: index + 1, nama: `Warga Fiktif ${index + 1}`, setoran: days,
      setoranAwal: structuredClone(days), tunggakan: 0, lebih: 0, logHutang: '' };
  });
  mocks.set.mockReset().mockResolvedValue(undefined);
  toBlob = vi.fn((callback: BlobCallback) => callback(new Blob(['fake PNG'], { type: 'image/png' })));
  mocks.capture.mockReset().mockResolvedValue({ toBlob });
  vi.stubGlobal('alert', vi.fn());
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); }));
  vi.stubGlobal('WebSocket', vi.fn(() => { throw new Error('Unexpected WebSocket'); }));
  vi.stubGlobal('XMLHttpRequest', vi.fn(() => { throw new Error('Unexpected XMLHttpRequest'); }));
  vi.stubGlobal('URL', Object.assign(class extends URL {}, {
    createObjectURL: vi.fn(() => 'blob:test-report'), revokeObjectURL: vi.fn(),
  }));
  downloadedNames = [];
  download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    downloadedNames.push(this.download);
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  delete HTMLElement.prototype.scrollTo;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function openHome() {
  render(<Home />);
  fireEvent.change(screen.getByPlaceholderText('Masukkan nama petugas...'), { target: { value: 'Petugas Fiktif' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Buka Akses Website' })); });
  // Settle the unrelated initial auto-scroll before testing capture restoration.
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  mocks.set.mockClear(); // Exclude the login session write from report assertions.
  return screen.getByRole('button', { name: 'Unduh & Simpan Laporan' });
}

function expectBusy(button: HTMLElement, busy: boolean) {
  expect((button as HTMLButtonElement).disabled).toBe(busy);
  expect(button.getAttribute('aria-busy')).toBe(String(busy));
  expect(button.textContent).toBe(busy ? 'Memproses laporan...' : 'Unduh & Simpan Laporan');
}

async function finishCapture() {
  await act(async () => {
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(300);
  });
}

test('sukses: loading, satu unduhan sebelum satu write, nama PNG dan payload asli', async () => {
  const button = await openHome();
  const original = structuredClone(mocks.residents);
  fireEvent.click(button);
  expectBusy(button, true);
  expect(mocks.capture).not.toHaveBeenCalled();
  await finishCapture();
  expectBusy(button, false);
  expect(download).toHaveBeenCalledTimes(1);
  expect(downloadedNames).toEqual(['Jimpitan_2026-10_30.png']);
  expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
  expect(mocks.set).toHaveBeenCalledExactlyOnceWith('reports/2026-10/2026-10-30', {
    tanggal: '2026-10-30', bulan: '2026-10', totalSetoran: 5, jumlahWarga: 5,
    dibuatOleh: 'Petugas Fiktif', dibuatPada: Date.now(),
  });
  expect(download.mock.invocationCallOrder[0]).toBeLessThan(mocks.set.mock.invocationCallOrder[0]);
  expect(mocks.residents).toEqual(original);
  expect(document.querySelector('a[download]')).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-report');
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('Laporan tersimpan'));
});

test('klik dalam batch sebelum render ulang dan klik saat Firebase pending tidak menambah operasi', async () => {
  const pending = deferred();
  const button = await openHome();
  mocks.set.mockReturnValue(pending.promise);
  // Native events inside one act batch exercise the synchronous guard before
  // React commits disabled=true; fireEvent's individual act wrappers would not.
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect((button as HTMLButtonElement).disabled).toBe(false);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expectBusy(button, true);
  await finishCapture();
  expectBusy(button, true);
  fireEvent.click(button);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expectBusy(button, true);
  expect(mocks.capture).toHaveBeenCalledTimes(1);
  expect(download).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledTimes(1);
  expect(alert).not.toHaveBeenCalled();
  await act(async () => { pending.resolve(); });
  expectBusy(button, false);
});

test('render gagal: sticky dan scroll dipulihkan, loading berhenti dan retry berhasil', async () => {
  const button = await openHome();
  const table = screen.getByRole('table');
  const wrapper = table.parentElement!;
  wrapper.scrollLeft = 123;
  wrapper.scrollTop = 45;
  const pendingCapture = deferred();
  mocks.capture.mockReturnValueOnce(pendingCapture.promise);
  fireEvent.click(button);
  await finishCapture();
  expectBusy(button, true);
  expect(wrapper.scrollLeft).toBe(0);
  expect(wrapper.scrollTop).toBe(0);
  expect(table.classList.contains('disable-sticky-capture')).toBe(true);
  await act(async () => { pendingCapture.reject(new Error('Simulated canvas failure')); });
  expectBusy(button, false);
  expect(wrapper.scrollLeft).toBe(123);
  expect(wrapper.scrollTop).toBe(45);
  expect(table.classList.contains('disable-sticky-capture')).toBe(false);
  expect(download).not.toHaveBeenCalled();
  expect(mocks.set).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('Gagal menyimpan laporan'));
  fireEvent.click(button);
  await finishCapture();
  expectBusy(button, false);
  expect(download).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledTimes(1);
});

test('Firebase menolak: loading berhenti, tombol bisa dipakai untuk retry', async () => {
  const button = await openHome();
  mocks.set.mockRejectedValueOnce(new Error('permission_denied'));
  fireEvent.click(button);
  await finishCapture();
  expectBusy(button, false);
  expect(download).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledTimes(1);
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('Gagal menyimpan laporan'));
  fireEvent.click(button);
  await finishCapture();
  expectBusy(button, false);
  expect(download).toHaveBeenCalledTimes(2);
  expect(mocks.set).toHaveBeenCalledTimes(2);
});
