import type { DailyRecapStatus, FinanceTransaction, ResidentRecord } from "./monthly";

export function nextMonthKey(monthKey: string): string {
	const [year, month] = monthKey.split("-").map(Number);
	const next = new Date(Date.UTC(year, month, 1));
	return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function hasRecordedMonthlyJimpitan(transactions: FinanceTransaction[], monthLabel: string): boolean {
	const expectedPrefix = `jimpitan ${monthLabel}`.toLocaleLowerCase("id-ID");
	return transactions.some((transaction) => transaction.kategori.toLocaleLowerCase("id-ID").startsWith(expectedPrefix));
}

export function calculatePaidJimpitan(
	monthKey: string,
	residents: ResidentRecord[],
	statuses: Record<string, DailyRecapStatus>,
): number {
	const [year, month] = monthKey.split("-").map(Number);
	const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const totalRibuan = Array.from({ length: days }, (_, dayIndex) => {
		if (statuses[String(dayIndex + 1)]?.status !== "sudah") return 0;
		return residents.reduce((sum, resident) => {
			const value = resident.setoran[dayIndex]?.nilai;
			return sum + (typeof value === "number" && value > 0 ? value : 0);
		}, 0);
	}).reduce((sum, dailyTotal) => sum + dailyTotal, 0);
	return totalRibuan * 1000;
}

function transactionEffect(transaction: FinanceTransaction): number {
	switch (transaction.jenis) {
		case "pemasukan":
		case "pengembalian":
			return transaction.nominal;
		case "pengeluaran":
		case "pinjaman":
			return -transaction.nominal;
		case "saldo_awal":
		case "catatan":
			return 0;
	}
}

export function calculateMonthClosingBalance(
	openingBalance: number,
	transactions: FinanceTransaction[],
	monthlyJimpitan: number,
	monthLabel: string,
): number {
	let balance = openingBalance;
	if (!hasRecordedMonthlyJimpitan(transactions, monthLabel)) balance += monthlyJimpitan;
	const ordered = [...transactions].sort((left, right) => {
		if (left.urutanSumber !== undefined || right.urutanSumber !== undefined) {
			return (left.urutanSumber ?? Number.MAX_SAFE_INTEGER) - (right.urutanSumber ?? Number.MAX_SAFE_INTEGER);
		}
		return left.tanggal.localeCompare(right.tanggal) || left.dibuatPada - right.dibuatPada;
	});

	for (const transaction of ordered) {
		if (transaction.jenis === "saldo_awal") {
			balance = transaction.saldoTercatat ?? transaction.nominal;
		} else if (transaction.saldoTercatat !== undefined) {
			balance = transaction.saldoTercatat;
		} else {
			balance += transactionEffect(transaction);
		}
	}

	return balance;
}

export function applyRunningBalances(
	openingBalance: number,
	transactions: FinanceTransaction[],
): FinanceTransaction[] {
	let balance = openingBalance;
	return transactions.map((transaction) => {
		if (transaction.jenis === "saldo_awal") {
			balance = transaction.saldoTercatat ?? transaction.nominal;
		} else if (transaction.saldoTercatat !== undefined) {
			balance = transaction.saldoTercatat;
		} else {
			balance += transactionEffect(transaction);
		}
		return { ...transaction, saldoTercatat: balance };
	});
}
