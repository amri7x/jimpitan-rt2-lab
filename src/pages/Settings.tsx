import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { get, onValue, push, ref, remove, set, update } from "firebase/database";
import { auth, db } from "../firebase";
import { getActiveMonthKey, getTodayInJakarta, monthLabel, type FinanceTransaction } from "../data/monthly";
import { historicalFinanceTransactions } from "../data/financeHistory";

const emptyTransaction = {
	tanggal: getTodayInJakarta(),
	jenis: "pemasukan" as FinanceTransaction["jenis"],
	kategori: "",
	nominal: "",
	keterangan: "",
};

export const Settings = () => {
	const [user, setUser] = useState<User | null>(auth.currentUser);
	const [isAdmin, setIsAdmin] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [monthKey, setMonthKey] = useState(getActiveMonthKey);
	const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [transactionForm, setTransactionForm] = useState(emptyTransaction);
	const [historyImported, setHistoryImported] = useState(false);

	useEffect(() => onAuthStateChanged(auth, setUser), []);

	useEffect(() => {
		if (!user) {
			setIsAdmin(false);
			return;
		}
		return onValue(ref(db, `admins/${user.uid}`), (snapshot) => setIsAdmin(snapshot.val() === true));
	}, [user]);

	useEffect(() => {
		if (!isAdmin) {
			setTransactions([]);
			setHistoryImported(false);
			return;
		}
		const monthRoot = `finance/months/${monthKey}`;
		const unsubscribeTransactions = onValue(ref(db, `${monthRoot}/transactions`), (snapshot) => {
			const data = snapshot.val();
			setTransactions(data ? Object.values(data) as FinanceTransaction[] : []);
		});
		const unsubscribeImportStatus = onValue(ref(db, "system/legacyFinancePdfImported"), (snapshot) => {
			setHistoryImported(snapshot.exists());
		});
		return () => {
			unsubscribeTransactions();
			unsubscribeImportStatus();
		};
	}, [isAdmin, monthKey]);

	const login = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		try {
			await signInWithEmailAndPassword(auth, email.trim(), password);
			setPassword("");
		} catch {
			setError("Login gagal. Periksa email, password, dan konfigurasi Firebase Authentication.");
		}
	};

	const saveTransaction = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!user || !isAdmin) return;
		const amount = Number(transactionForm.nominal);
		if (!Number.isFinite(amount) || amount < 0 || (amount === 0 && transactionForm.jenis !== "catatan") || !transactionForm.kategori.trim()) {
			setError("Isi kategori dan nominal yang valid. Catatan boleh bernilai nol.");
			return;
		}
		if (!transactionForm.tanggal.startsWith(`${monthKey}-`)) {
			setError("Tanggal transaksi harus berada pada bulan yang dipilih.");
			return;
		}
		const now = Date.now();
		const existing = editingId ? transactions.find((item) => item.id === editingId) : undefined;
		const transaction: FinanceTransaction = {
			id: editingId || push(ref(db, `finance/months/${monthKey}/transactions`)).key || String(now),
			tanggal: transactionForm.tanggal,
			jenis: transactionForm.jenis,
			kategori: transactionForm.kategori.trim(),
			nominal: amount,
			keterangan: transactionForm.keterangan.trim(),
			dibuatOleh: existing?.dibuatOleh === "Impor Total Rekap Jimpitan PDF" ? existing.dibuatOleh : "Admin",
			dibuatPada: existing?.dibuatPada || now,
			...(editingId ? { diperbaruiPada: now, diperbaruiOleh: "Admin" } : {}),
			...(existing?.saldoTercatat !== undefined ? { saldoTercatat: existing.saldoTercatat } : {}),
			...(existing?.tanggalSumber ? { tanggalSumber: existing.tanggalSumber } : {}),
			...(existing?.urutanSumber !== undefined ? { urutanSumber: existing.urutanSumber } : {}),
		};
		await set(ref(db, `finance/months/${monthKey}/transactions/${transaction.id}`), transaction);
		setEditingId(null);
		setTransactionForm(emptyTransaction);
		setError("");
	};

	const editTransaction = (transaction: FinanceTransaction) => {
		setEditingId(transaction.id);
		setTransactionForm({
			tanggal: transaction.tanggal,
			jenis: transaction.jenis,
			kategori: transaction.kategori,
			nominal: String(transaction.nominal),
			keterangan: transaction.keterangan,
		});
	};

	const importHistoricalFinance = async () => {
		if (!user || !isAdmin || historyImported) return;
		setError("");
		try {
			const markerRef = ref(db, "system/legacyFinancePdfImported");
			const markerSnapshot = await get(markerRef);
			if (markerSnapshot.exists()) {
				setHistoryImported(true);
				return;
			}
			const updates: Record<string, unknown> = {};
			for (const transaction of historicalFinanceTransactions) {
				const month = transaction.tanggal.slice(0, 7);
				updates[`finance/months/${month}/transactions/${transaction.id}`] = transaction;
			}
			updates["system/legacyFinancePdfImported"] = {
				importedAt: Date.now(),
				importedBy: user.email || user.uid,
				transactionCount: historicalFinanceTransactions.length,
				excluded: "Jimpitan Oktober (setor), dihitung dinamis dari status setor",
			};
			await update(ref(db), updates);
			setHistoryImported(true);
		} catch {
			setError("Impor riwayat gagal. Pastikan Firebase Rules terbaru sudah dipublikasikan dan akun memiliki akses admin.");
		}
	};

	const rupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

	if (!user || user.isAnonymous || !isAdmin) {
		return (
			<main className="min-h-[calc(100vh-58px)] px-[clamp(16px,4vw,48px)] py-7">
				<div><p className="m-0 text-xs font-bold uppercase text-green-700">Jimpitan RT 02</p><h1 className="my-1 mb-2 text-[26px] text-blue-950">Setting Admin</h1><p className="m-0 text-slate-500">Masuk dengan akun admin terdaftar untuk mengelola transaksi dan setoran.</p></div>
				{user && !user.isAnonymous && !isAdmin ? <div className="mt-7 max-w-[420px] border-t border-gray-300 py-[18px]"><p>Akun ini belum diberi akses admin.</p><button className="min-h-[34px] cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700" type="button" onClick={() => void signOut(auth)}>Keluar</button></div> : (
					<form className="mt-7 grid max-w-[420px] gap-3.5 border-t border-gray-300 py-[18px]" onSubmit={login}>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Email<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Password<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
						{error && <p className="text-sm text-red-700" role="alert">{error}</p>}
						<button className="min-h-10 cursor-pointer rounded border-0 bg-green-800 px-3.5 py-2 font-bold text-white" type="submit">Login Admin</button>
					</form>
				)}
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-58px)] px-[clamp(16px,4vw,48px)] py-7">
			<div><p className="m-0 text-xs font-bold uppercase text-green-700">Pengelolaan</p><h1 className="my-1 mb-2 text-[26px] text-blue-950">Setting Admin</h1><p className="m-0 text-slate-500">Kelola transaksi keuangan untuk bulan yang dipilih. Status setoran diubah dari halaman Jimpitan.</p></div>
			<div className="my-6 flex flex-wrap items-start gap-3 border-y border-gray-300 py-3"><label htmlFor="admin-month">Bulan</label><input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" id="admin-month" type="month" value={monthKey} max={getActiveMonthKey()} onChange={(event) => setMonthKey(event.target.value)} /><strong className="text-green-800">{monthLabel(monthKey)}</strong><button className="min-h-10 cursor-pointer rounded border-0 bg-green-800 px-3.5 py-2 font-bold text-white" type="button" onClick={() => void signOut(auth)}>Keluar Admin</button></div>
			{error && <p className="text-sm text-red-700" role="alert">{error}</p>}
			<section className="mt-6 flex items-center justify-between gap-3 border-b border-gray-300 pb-5">
				<div><h2>Riwayat Contoh (Demo)</h2><p>{historyImported ? "Riwayat demo sudah diimpor ke Firebase." : "Impor transaksi fiktif April–September 2026 satu kali. Baris Jimpitan Oktober (setor) tidak disalin karena dihitung otomatis."}</p></div>
				<button className="min-h-10 cursor-pointer rounded border-0 bg-green-800 px-3.5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={historyImported} onClick={() => void importHistoricalFinance()}>{historyImported ? "Riwayat sudah diimpor" : "Impor riwayat demo"}</button>
			</section>
			<div className="grid grid-cols-2 gap-7 max-[760px]:grid-cols-1 max-[760px]:gap-0">
				<section className="mt-6 border-b border-gray-300 pb-5">
					<h2 className="mb-3.5 text-lg text-slate-700">{editingId ? "Ubah transaksi" : "Tambah transaksi"}</h2>
					<form className="grid grid-cols-2 gap-3.5 max-[420px]:grid-cols-1" onSubmit={saveTransaction}>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Tanggal<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" type="date" required value={transactionForm.tanggal} onChange={(event) => setTransactionForm({ ...transactionForm, tanggal: event.target.value })} /></label>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Jenis<select className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" value={transactionForm.jenis} onChange={(event) => setTransactionForm({ ...transactionForm, jenis: event.target.value as FinanceTransaction["jenis"] })}><option value="saldo_awal">Saldo awal</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option><option value="pinjaman">Pinjaman</option><option value="pengembalian">Pengembalian</option><option value="catatan">Catatan</option></select></label>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Kategori<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" required value={transactionForm.kategori} onChange={(event) => setTransactionForm({ ...transactionForm, kategori: event.target.value })} /></label>
						<label className="grid gap-1.5 text-[13px] font-bold text-slate-700">Nominal (Rp)<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" type="number" min="1" step="1" required value={transactionForm.nominal} onChange={(event) => setTransactionForm({ ...transactionForm, nominal: event.target.value })} /></label>
						<label className="col-span-full grid gap-1.5 text-[13px] font-bold text-slate-700 max-[420px]:col-auto">Keterangan<textarea className="min-h-10 resize-y rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" rows={2} value={transactionForm.keterangan} onChange={(event) => setTransactionForm({ ...transactionForm, keterangan: event.target.value })} /></label>
						<div className="col-span-full flex items-center gap-2 max-[420px]:col-auto"><button className="min-h-10 cursor-pointer rounded border-0 bg-green-800 px-3.5 py-2 font-bold text-white" type="submit">{editingId ? "Simpan perubahan" : "Tambah transaksi"}</button>{editingId && <button className="min-h-[34px] cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700" type="button" onClick={() => { setEditingId(null); setTransactionForm(emptyTransaction); }}>Batal</button>}</div>
					</form>
				</section>
			</div>
			<section className="mt-6 border-b border-gray-300 pb-5">
				<h2 className="mb-3.5 text-lg text-slate-700">Transaksi Bulan Ini</h2>
				{transactions.length === 0 ? <p className="text-sm text-slate-500">Belum ada transaksi.</p> : <div className="overflow-x-auto"><table className="min-w-[720px] border-collapse text-[13px]"><thead><tr><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Tanggal</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Jenis</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Kategori</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Keterangan</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Nominal</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Sisa Saldo PDF</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Aksi</th></tr></thead><tbody>
					{transactions.sort((a, b) => (a.urutanSumber ?? Number.MAX_SAFE_INTEGER) - (b.urutanSumber ?? Number.MAX_SAFE_INTEGER) || b.tanggal.localeCompare(a.tanggal)).map((item) => <tr key={item.id}><td title={item.tanggalSumber ? `Tanggal sumber PDF: ${item.tanggalSumber}` : undefined}>{item.tanggal}</td><td>{item.jenis}</td><td>{item.kategori}</td><td>{item.keterangan}</td><td>{rupiah(item.nominal)}</td><td>{item.saldoTercatat === undefined ? "-" : rupiah(item.saldoTercatat)}</td><td className="flex items-center gap-2"><button className="min-h-[34px] cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700" type="button" onClick={() => editTransaction(item)}>Ubah</button><button className="min-h-[34px] cursor-pointer rounded border border-red-200 bg-white px-2.5 py-1.5 text-red-700" type="button" onClick={() => { if (window.confirm("Hapus transaksi ini?")) void remove(ref(db, `finance/months/${monthKey}/transactions/${item.id}`)); }}>Hapus</button></td></tr>)}
				</tbody></table></div>}
			</section>
		</main>
	);
};
