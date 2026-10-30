export type SetoranValue = number | "-" | null;

export interface SetoranRecord {
	nilai: SetoranValue;
	asalTanggal: number | null;
	petugas: string | null;
	isManual: boolean;
	wasDash: boolean;
	isSessionEdit?: boolean;
	diperbaruiTanggal?: string;
}

export interface ResidentRecord {
	id: number;
	nama: string;
	tunggakanAwal: number;
	lebihAwal: number;
	tunggakan: number;
	lebih: number;
	logHutangAwal: string;
	logHutang: string;
	setoranAwal: SetoranRecord[];
	setoran: SetoranRecord[];
}

export interface MonthlyJimpitan {
	monthKey: string;
	status: "active" | "archived";
	createdAt: number;
	archivedAt?: number;
	warga: ResidentRecord[];
}

export interface FinanceTransaction {
	id: string;
	tanggal: string;
	jenis: "saldo_awal" | "pemasukan" | "pengeluaran" | "pinjaman" | "pengembalian" | "catatan";
	kategori: string;
	nominal: number;
	keterangan: string;
	dibuatOleh: string;
	dibuatPada: number;
	diperbaruiPada?: number;
	diperbaruiOleh?: string;
	saldoTercatat?: number;
	tanggalSumber?: string;
	urutanSumber?: number;
}

export interface DepositStatus {
	tanggal: string;
	nominal: number;
	status: "sudah" | "belum";
	keterangan: string;
	diperbaruiOleh: string;
	diperbaruiPada: number;
}

export interface DailyRecapStatus {
	status: "sudah" | "belum";
	diperbaruiOleh: string;
	diperbaruiPada: number;
}

export const TIME_ZONE = "Asia/Jakarta";

export function getActiveMonthKey(date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: TIME_ZONE,
		year: "numeric",
		month: "2-digit",
	}).formatToParts(date);
	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	if (!year || !month) throw new Error("Tidak dapat menentukan bulan WIB.");
	return `${year}-${month}`;
}

export function getTodayInJakarta(date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;
	if (!year || !month || !day) throw new Error("Tidak dapat menentukan tanggal WIB.");
	return `${year}-${month}-${day}`;
}

export function getDaysInMonth(monthKey: string): number {
	const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
	if (!match) throw new Error(`Format bulan tidak valid: ${monthKey}`);
	return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
}

export function getPreviousMonthKey(monthKey: string): string {
	const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
	if (!match) throw new Error(`Format bulan tidak valid: ${monthKey}`);
	const previous = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 2, 1));
	return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKey: string): string {
	const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
	if (!match) throw new Error(`Format bulan tidak valid: ${monthKey}`);
	return new Intl.DateTimeFormat("id-ID", {
		month: "long",
		year: "numeric",
		timeZone: TIME_ZONE,
	}).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

export function createEmptySetoran(days: number): SetoranRecord[] {
	return Array.from({ length: days }, () => ({
		nilai: null,
		asalTanggal: null,
		petugas: null,
		isManual: false,
		wasDash: false,
	}));
}

export function prepareResidentForMonth(
	resident: ResidentRecord,
	days: number,
	carryBalance = true,
): ResidentRecord {
	const tunggakanAwal = carryBalance ? resident.tunggakan : 0;
	const lebihAwal = carryBalance ? resident.lebih : 0;
	return {
		...resident,
		tunggakanAwal,
		lebihAwal,
		tunggakan: tunggakanAwal,
		lebih: lebihAwal,
		logHutangAwal: resident.logHutang || "",
		logHutang: resident.logHutang || "",
		setoranAwal: createEmptySetoran(days),
		setoran: createEmptySetoran(days),
	};
}

export function getMonthPaths(monthKey: string) {
	return {
		month: `jimpitan/months/${monthKey}`,
		warga: `jimpitan/months/${monthKey}/warga`,
		transactions: `finance/months/${monthKey}/transactions`,
		deposits: `finance/months/${monthKey}/deposits`,
	};
}