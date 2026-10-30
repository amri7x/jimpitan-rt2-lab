import { Outlet, useNavigation } from "react-router";
import { Header } from "./Header";

export const Layout = () => {
	const navigation = useNavigation();

	return (
		<>
			<Header />
			{navigation.state === "loading" ? <p role="status">Memuat halaman...</p> : <Outlet />}
		</>
	);
};