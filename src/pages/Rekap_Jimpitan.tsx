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
		<main className="finance-page recap-page">
			<div className="finance-heading">
				<p className="finance-eyebrow">Arsip Jimpitan</p>
				<h1>Rekap Jimpitan</h1>
				<p>Rekap harian dan catatan setoran warga untuk {monthLabel(monthKey)}.</p>
			</div>
			<div className="finance-toolbar">
				<label htmlFor="recap-month">Bulan</label>
				<input id="recap-month" type="month" value={monthKey} max={getActiveMonthKey()} onChange={(event) => setMonthKey(event.target.value)} />
				<strong>{monthLabel(monthKey)}</strong>
				{data && <span className={`month-status month-status-${data.status}`}>{data.status === "active" ? "Bulan aktif" : "Arsip"}</span>}
			</div>
			{loading ? <p role="status">Memuat rekap...</p> : loadError ? <p className="form-error" role="alert">Tidak dapat membaca rekap Firebase: {loadError}</p> : !data ? <p className="finance-empty" role="status">Belum ada data untuk bulan ini.</p> : (
				<>
					<section className="finance-totals" aria-label="Ringkasan rekap bulan">
						<div><span>Total bulan</span><strong>{totalAll}k</strong></div>
						<div><span>Total sudah setor</span><strong>{totalPaid}k</strong></div>
						<div><span>Total belum setor</span><strong>{totalAll - totalPaid}k</strong></div>
						<div><span>Warga</span><strong>{data.warga.length}</strong></div>
					</section>
					<section className="finance-section">
						<h2>Ringkasan Harian</h2>
						<div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Hari</th><th>Tanggal</th><th>Uang (ribu)</th><th>Status</th><th>Nama Petugas</th></tr></thead><tbody>
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
					<section className="finance-section">
						<h2>Detail Setoran Warga</h2>
						<div className="finance-table-wrap"><table className="finance-table recap-matrix"><thead><tr><th>No</th><th>Nama Warga</th>{days.map((day) => <th key={day} title={`${formatWeekday(day)} ${monthKey}-${String(day).padStart(2, "0")}`}>{day}<small>{data.recap?.days?.[String(day)]?.status === "sudah" ? "Setor" : "Belum"}</small></th>)}<th>Total</th><th>Tunggakan</th><th>Lebih</th></tr></thead><tbody>
							{data.warga.map((resident, index) => <tr key={resident.id}><td>{index + 1}</td><td>{resident.nama}</td>{days.map((day) => {
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
