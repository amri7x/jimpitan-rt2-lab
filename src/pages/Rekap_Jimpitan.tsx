import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { getActiveMonthKey, getDaysInMonth, monthLabel, type DailyRecapStatus, type ResidentRecord } from "../data/monthly";

interface MonthlyRecapData {
	status: "active" | "archived";
	warga: ResidentRecord[];
	recap?: { days?: Record<string, DailyRecapStatus> };
}

export const Rekap_Jimpitan = () => {
	const [monthKey, setMonthKey] = useState(getActiveMonthKey);
	const [data, setData] = useState<MonthlyRecapData | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const days = Array.from({ length: getDaysInMonth(monthKey) }, (_, index) => index + 1);

	useEffect(() => {
		setLoading(true);
		setLoadError("");
		return onValue(ref(db, `jimpitan/months/${monthKey}`), (snapshot) => {
			const value = snapshot.val();
			if (!value) {
				setData(null);
				setLoading(false);
				return;
			}
			const residents = value.warga ? Object.values(value.warga) as ResidentRecord[] : [];
			setData({ status: value.status, warga: residents, recap: value.recap || {} });
			setLoading(false);
		}, (error) => {
			setLoadError(error.message);
			setLoading(false);
		});
	}, [monthKey]);

	const dailyTotal = (day: number) => (data?.warga || []).reduce((sum, resident) => {
		const value = resident.setoran[day - 1]?.nilai;
		return sum + (typeof value === "number" && value > 0 ? value : 0);
	}, 0);
	const paidDays = days.filter((day) => data?.recap?.days?.[String(day)]?.status === "sudah");
	const totalAll = days.reduce((sum, day) => sum + dailyTotal(day), 0);
	const totalPaid = paidDays.reduce((sum, day) => sum + dailyTotal(day), 0);
	const formatWeekday = (day: number) => new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" }).format(new Date(`${monthKey}-${String(day).padStart(2, "0")}T12:00:00+07:00`));

	return (
		<main className="min-h-[calc(100vh-58px)] px-[clamp(16px,4vw,48px)] py-7">
			<div>
				<p className="m-0 text-xs font-bold uppercase text-green-700">Arsip Jimpitan</p>
				<h1 className="my-1 mb-2 text-[26px] text-blue-950">Rekap Jimpitan</h1>
				<p className="m-0 text-slate-500">Rekap harian dan catatan setoran warga untuk {monthLabel(monthKey)}.</p>
			</div>
			<div className="my-6 flex flex-wrap items-start gap-3 border-y border-gray-300 py-3">
				<label htmlFor="recap-month">Bulan</label>
				<input className="min-h-10 rounded border border-slate-300 bg-white px-2.5 py-2 text-gray-800" id="recap-month" type="month" value={monthKey} max={getActiveMonthKey()} onChange={(event) => setMonthKey(event.target.value)} />
				<strong className="text-green-800">{monthLabel(monthKey)}</strong>
				{data && <span className={data.status === "active" ? "border-l-[3px] border-green-800 px-2 py-[5px] text-xs font-bold text-green-800" : "border-l-[3px] border-slate-500 px-2 py-[5px] text-xs font-bold text-slate-600"}>{data.status === "active" ? "Bulan aktif" : "Arsip"}</span>}
			</div>
			{loading ? <p role="status">Memuat rekap...</p> : loadError ? <p className="text-sm text-red-700" role="alert">Tidak dapat membaca rekap Firebase: {loadError}</p> : !data ? <p className="mt-7 border-y border-gray-300 py-6 text-sm text-slate-500" role="status">Belum ada data untuk bulan ini.</p> : (
				<>
					<section className="grid grid-cols-4 gap-4 border-b border-gray-300 py-4 max-[760px]:grid-cols-2" aria-label="Ringkasan rekap bulan">
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Total bulan</span><strong className="text-lg text-blue-950">{totalAll}k</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Total sudah setor</span><strong className="text-lg text-blue-950">{totalPaid}k</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Total belum setor</span><strong className="text-lg text-blue-950">{totalAll - totalPaid}k</strong></div>
						<div className="grid gap-1.5"><span className="text-[13px] text-slate-500">Warga</span><strong className="text-lg text-blue-950">{data.warga.length}</strong></div>
					</section>
					<section className="mt-6 border-b border-gray-300 pb-5">
						<h2 className="mb-3.5 text-lg text-slate-700">Ringkasan Harian</h2>
						<div className="overflow-x-auto"><table className="min-w-[720px] border-collapse text-[13px]"><thead><tr><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Hari</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Tanggal</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Uang (ribu)</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Status</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Nama Petugas</th></tr></thead><tbody>
							{days.map((day) => {
								const staff = Array.from(new Set(data.warga.flatMap((resident) => {
									const collector = resident.setoran[day - 1]?.petugas;
									return collector ? [collector] : [];
								}))).join(", ");
								const status = data.recap?.days?.[String(day)]?.status;
								return <tr key={day}><td>{formatWeekday(day)}</td><td>{monthKey}-{String(day).padStart(2, "0")}</td><td>{dailyTotal(day)}</td><td>{status === "sudah" ? "Sudah setor" : "Belum setor"}</td><td>{staff || "-"}</td></tr>;
							})}
						</tbody></table></div>
					</section>
					<section className="mt-6 border-b border-gray-300 pb-5">
						<h2 className="mb-3.5 text-lg text-slate-700">Detail Setoran Warga</h2>
						<div className="overflow-x-auto"><table className="min-w-max border-collapse text-[13px]"><thead><tr><th className="sticky left-0 z-[5] border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">No</th><th className="sticky left-[42px] z-[5] min-w-[150px] border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Nama Warga</th>{days.map((day) => <th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950" key={day} title={`${formatWeekday(day)} ${monthKey}-${String(day).padStart(2, "0")}`}>{day}<small className="mt-[3px] block text-[9px] font-medium">{data.recap?.days?.[String(day)]?.status === "sudah" ? "Setor" : "Belum"}</small></th>)}<th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Total</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Tunggakan</th><th className="static border border-gray-300 bg-green-50 p-2.5 text-left text-green-950">Lebih</th></tr></thead><tbody>
							{data.warga.map((resident, index) => <tr key={resident.id}><td className="sticky left-0 z-[3] border border-gray-300 bg-white p-2.5 text-left">{index + 1}</td><td className="sticky left-[42px] z-[3] min-w-[150px] border border-gray-300 bg-white p-2.5 text-left">{resident.nama}</td>{days.map((day) => {
								const entry = resident.setoran[day - 1];
								return <td key={day} title={entry?.petugas ? `Petugas: ${entry.petugas}` : "Belum ada petugas"}>{entry?.nilai ?? ""}</td>;
							})}<td>{resident.setoran.reduce((sum, entry) => sum + (typeof entry.nilai === "number" && entry.nilai > 0 ? entry.nilai : 0), 0)}</td><td>{resident.tunggakan}k</td><td>{resident.lebih}k</td></tr>)}
						</tbody></table></div>
					</section>
				</>
			)}
		</main>
	);
};
