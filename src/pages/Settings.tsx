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
			<main className="finance-page admin-page">
				<div className="finance-heading"><p className="finance-eyebrow">Jimpitan RT 02</p><h1>Setting Admin</h1><p>Masuk dengan akun admin terdaftar untuk mengelola transaksi dan setoran.</p></div>
				{user && !user.isAnonymous && !isAdmin ? <div className="admin-notice"><p>Akun ini belum diberi akses admin.</p><button type="button" onClick={() => void signOut(auth)}>Keluar</button></div> : (
					<form className="admin-login" onSubmit={login}>
						<label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
						<label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
						{error && <p className="form-error" role="alert">{error}</p>}
						<button type="submit">Login Admin</button>
					</form>
				)}
			</main>
		);
	}

	return (
		<main className="finance-page admin-page">
			<div className="finance-heading"><p className="finance-eyebrow">Pengelolaan</p><h1>Setting Admin</h1><p>Kelola transaksi keuangan untuk bulan yang dipilih. Status setoran diubah dari halaman Jimpitan.</p></div>
			<div className="finance-toolbar"><label htmlFor="admin-month">Bulan</label><input id="admin-month" type="month" value={monthKey} max={getActiveMonthKey()} onChange={(event) => setMonthKey(event.target.value)} /><strong>{monthLabel(monthKey)}</strong><button type="button" onClick={() => void signOut(auth)}>Keluar Admin</button></div>
			{error && <p className="form-error" role="alert">{error}</p>}
			<section className="finance-section finance-import">
				<div><h2>Riwayat Contoh (Demo)</h2><p>{historyImported ? "Riwayat demo sudah diimpor ke Firebase." : "Impor transaksi fiktif April–September 2026 satu kali. Baris Jimpitan Oktober (setor) tidak disalin karena dihitung otomatis."}</p></div>
				<button type="button" disabled={historyImported} onClick={() => void importHistoricalFinance()}>{historyImported ? "Riwayat sudah diimpor" : "Impor riwayat demo"}</button>
			</section>
			<div className="admin-grid">
				<section className="finance-section">
					<h2>{editingId ? "Ubah transaksi" : "Tambah transaksi"}</h2>
					<form className="admin-form" onSubmit={saveTransaction}>
						<label>Tanggal<input type="date" required value={transactionForm.tanggal} onChange={(event) => setTransactionForm({ ...transactionForm, tanggal: event.target.value })} /></label>
						<label>Jenis<select value={transactionForm.jenis} onChange={(event) => setTransactionForm({ ...transactionForm, jenis: event.target.value as FinanceTransaction["jenis"] })}><option value="saldo_awal">Saldo awal</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option><option value="pinjaman">Pinjaman</option><option value="pengembalian">Pengembalian</option><option value="catatan">Catatan</option></select></label>
						<label>Kategori<input required value={transactionForm.kategori} onChange={(event) => setTransactionForm({ ...transactionForm, kategori: event.target.value })} /></label>
						<label>Nominal (Rp)<input type="number" min="1" step="1" required value={transactionForm.nominal} onChange={(event) => setTransactionForm({ ...transactionForm, nominal: event.target.value })} /></label>
						<label className="admin-form-wide">Keterangan<textarea rows={2} value={transactionForm.keterangan} onChange={(event) => setTransactionForm({ ...transactionForm, keterangan: event.target.value })} /></label>
						<div className="admin-form-actions"><button type="submit">{editingId ? "Simpan perubahan" : "Tambah transaksi"}</button>{editingId && <button type="button" className="button-secondary" onClick={() => { setEditingId(null); setTransactionForm(emptyTransaction); }}>Batal</button>}</div>
					</form>
				</section>
			</div>
			<section className="finance-section">
				<h2>Transaksi Bulan Ini</h2>
				{transactions.length === 0 ? <p>Belum ada transaksi.</p> : <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Keterangan</th><th>Nominal</th><th>Sisa Saldo PDF</th><th>Aksi</th></tr></thead><tbody>
					{transactions.sort((a, b) => (a.urutanSumber ?? Number.MAX_SAFE_INTEGER) - (b.urutanSumber ?? Number.MAX_SAFE_INTEGER) || b.tanggal.localeCompare(a.tanggal)).map((item) => <tr key={item.id}><td title={item.tanggalSumber ? `Tanggal sumber PDF: ${item.tanggalSumber}` : undefined}>{item.tanggal}</td><td>{item.jenis}</td><td>{item.kategori}</td><td>{item.keterangan}</td><td>{rupiah(item.nominal)}</td><td>{item.saldoTercatat === undefined ? "-" : rupiah(item.saldoTercatat)}</td><td className="table-actions"><button type="button" className="button-secondary" onClick={() => editTransaction(item)}>Ubah</button><button type="button" className="button-danger" onClick={() => { if (window.confirm("Hapus transaksi ini?")) void remove(ref(db, `finance/months/${monthKey}/transactions/${item.id}`)); }}>Hapus</button></td></tr>)}
				</tbody></table></div>}
			</section>
		</main>
	);
};
