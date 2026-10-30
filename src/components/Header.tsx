import { Link, NavLink } from "react-router";

const localEnvironment = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const showAdminEntry = localEnvironment.VITE_ADMIN_LOGIN_ENABLED === "true";

export const Header = () => (
	<header className="site-header">
		<Link className="site-brand" to="/" aria-label="Jimpitan RT 02, beranda">
			Jimpitan <span>RT 02</span>
		</Link>
		<nav className="site-nav" aria-label="Navigasi utama">
			<NavLink
				end
				to="/"
				className={({ isActive }) =>
					isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"
				}
			>
				Home
			</NavLink>
			<NavLink
				to="/rekap-jimpitan"
				className={({ isActive }) =>
					isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"
				}
			>
				Rekap Jimpitan
			</NavLink>
			<NavLink
				to="/data-keuangan"
				className={({ isActive }) =>
					isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"
				}
			>
				Riwayat Keuangan
			</NavLink>
			{showAdminEntry && <NavLink
				to="/settings"
				className={({ isActive }) =>
					isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"
				}
			>
				Login Admin
			</NavLink>}
		</nav>
	</header>
);