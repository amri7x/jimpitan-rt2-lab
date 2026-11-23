import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, set, onValue, onDisconnect, get, remove, runTransaction, update } from 'firebase/database';
import { getActiveMonthKey, getDaysInMonth, getMonthPaths, getPreviousMonthKey, getTodayInJakarta, monthLabel, prepareResidentForMonth, type DailyRecapStatus, type ResidentRecord, type SetoranRecord } from '../data/monthly';

type Setoran = SetoranRecord;
type Warga = ResidentRecord;

const createBlankSetoran = (): Setoran => ({
  nilai: null,
  asalTanggal: null,
  petugas: null,
  isManual: false,
  wasDash: false,
});

const normalizeWargaDays = (warga: Warga, days: number): Warga => ({
  ...warga,
  setoran: Array.from({ length: days }, (_, index) => warga.setoran[index] ?? createBlankSetoran()),
  setoranAwal: Array.from({ length: days }, (_, index) => warga.setoranAwal?.[index] ?? createBlankSetoran()),
});

interface Petugas {
  nama: string;
  device: string;
  waktu: string;
  lastActiveAt?: number;
}

const SESSION_TIMEOUT_MS = 2 * 60 * 1000;
const SESSION_HEARTBEAT_MS = 30 * 1000;

export const Home: React.FC = () => {
  const [daftarWarga, setDaftarWarga] = useState<Warga[]>([]);
  const [petugas, setPetugas] = useState<Petugas | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [bulanAktif, setBulanAktif] = useState(getActiveMonthKey);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [lockedCells, setLockedCells] = useState<Record<string, string>>({});
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, DailyRecapStatus>>({});
  const [dataError, setDataError] = useState("");
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);

  // UI States
  const [numpad, setNumpad] = useState<{ vis: boolean, idWarga: number, idxTgl: number, nama: string, val: string } | null>(null);
  const [flashingCells, setFlashingCells] = useState<string[]>([]);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number, y: number, text: string } | null>(null);
  const [notesPopup, setNotesPopup] = useState<{ nama: string, log: string } | null>(null);
  
  const [waktuWIB, setWaktuWIB] = useState<string>("");
  const [tanggalHariIniWIB, setTanggalHariIniWIB] = useState<number>(new Date().getDate());

  const tableRef = useRef<HTMLDivElement>(null);
  const savingReportRef = useRef(false);
  const jumlahHari = getDaysInMonth(bulanAktif);
  const listTanggal = Array.from({ length: jumlahHari }, (_, i) => i + 1);
  const headerHariIniRef = useRef<HTMLTableHeaderCellElement>(null);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUid(user?.uid ?? null);
    if (!user && petugas) setPetugas(null);
  }), [petugas]);

  useEffect(() => {
    if (!authUid) {
      setIsAdmin(false);
      return;
    }
    return onValue(ref(db, `admins/${authUid}`), (snap) => setIsAdmin(snap.val() === true));
  }, [authUid]);

  // 🟢 AUTO SCROLL: Diperbaiki agar tidak tertutup kolom sticky
  useEffect(() => {
    if (isFirstLoadDone && headerHariIniRef.current && tableRef.current) {
      const targetHeader = headerHariIniRef.current;
      setTimeout(() => {
        const posisiTarget = targetHeader.offsetLeft;
        // Geser ke target, dikurangi 200px (kompensasi lebar kolom No & Nama)
        tableRef.current?.scrollTo({ 
          left: Math.max(0, posisiTarget - 200), // Mencegah nilai minus jika di awal tabel
          behavior: 'smooth' 
        });
      }, 300);
    }
  }, [isFirstLoadDone]);

  useEffect(() => {
    const updateJamWIB = () => {
      const opsi: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setWaktuWIB(new Intl.DateTimeFormat('id-ID', opsi).format(new Date()) + " WIB");
      setTanggalHariIniWIB(parseInt(new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric' }).format(new Date())));
      setBulanAktif(getActiveMonthKey());
    };
    updateJamWIB();
    const intervalJam = setInterval(updateJamWIB, 1000);
    return () => clearInterval(intervalJam);
  }, []);

  // 🟢 FIREBASE LISTENER
  useEffect(() => {
    if (!petugas) return;
    const monthPaths = getMonthPaths(bulanAktif);
    let active = true;
    const unsubData = onValue(ref(db, monthPaths.warga), (snap) => {
      const raw = snap.val();
      if (raw) {
        setDataError("");
        const residents = (Array.isArray(raw) ? raw : Object.values(raw)).filter((resident): resident is Warga =>
          Boolean(resident && typeof resident === 'object' && typeof resident.id === 'number' && Array.isArray(resident.setoran))
        ).map((resident) => normalizeWargaDays(resident, jumlahHari));
        setDaftarWarga(residents);
        setIsFirstLoadDone(true);
      } else {
        void initializeMonthData();
      }
    }, (error) => {
      setDataError(error.message);
      setIsFirstLoadDone(true);
    });

    const unsubSesi = onValue(ref(db, `sessions/${bulanAktif}`), (snap) => {
      const dataSesi = snap.val();
      const activeNames = dataSesi
        ? Object.values(dataSesi as Record<string, Petugas>)
            .filter((session) => typeof session?.lastActiveAt === 'number' && Date.now() - session.lastActiveAt < SESSION_TIMEOUT_MS)
            .map((session) => session.nama)
        : [];
      setActiveUsers(activeNames);
    });

    const unsubKunci = onValue(ref(db, `locks/${bulanAktif}`), (snap) => setLockedCells(snap.val() || {}));
    const unsubStatus = onValue(ref(db, `${monthPaths.month}/recap/days`), (snap) => setDailyStatuses(snap.val() || {}));

    async function initializeMonthData() {
      try {
        const days = getDaysInMonth(bulanAktif);
        const migrationRef = ref(db, 'system/legacyDataImported');
        const migrationSnap = await get(migrationRef);
        const legacySnap = migrationSnap.exists() ? null : await get(ref(db, 'data_jimpitan'));
        const previousMonth = getPreviousMonthKey(bulanAktif);
        const previousSnap = legacySnap?.exists() ? null : await get(ref(db, getMonthPaths(previousMonth).month));
        const source = legacySnap?.exists()
          ? legacySnap.val()
          : previousSnap?.child('warga').val();
        if (!source) {
          if (active) setIsFirstLoadDone(true);
          return;
        }

        const residents = (Array.isArray(source) ? source : Object.values(source)).filter((resident): resident is Warga =>
          Boolean(resident && typeof resident === 'object' && typeof resident.id === 'number' && Array.isArray(resident.setoran))
        );
        const wargaById = Object.fromEntries(residents.map((resident) => {
          const normalized = legacySnap?.exists()
            ? {
                ...resident,
                setoran: [...resident.setoran.slice(0, days), ...Array.from({ length: Math.max(0, days - resident.setoran.length) }, () => ({ nilai: null, asalTanggal: null, petugas: null, isManual: false, wasDash: false }))],
                setoranAwal: [...resident.setoranAwal.slice(0, days), ...Array.from({ length: Math.max(0, days - resident.setoranAwal.length) }, () => ({ nilai: null, asalTanggal: null, petugas: null, isManual: false, wasDash: false }))],
              }
            : prepareResidentForMonth(resident, days);
          return [String(resident.id), normalized];
        }));
        const monthRef = ref(db, monthPaths.month);
        const result = await runTransaction(monthRef, (current) => current ?? {
          monthKey: bulanAktif,
          status: 'active',
          createdAt: Date.now(),
          warga: wargaById,
        });
        if (result.snapshot.exists() && legacySnap?.exists()) await set(migrationRef, bulanAktif);
        if (result.committed && previousSnap?.exists()) {
          await update(ref(db), {
            [`${getMonthPaths(previousMonth).month}/status`]: 'archived',
            [`${getMonthPaths(previousMonth).month}/archivedAt`]: Date.now(),
          });
        }
      } catch {
        if (active) alert('Gagal menyiapkan data bulan ini di Firebase. Periksa koneksi dan aturan akses database.');
      }
    }

    return () => { active = false; unsubData(); unsubSesi(); unsubKunci(); unsubStatus(); };
  }, [petugas, bulanAktif, jumlahHari]);

  useEffect(() => {
    if (!petugas || !auth.currentUser) return;
    const sessionRef = ref(db, `sessions/${bulanAktif}/${auth.currentUser.uid}`);
    const refreshSession = () => {
      void update(sessionRef, { lastActiveAt: Date.now() });
    };
    refreshSession();
    const interval = setInterval(refreshSession, SESSION_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [petugas, bulanAktif, authUid]);

  const handleLogin = async () => {
    if (!loginInput.trim()) return;
    try {
      if (!auth.currentUser) {
        const credential = await signInAnonymously(auth);
        setAuthUid(credential.user.uid);
      }
    } catch {
      alert('Gagal membuka sesi jimpitan. Periksa koneksi dan aktifkan Anonymous Authentication di Firebase.');
      return;
    }
    const usersSnap = await get(ref(db, `sessions/${bulanAktif}`));
    const activeSessions = usersSnap.exists()
      ? Object.entries(usersSnap.val() as Record<string, Petugas>).filter(([uid, session]) =>
          uid !== auth.currentUser?.uid && typeof session?.lastActiveAt === 'number' && Date.now() - session.lastActiveAt < SESSION_TIMEOUT_MS
        )
      : [];
    if (activeSessions.length >= 4) {
      alert("Akses ditolak! Maksimal 4 petugas aktif."); return;
    }
    const myRef = ref(db, `sessions/${bulanAktif}/${auth.currentUser?.uid}`);
    onDisconnect(myRef).remove();
    const userSession = { nama: loginInput, device: navigator.userAgent.includes("Mobile") ? "HP" : "PC/Laptop", waktu: new Date().toLocaleString('id-ID'), lastActiveAt: Date.now() };
    await set(myRef, userSession);
    setPetugas(userSession);
  };

  const klikSel = async (e: React.MouseEvent, idWarga: number, idxTgl: number, selData: Setoran, namaWarga: string) => {
    if (selData.nilai === 0 && selData.asalTanggal !== null && !isAdmin) {
      const tanggalAsal = selData.asalTanggal + 1; 
      setTooltipInfo({ 
        x: e.clientX, 
        y: e.clientY, 
        text: `Sudah dibayar tanggal ${tanggalAsal}, jadi tidak perlu diambil.` 
      });
      return;
    }

    const tglKolom = idxTgl + 1;
    if (tglKolom !== tanggalHariIniWIB && !isAdmin) return;

    const cellKey = `${idWarga}_${idxTgl}`;
    if (lockedCells[cellKey] && lockedCells[cellKey] !== petugas?.nama) {
      alert(`Sel ini sedang diinput oleh rekan Anda: ${lockedCells[cellKey]}`); return;
    }

    const lockRef = ref(db, `locks/${bulanAktif}/${cellKey}`);
    await set(lockRef, petugas?.nama);
    onDisconnect(lockRef).remove();
    
    let displayVal = typeof selData.nilai === "number" ? selData.nilai.toString() : "";
    setNumpad({ vis: true, idWarga, idxTgl, nama: namaWarga, val: displayVal });
  };

  const tutupNumpad = () => {
    if (numpad) {
      remove(ref(db, `locks/${bulanAktif}/${numpad.idWarga}_${numpad.idxTgl}`));
      setNumpad(null);
    }
  };

  const ubahStatusSetoranHarian = async (tanggal: number) => {
    if (!isAdmin || !petugas) return;
    const key = `${bulanAktif}-${String(tanggal).padStart(2, '0')}`;
    const currentStatus = dailyStatuses[String(tanggal)]?.status;
    const nextStatus = currentStatus === 'sudah' ? 'belum' : 'sudah';
    await set(ref(db, `${getMonthPaths(bulanAktif).month}/recap/days/${tanggal}`), {
      status: nextStatus,
      diperbaruiOleh: petugas.nama,
      diperbaruiPada: Date.now(),
      tanggal: key,
    });
  };

  const picuEfekKedipLokal = (idWarga: number, idxTgl: number) => {
    const key = `${idWarga}_${idxTgl}`;
    setFlashingCells(prev => [...prev, key]);
    setTimeout(() => setFlashingCells(prev => prev.filter(k => k !== key)), 1500); 
  };

  // 🟢 ENGINE WATERFALL (DIPERBAIKI)
 const jalankanKalkulasiWaterflow = (wargaTarget: Warga, setoranTerupdate: Setoran[]) => {
  let tunggakanBerjalan = wargaTarget.tunggakanAwal;
  let lebihBerjalan = wargaTarget.lebihAwal;
  let logHutangBerjalan = wargaTarget.logHutangAwal; 

  const sHasil: Setoran[] = setoranTerupdate.map((s, idx) => {
    if (s.isSessionEdit && s.isManual) return { ...s };
    return { ...wargaTarget.setoranAwal[idx] };
  });

  sHasil.forEach((s, t) => {
    if (s.isSessionEdit && s.isManual && typeof s.nilai === 'number' && s.nilai > 0) {
      let sisaUang = s.nilai - 1; // Potong 1 untuk kewajiban hari ini

      // 1. ISI HARI KOSONG MASA LALU
      for (let kiri = 0; kiri < t; kiri++) {
        if (sisaUang <= 0) break;
        
        // PERBAIKAN: Pastikan index array ada sebelum membaca nilai
        if (!sHasil[kiri]) sHasil[kiri] = {} as any;
        
        const nilaiKiri = sHasil[kiri].nilai;
        // Pengecekan longgar (== null) akan menangkap null DAN undefined
        if (nilaiKiri == null || nilaiKiri === "-") {
          sHasil[kiri] = { 
            ...sHasil[kiri],
            nilai: 0, 
            asalTanggal: t, 
            petugas: petugas?.nama || "Sistem", 
            isManual: false, 
            wasDash: sHasil[kiri].wasDash || nilaiKiri === "-", 
            isSessionEdit: true,
            diperbaruiTanggal: getTodayInJakarta(),
          };
          sisaUang--;
        }
      }

      // 2. BAYAR TUNGGAKAN
      if (sisaUang > 0 && tunggakanBerjalan > 0) {
        let nominalPotong = Math.min(sisaUang, tunggakanBerjalan);
        tunggakanBerjalan -= nominalPotong;
        sisaUang -= nominalPotong;
        const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const logBaru = `• Dibayar ${nominalPotong}rb tgl ${t + 1} (${timestamp} oleh ${petugas?.nama})\n`;
        logHutangBerjalan = logBaru + logHutangBerjalan;
      }

      // 3. ISI HARI KOSONG MASA DEPAN (kanan > t)
      for (let kanan = t + 1; kanan < sHasil.length; kanan++) {
        if (sisaUang <= 0) break;

        // PERBAIKAN: Cegah error "Cannot read properties of undefined"
        if (!sHasil[kanan]) sHasil[kanan] = {} as any;

        const nilaiKanan = sHasil[kanan].nilai;

        // JIKA SUDAH BERISI ANGKA (Bukan kosong), maka LEWATI (continue)
        if (typeof nilaiKanan === 'number' && nilaiKanan >= 0) {
          continue;
        }

        // HANYA ISI JIKA BENAR-BENAR KOSONG (null, undefined, "-", atau string kosong)
        if (nilaiKanan == null || nilaiKanan === "-") {
          // 1. Isi sel
          sHasil[kanan] = { 
            ...sHasil[kanan],
            nilai: 0, 
            asalTanggal: t, 
            petugas: petugas?.nama || "Sistem", 
            isManual: false, 
            wasDash: true, 
            isSessionEdit: true,
            diperbaruiTanggal: getTodayInJakarta(),
          };

          // 2. Kurangi sisa uang
          sisaUang--;

          // // 3. Tambahkan Notes/Log
          // const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          // const logBaru = `• Otomatis 0 tgl ${kanan + 1} (${timestamp} oleh ${petugas?.nama})\n`;
          // logHutangBerjalan = logBaru + logHutangBerjalan;
        }
      }
      
      // 4. SISA MASUK LEBIHAN
      if (sisaUang > 0) {
        lebihBerjalan += sisaUang;
      }
    }
  });

    return { ...wargaTarget, tunggakan: tunggakanBerjalan, lebih: lebihBerjalan, logHutang: logHutangBerjalan, setoran: sHasil };
  };

  const simpanNominal = async (inputStr: string) => {
    if (!numpad || !petugas) return;
    const inputVal = inputStr === "" ? null : Number(inputStr);
    const wargaRef = ref(db, `${getMonthPaths(bulanAktif).warga}/${numpad.idWarga}`);
    await runTransaction(wargaRef, (current) => {
      if (!current) return;
      const wargaSelected = normalizeWargaDays(current as Warga, jumlahHari);
      const setoranModifikasi = [...wargaSelected.setoran];
      if (inputVal === null) {
        setoranModifikasi[numpad.idxTgl] = { ...wargaSelected.setoranAwal[numpad.idxTgl], isSessionEdit: false };
      } else {
        setoranModifikasi[numpad.idxTgl] = { nilai: inputVal, asalTanggal: null, petugas: petugas.nama, isManual: true, wasDash: wargaSelected.setoranAwal[numpad.idxTgl].wasDash, isSessionEdit: true, diperbaruiTanggal: getTodayInJakarta() };
      }
      return jalankanKalkulasiWaterflow(wargaSelected, setoranModifikasi);
    });
    picuEfekKedipLokal(numpad.idWarga, numpad.idxTgl);
    tutupNumpad();
  };

  const tekanTombolKosongInstant = async () => {
    if (!numpad || !petugas) return;
    const wargaRef = ref(db, `${getMonthPaths(bulanAktif).warga}/${numpad.idWarga}`);
    await runTransaction(wargaRef, (current) => {
      if (!current) return;
      const wargaSelected = normalizeWargaDays(current as Warga, jumlahHari);
      const setoranModifikasi = [...wargaSelected.setoran];
      setoranModifikasi[numpad.idxTgl] = { nilai: "-", asalTanggal: null, petugas: petugas.nama, isManual: true, wasDash: true, isSessionEdit: true, diperbaruiTanggal: getTodayInJakarta() };
      return jalankanKalkulasiWaterflow(wargaSelected, setoranModifikasi);
    });
    picuEfekKedipLokal(numpad.idWarga, numpad.idxTgl);
    remove(ref(db, `locks/${bulanAktif}/${numpad.idWarga}_${numpad.idxTgl}`));
    setNumpad(null);
  };

  const eksekusiSelesaiDanKirim = async () => {
    if (savingReportRef.current) return;
    savingReportRef.current = true;
    setIsSavingReport(true);

    try {
      const { default: html2canvas } = await import("html2canvas");
      const tanggal = getTodayInJakarta();
      const namaFile = `Jimpitan_${bulanAktif}_${tanggalHariIniWIB}.png`;
      if (tableRef.current) {
        const pembungkusTabel = tableRef.current;
        const elemenTabel = pembungkusTabel.querySelector('table') || pembungkusTabel;
        const posisiScrollKiri = pembungkusTabel.scrollLeft;
        const posisiScrollAtas = pembungkusTabel.scrollTop;
        let gambarCanvas: HTMLCanvasElement;
        try {
          pembungkusTabel.scrollLeft = 0;
          pembungkusTabel.scrollTop = 0;
          await new Promise(resolve => setTimeout(resolve, 300));
          elemenTabel.classList.add('disable-sticky-capture');
          gambarCanvas = await html2canvas(elemenTabel as HTMLElement, {
            scale: 2, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff'
          });
        } finally {
          elemenTabel.classList.remove('disable-sticky-capture');
          pembungkusTabel.scrollLeft = posisiScrollKiri;
          pembungkusTabel.scrollTop = posisiScrollAtas;
        }
        const blob = await new Promise<Blob | null>((resolve) => gambarCanvas.toBlob(resolve, "image/png"));
        if (blob) {
          const urlGambar = URL.createObjectURL(blob);
          const linkDownload = document.createElement('a');
          linkDownload.href = urlGambar;
          linkDownload.download = namaFile;
          document.body.appendChild(linkDownload);
          linkDownload.click(); 
          document.body.removeChild(linkDownload);
          URL.revokeObjectURL(urlGambar);
        }
      }

      const totalSetoran = daftarWarga.reduce((total, warga) => total + (warga.setoran[tanggalHariIniWIB - 1]?.nilai && typeof warga.setoran[tanggalHariIniWIB - 1].nilai === 'number' ? warga.setoran[tanggalHariIniWIB - 1].nilai as number : 0), 0);
      await set(ref(db, `reports/${bulanAktif}/${tanggal}`), {
        tanggal,
        bulan: bulanAktif,
        totalSetoran,
        jumlahWarga: daftarWarga.length,
        dibuatOleh: petugas?.nama || 'Petugas',
        dibuatPada: Date.now(),
      });
      alert(`Laporan tersimpan di Firebase dan gambar ${namaFile} berhasil diunduh.`);
    } catch {
      alert('Gagal menyimpan laporan ke Firebase. Periksa koneksi dan aturan akses database.');
    } finally {
      savingReportRef.current = false;
      setIsSavingReport(false);
    }
  };

  const dapatkanInfoPopupUIPernyataan = (idWarga: number, idxTgl: number) => {
    const w = daftarWarga.find(x => x?.id === idWarga);
    if (!w) return "";
    let totalHariKosong = w.setoran.slice(0, idxTgl).filter(s => s.nilai === null || s.nilai === "-").length;
    if (totalHariKosong === 0 && w.tunggakan === 0) return <span className="font-bold text-green-600">⭐ Warga Rajin</span>;
    const totalPerlu = totalHariKosong + 1 + w.tunggakan;
    return (
      <span className="font-bold text-red-600">
        Kosong: {totalHariKosong} hari | Tunggakan: {w.tunggakan}k <br />
        <small style={{ color: '#555' }}>Info: {totalHariKosong} hari kosong + 1 hari ini + {w.tunggakan}k tunggakan = Perlu {totalPerlu}k</small>
      </span>
    );
  };

  if (!petugas) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col justify-center rounded-xl bg-white p-6 text-center shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
          <h2>Sistem Jimpitan RT 02</h2>
          <input className="my-3 w-[91%] rounded-md border border-gray-300 p-2.5" type="text" placeholder="Masukkan nama petugas..." autoComplete="name" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
          <button className="w-full rounded-md bg-blue-600 px-5 py-2.5 font-bold text-white" onClick={handleLogin}>Buka Akses Website</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col p-2.5">
      <div className="mb-2.5 flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        <div>👤 <strong>Petugas:</strong> {petugas.nama}</div>
        <div className="text-[15px] font-bold text-blue-600">{monthLabel(bulanAktif)} · 🕒 <strong>{waktuWIB}</strong></div>
        <div>
          🟢 Sesi: <strong>{activeUsers.length}/4 Aktif</strong>
        </div>
      </div>

      {dataError && <p className="text-sm text-red-700" role="alert">Tidak dapat memuat data jimpitan Firebase: {dataError}</p>}

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-[#e5e7eb] bg-white" ref={tableRef}>
        <table className="w-full border-collapse text-[13px] [&.disable-sticky-capture_thead]:!static [&.disable-sticky-capture_tr]:!static [&.disable-sticky-capture_th]:!static [&.disable-sticky-capture_td]:!static [&.disable-sticky-capture_th]:!transform-none [&.disable-sticky-capture_td]:!transform-none">
          <thead>
            <tr>
              <th className="!sticky top-0 left-0 !z-20 !min-w-[35px] border border-[#e5e7eb] bg-[#f9fafb] px-2 py-2.5">No</th>
              <th className="!sticky top-0 left-[35px] !z-20 !min-w-[140px] border border-[#e5e7eb] bg-[#f9fafb] px-2 py-2.5 text-left font-medium">Nama Warga</th>
              {listTanggal.map(tgl => (
                <th key={tgl} className={tgl === tanggalHariIniWIB ? "!sticky top-0 z-10 min-w-[42px] border-2 border-[#2563eb] bg-[#dbeafe] px-2 py-2.5 font-semibold text-[#1e40af]" : "!sticky top-0 z-10 min-w-[42px] border border-[#e5e7eb] bg-[#f9fafb] px-2 py-2.5 font-semibold"}
                ref={tgl === tanggalHariIniWIB ? headerHariIniRef : null}>{tgl}</th>
              ))}
              <th>Total</th><th>Tunggakan</th><th>Lebih</th><th>Status Setor</th>
            </tr>
          </thead>
          <tbody>
            {daftarWarga.map((w, idxUrut) => (
              <tr key={w.id}>
                <td className="!sticky left-0 !z-[5] !min-w-[35px] border border-[#e5e7eb] bg-white px-2 py-2.5 text-center">{idxUrut + 1}</td>
                <td className="!sticky left-[35px] !z-[5] !min-w-[140px] border border-[#e5e7eb] bg-white px-2 py-2.5 text-left font-medium">{w.nama}</td>
                {listTanggal.map((_, idxTgl) => {
                  const s = w.setoran[idxTgl] ?? createBlankSetoran();
                  const cellKey = `${w.id}_${idxTgl}`;
                  const isLocked = lockedCells[cellKey] && lockedCells[cellKey] !== petugas.nama;
                  const isPast = (idxTgl + 1) < tanggalHariIniWIB;
                  const isFuture = (idxTgl + 1) > tanggalHariIniWIB;
                  const isFlashing = flashingCells.includes(cellKey);
                  
                  let cellClass = "relative min-w-[42px] cursor-pointer border border-[#e5e7eb] px-2 py-2.5 text-center font-semibold transition-all duration-150";
                  if (s.nilai === 0) cellClass += " bg-[#ecfdf5] text-[#10b981]";
                  if ((isPast || isFuture) && !isAdmin) cellClass += " !cursor-not-allowed !bg-[#d1d5db] !text-[#6b7280]";
                  if (isLocked) cellClass += " pointer-events-none bg-[#fee2e2] text-[#ef4444]";
                  if (isFlashing) cellClass += " animate-[flashGreen_1.4s_ease-in-out]";

                  return (
                    <td key={idxTgl} className={cellClass} onClick={(e) => klikSel(e, w.id, idxTgl, s, w.nama)}>
                      {s.nilai === null ? "" : s.nilai}
                      {w.setoranAwal[idxTgl]?.nilai !== s.nilai && s.diperbaruiTanggal === getTodayInJakarta() && <span className="absolute top-px right-0.5 text-[9px] font-bold text-[#16a34a]">✓</span>}
                      {isLocked && <div className="absolute right-0 bottom-0 left-0 bg-[#f87171] text-[8px] text-white">{lockedCells[cellKey]}</div>}
                    </td>
                  );
                })}
                <td className="min-w-[42px] border border-[#e5e7eb] px-2 py-2.5 text-center font-bold text-[#16a34a]">{w.setoran.reduce((acc, curr) => acc + (typeof curr.nilai === 'number' && curr.nilai > 0 ? curr.nilai : 0), 0)}</td>
                <td className="min-w-[42px] border border-[#e5e7eb] px-2 py-2.5 text-center font-bold text-[#dc2626]" style={{ cursor: w.logHutang ? 'pointer' : 'default', fontWeight: 'bold' }}
                  onClick={() => { if (w.logHutang) setNotesPopup({ nama: w.nama, log: w.logHutang }) }}>
                  {w.tunggakan > 0 ? `${w.tunggakan}k` : (w.logHutang ? "📜" : "")}
                </td>
                <td className="min-w-[42px] border border-[#e5e7eb] px-2 py-2.5 text-center font-bold text-[#16a34a]">{w.lebih > 0 ? `${w.lebih}k` : ""}</td>
                <td></td>
              </tr>
            ))}
            <tr>
              <td className="!sticky left-0 !z-[5] !min-w-[35px] border border-[#e5e7eb] bg-white px-2 py-2.5"></td><td className="!sticky left-[35px] !z-[5] !min-w-[140px] border border-[#e5e7eb] bg-white px-2 py-2.5 text-left font-bold">TOTAL PER HARI</td>
              {listTanggal.map((_, idxTgl) => {
                const totalHariIni = daftarWarga.reduce((acc, w) => acc + (typeof w.setoran[idxTgl]?.nilai === 'number' && w.setoran[idxTgl].nilai! > 0 ? w.setoran[idxTgl].nilai as number : 0), 0);
                const status = dailyStatuses[String(idxTgl + 1)];
                return <td key={idxTgl} className="min-w-[42px] border border-[#e5e7eb] px-2 py-2.5 text-center font-bold text-[#16a34a]">
                  <div>{totalHariIni}</div>
                  <small>{status?.status === 'sudah' ? 'Sudah setor' : 'Belum setor'}</small>
                  {isAdmin && <button className="mx-auto mt-[5px] block cursor-pointer rounded-[3px] border border-[#86efac] bg-[#f0fdf4] px-1.5 py-1 text-[10px] text-[#166534]" type="button" onClick={() => void ubahStatusSetoranHarian(idxTgl + 1)} aria-label={`Ubah status setor tanggal ${idxTgl + 1}`}>
                    {status?.status === 'sudah' ? 'Batalkan setor' : 'Tandai setor'}
                  </button>}
                </td>;
              })}
              <td className="min-w-[42px] border border-[#e5e7eb] px-2 py-2.5 text-center font-bold text-[#16a34a]">
                {daftarWarga.reduce((acc, w) => acc + w.setoran.reduce((a, c) => a + (typeof c.nilai === 'number' && c.nilai > 0 ? c.nilai : 0), 0), 0)}
              </td>
              <td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button className="mt-auto flex-1 rounded-lg bg-green-600 p-3.5 text-[15px] font-bold text-white shadow-[0_4px_6px_rgba(22,163,74,0.2)]" style={{ flex: 1 }} onClick={eksekusiSelesaiDanKirim} disabled={isSavingReport} aria-busy={isSavingReport}>
          {isSavingReport ? 'Memproses laporan...' : 'Unduh & Simpan Laporan'}
        </button>
      </div>

      {tooltipInfo && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }} onClick={() => setTooltipInfo(null)} />
          <div style={{ position: 'fixed', top: tooltipInfo.y + 10, left: tooltipInfo.x + 10, backgroundColor: 'rgba(30, 41, 59, 0.95)', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 1000, maxWidth: '220px', pointerEvents: 'none', border: '1px solid #334155' }}>
            {tooltipInfo.text}
          </div>
        </>
      )}

      {notesPopup && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-[320px] rounded-xl bg-white p-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.2)]" style={{ maxWidth: '320px', textAlign: 'left', padding: '20px' }}>
            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Riwayat Tunggakan <br/><span style={{ color: '#2b6cb0', fontSize: '14px' }}>{notesPopup.nama}</span></h4>
            <div style={{ maxHeight: '220px', overflowY: 'auto', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#444', lineHeight: '1.6' }}>
              {notesPopup.log || "Belum ada riwayat pembayaran."}
            </div>
            <div className="mt-5 flex gap-2" style={{ marginTop: '20px' }}><button className="flex-1 rounded-md bg-blue-600 p-3 font-bold text-white" style={{ width: '100%' }} onClick={() => setNotesPopup(null)}>Tutup Catatan</button></div>
          </div>
        </div>
      )}

      {numpad && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-80 rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h4>{numpad.nama} (Tgl {numpad.idxTgl + 1})</h4>
            <div className="my-2 bg-gray-100 p-2 text-center text-xs font-medium">{dapatkanInfoPopupUIPernyataan(numpad.idWarga, numpad.idxTgl)}</div>
            <div className="mb-3 rounded-md bg-gray-200 p-2.5 text-center text-2xl font-bold">Rp {numpad.val || "0"}.000</div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<button className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 text-lg font-semibold active:scale-95" key={num} onClick={() => setNumpad({ ...numpad, val: numpad.val + num })}>{num}</button>))}
              <button className="rounded-lg border border-gray-200 bg-amber-100 p-3.5 text-lg font-semibold text-amber-600 active:scale-95 active:bg-amber-200" onClick={tekanTombolKosongInstant}>KOSONG</button>
              <button 
                onClick={() => setNumpad({ ...numpad, val: numpad.val + "0" })}
                disabled={!numpad.val || Number(numpad.val) < 1}
                style={(!numpad.val || Number(numpad.val) < 1) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                0
              </button>
              <button className="rounded-lg border border-gray-200 bg-red-100 p-3.5 text-lg font-semibold text-red-500 active:scale-95 active:bg-red-300" onClick={() => setNumpad({ ...numpad, val: numpad.val.slice(0, -1) })}>⌫</button>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-md bg-gray-200 p-3 font-bold active:scale-95" onClick={tutupNumpad}>Batal</button>
              <button className="flex-1 rounded-md bg-blue-600 p-3 font-bold text-white active:scale-95 active:bg-blue-700" onClick={() => simpanNominal(numpad.val)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
