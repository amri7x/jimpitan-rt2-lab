import { Link, NavLink } from "react-router";

const localEnvironment = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const showAdminEntry = localEnvironment.VITE_ADMIN_LOGIN_ENABLED === "true";

export const Header = () => (
	<header className="flex min-h-[58px] items-center justify-between gap-5 border-b border-gray-300 bg-white px-[18px] py-2 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-1 max-[480px]:px-3 max-[480px]:py-2.5">
		<Link className="whitespace-nowrap text-lg font-extrabold text-green-800 no-underline" to="/" aria-label="Jimpitan RT 02, beranda">
			Jimpitan <span className="font-medium text-slate-600">RT 02</span>
		</Link>
		<nav className="flex items-center gap-2 max-[480px]:w-full max-[480px]:gap-1" aria-label="Navigasi utama">
			<NavLink
				end
				to="/"
				className={({ isActive }) =>
					isActive ? "rounded px-3 py-[9px] text-sm font-semibold text-green-800 no-underline bg-green-100 max-[480px]:p-2 max-[480px]:text-[13px]" : "rounded px-3 py-[9px] text-sm font-semibold text-slate-600 no-underline hover:bg-green-100 hover:text-green-800 max-[480px]:p-2 max-[480px]:text-[13px]"
				}
			>
				Home
			</NavLink>
			<NavLink
				to="/rekap-jimpitan"
				className={({ isActive }) =>
					isActive ? "rounded px-3 py-[9px] text-sm font-semibold text-green-800 no-underline bg-green-100 max-[480px]:p-2 max-[480px]:text-[13px]" : "rounded px-3 py-[9px] text-sm font-semibold text-slate-600 no-underline hover:bg-green-100 hover:text-green-800 max-[480px]:p-2 max-[480px]:text-[13px]"
				}
			>
				Rekap Jimpitan
			</NavLink>
			<NavLink
				to="/data-keuangan"
				className={({ isActive }) =>
					isActive ? "rounded px-3 py-[9px] text-sm font-semibold text-green-800 no-underline bg-green-100 max-[480px]:p-2 max-[480px]:text-[13px]" : "rounded px-3 py-[9px] text-sm font-semibold text-slate-600 no-underline hover:bg-green-100 hover:text-green-800 max-[480px]:p-2 max-[480px]:text-[13px]"
				}
			>
				Riwayat Keuangan
			</NavLink>
			{showAdminEntry && <NavLink
				to="/settings"
				className={({ isActive }) =>
					isActive ? "rounded px-3 py-[9px] text-sm font-semibold text-green-800 no-underline bg-green-100 max-[480px]:p-2 max-[480px]:text-[13px]" : "rounded px-3 py-[9px] text-sm font-semibold text-slate-600 no-underline hover:bg-green-100 hover:text-green-800 max-[480px]:p-2 max-[480px]:text-[13px]"
				}
			>
				Login Admin
			</NavLink>}
		</nav>
	</header>
);
