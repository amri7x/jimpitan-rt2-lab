import { useEffect, useState } from "react";
import { get, onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { getActiveMonthKey, getDaysInMonth, getPreviousMonthKey, monthLabel, type DailyRecapStatus, type FinanceTransaction, type ResidentRecord } from "../data/monthly";
import { applyRunningBalances, calculateMonthClosingBalance, calculatePaidJimpitan, hasRecordedMonthlyJimpitan, nextMonthKey } from "../data/financeBalance";

const FINANCE_HISTORY_START = "2026-04";

export const Data_Keuangan = () => {
	const [monthKey, setMonthKey] = useState(getActiveMonthKey);
	const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
	const [warga, setWarga] = useState<ResidentRecord[]>([]);
	const [dailyStatuses, setDailyStatuses] = useState<Record<string, DailyRecapStatus>>({});
	const [priorClosingBalance, setPriorClosingBalance] = useState(0);
	const [openingBalanceLoading, setOpeningBalanceLoading] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	useEffect(() => {
		setLoading(true);
		setLoadError("");
		let transactionsValue: FinanceTransaction[] = [];
		let residentsValue: ResidentRecord[] = [];
		let statusesValue: Record<string, DailyRecapStatus> = {};
		const publish = () => {
			setTransactions(transactionsValue);
			setWarga(residentsValue);
			setDailyStatuses(statusesValue);
			setLoading(false);
		};
		const unsubscribeTransactions = onValue(ref(db, `finance/months/${monthKey}/transactions`), (snapshot) => {
			const values = snapshot.val();
			transactionsValue = values ? Object.values(values) as FinanceTransaction[] : [];
			publish();
		}, (error) => { setLoadError(error.message); setLoading(false); });
		const unsubscribeWarga = onValue(ref(db, `jimpitan/months/${monthKey}/warga`), (snapshot) => {
			const values = snapshot.val();
			residentsValue = values ? Object.values(values) as ResidentRecord[] : [];
			publish();
		}, (error) => { setLoadError(error.message); setLoading(false); });
		const unsubscribeStatuses = onValue(ref(db, `jimpitan/months/${monthKey}/recap/days`), (snapshot) => {
			const values = snapshot.val();
			statusesValue = values || {};
			publish();
		}, (error) => { setLoadError(error.message); setLoading(false); });
		return () => {
			unsubscribeTransactions();
			unsubscribeWarga();
			unsubscribeStatuses();
		};
	}, [monthKey]);

	useEffect(() => {
		let cancelled = false;
		setOpeningBalanceLoading(true);
		setLoadError("");

		const calculatePriorClosing = async () => {
			let cursor = FINANCE_HISTORY_START;
			let closingBalance = 0;
			try {
				while (cursor < monthKey) {
					const label = monthLabel(cursor);
					const financePath = `finance/months/${cursor}/transactions`;
					const financeSnapshot = await get(ref(db, financePath));
					const monthTransactions = financeSnapshot.exists()
						? Object.values(financeSnapshot.val()) as FinanceTransaction[]
						: [];
					let monthlyJimpitan = 0;
					if (!hasRecordedMonthlyJimpitan(monthTransactions, label)) {
						const [wargaSnapshot, statusSnapshot] = await Promise.all([
							get(ref(db, `jimpitan/months/${cursor}/warga`)),
							get(ref(db, `jimpitan/months/${cursor}/recap/days`)),
						]);
						const residents = wargaSnapshot.exists()
							? Object.values(wargaSnapshot.val()) as ResidentRecord[]
							: [];
						const statuses = statusSnapshot.exists()
							? statusSnapshot.val() as Record<string, DailyRecapStatus>
							: {};
						monthlyJimpitan = calculatePaidJimpitan(cursor, residents, statuses);
					}
					closingBalance = calculateMonthClosingBalance(closingBalance, monthTransactions, monthlyJimpitan, label);
					cursor = nextMonthKey(cursor);
				}
				if (!cancelled) setPriorClosingBalance(closingBalance);
			} catch {
				if (!cancelled) setLoadError("Gagal menghitung saldo awal dari riwayat bulan sebelumnya.");
			} finally {
				if (!cancelled) setOpeningBalanceLoading(false);
			}
		};

		void calculatePriorClosing();
		return () => { cancelled = true; };
	}, [monthKey]);

	const paidJimpitan = calculatePaidJimpitan(monthKey, warga, dailyStatuses);
	const jimpitanCategory = `Jimpitan ${monthLabel(monthKey)} (setor)`;
	const isActiveMonth = monthKey === getActiveMonthKey();
	const recordedJimpitan = hasRecordedMonthlyJimpitan(transactions, monthLabel(monthKey));
	const openingBalance = transactions.find((transaction) => transaction.jenis === "saldo_awal")?.nominal ?? priorClosingBalance;
	const dynamicJimpitanTransaction = (transactions.find((transaction) => transaction.kategori === jimpitanCategory) ?? {
		id: `jimpitan-${monthKey}`,
		tanggal: `${monthKey}-${String(getDaysInMonth(monthKey)).padStart(2, "0")}`,
		jenis: "pemasukan",
		kategori: jimpitanCategory,
		keterangan: "Jumlah jimpitan dari tanggal yang berstatus sudah setor",
		dibuatOleh: "Rekap jimpitan",
		dibuatPada: 0,
		urutanSumber: 1,
	}) as FinanceTransaction;
	const jimpitanIncome: FinanceTransaction[] = isActiveMonth || !recordedJimpitan
		? [{ ...dynamicJimpitanTransaction, jenis: "pemasukan", nominal: paidJimpitan, dibuatOleh: "Rekap jimpitan", saldoTercatat: undefined, tanggal: `${monthKey}-${String(getDaysInMonth(monthKey)).padStart(2, "0")}`, urutanSumber: 1 }]
		: [];
	const openingRow: FinanceTransaction = {
		id: `opening-${monthKey}`,
		tanggal: `${monthKey}-01`,
		jenis: "saldo_awal",
		kategori: "Saldo akhir bulan sebelumnya",
		nominal: openingBalance,
		keterangan: monthKey === FINANCE_HISTORY_START && transactions.some((transaction) => transaction.jenis === "saldo_awal")
			? "Saldo awal yang tersedia pada data impor bulan April 2026"
			: `Saldo penutup ${monthLabel(getPreviousMonthKey(monthKey))} dibawa ke bulan ini`,
		dibuatOleh: "Saldo berjalan Firebase",
		dibuatPada: 0,
		saldoTercatat: openingBalance,
		urutanSumber: 0,
	};
	const regularTransactions = transactions.filter((transaction) =>
		transaction.jenis !== "saldo_awal" && !(isActiveMonth && transaction.kategori === jimpitanCategory)
	);
	const orderedTransactions = [openingRow, ...jimpitanIncome, ...regularTransactions].sort((left, right) =>
		(left.urutanSumber ?? Number.MAX_SAFE_INTEGER) - (right.urutanSumber ?? Number.MAX_SAFE_INTEGER)
		|| left.tanggal.localeCompare(right.tanggal)
		|| left.dibuatPada - right.dibuatPada
	);
	const allTransactions = applyRunningBalances(openingBalance, orderedTransactions);
	const totals = allTransactions.reduce((result, transaction) => {
		if (transaction.jenis !== "catatan") result[transaction.jenis] += transaction.nominal;
		return result;
	}, { saldo_awal: 0, pemasukan: 0, pengeluaran: 0, pinjaman: 0, pengembalian: 0 });
	const saldoBersihBulan = allTransactions.at(-1)?.saldoTercatat ?? openingBalance;
	const rupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
	const labelJenis = (jenis: FinanceTransaction["jenis"]) => ({
		saldo_awal: "Saldo awal",
		pemasukan: "Pemasukan",
		pengeluaran: "Pengeluaran",
		pinjaman: "Pinjaman",
		pengembalian: "Pengembalian",
		catatan: "Catatan",
	})[jenis];

	return (
		<main className="min-h-[calc(100vh-58px)] px-[clamp(16px,4vw,48px)] py-7">
			<div>
				<p className="m-0 text-xs font-bold uppercase text-green-700">Jimpitan RT 02</p>
				<h1 className="my-1 mb-2 text-[26px] text-blue-950">Riwayat Keuangan</h1>
				<p className="m-0 text-slate-500">Riwayat transaksi dan setoran tersimpan di Firebase.</p>
			</div>
			<div className="my-6 flex flex-wrap items-start gap-3 border-y border-gray-300 py-3">
				<label htmlFor="finance-month">Bulan</label>
				<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" id="finance-month" type="month" value={monthKey} max={getActiveMonthKey()} onChange={(event) => setMonthKey(event.target.value)} />
				<strong className="text-green-800">{monthLabel(monthKey)}</strong>
			</div>
			{loading || openingBalanceLoading ? <p role="status">Memuat riwayat dan saldo bulan sebelumnya...</p> : loadError ? <p className="text-sm text-red-700" role="alert">Tidak dapat membaca riwayat Firebase: {loadError}</p> : (
				<>
					<section className="grid grid-cols-4 gap-4 border-b border-gray-300 py-4 max-[760px]:grid-cols-2" aria-label="Ringkasan bulan">
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Saldo awal tercatat</span><strong className="text-lg text-blue-950">{rupiah(totals.saldo_awal)}</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Pemasukan</span><strong className="text-lg text-blue-950">{rupiah(totals.pemasukan)}</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Pengeluaran</span><strong className="text-lg text-blue-950">{rupiah(totals.pengeluaran)}</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Pinjaman</span><strong className="text-lg text-blue-950">{rupiah(totals.pinjaman)}</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Pengembalian</span><strong className="text-lg text-blue-950">{rupiah(totals.pengembalian)}</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Saldo akhir bulan</span><strong className="text-lg text-blue-950">{rupiah(saldoBersihBulan)}</strong></div>
					</section>
					<section className="mt-6 border-b border-gray-300 pb-5">
						<h2 className="mb-3.5 text-lg text-slate-700">Transaksi</h2>
						{allTransactions.length === 0 ? <p className="text-sm text-slate-500">Belum ada transaksi pada bulan ini.</p> : (
							<div className="overflow-x-auto"><table className="min-w-[720px] border-collapse text-[13px]"><thead><tr><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Tanggal</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Jenis</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Kategori</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Keterangan</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Nominal</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Sisa Saldo</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Dicatat oleh</th></tr></thead><tbody>
								{allTransactions.map((item) => <tr key={item.id}><td title={item.tanggalSumber ? `Tanggal sumber PDF: ${item.tanggalSumber}` : undefined}>{item.tanggal}</td><td>{labelJenis(item.jenis)}</td><td>{item.kategori}</td><td>{item.keterangan}</td><td>{rupiah(item.nominal)}</td><td>{rupiah(item.saldoTercatat ?? 0)}</td><td>{item.dibuatOleh === "Rekap jimpitan" ? "Rekap jimpitan" : item.dibuatOleh === "Impor Total Rekap Jimpitan PDF" ? "Data impor" : "Admin"}</td></tr>)}
							</tbody></table></div>
						)}
					</section>
					<section className="mt-6 border-b border-gray-300 pb-5">
						<h2 className="mb-3.5 text-lg text-slate-700">Setoran Jimpitan Bulanan</h2>
						<p className="text-sm text-slate-500">Total jimpitan di atas hanya memasukkan hari yang berstatus sudah setor.</p>
						<p className="text-sm text-slate-500">{Array.from({ length: getDaysInMonth(monthKey) }, (_, index) => index + 1).filter((day) => dailyStatuses[String(day)]?.status === "sudah").length} hari sudah disetor · {Array.from({ length: getDaysInMonth(monthKey) }, (_, index) => index + 1).filter((day) => dailyStatuses[String(day)]?.status !== "sudah").length} hari belum disetor</p>
					</section>
				</>
				)}
		</main>
	);
};
