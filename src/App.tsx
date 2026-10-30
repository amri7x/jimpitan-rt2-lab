import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        lazy: async () => ({
          Component: (await import("./pages/Home")).Home,
        }),
      },
      {
        path: "rekap-jimpitan",
        lazy: async () => ({
          Component: (await import("./pages/Rekap_Jimpitan")).Rekap_Jimpitan,
        }),
      },
      {
        path: "data-keuangan",
        lazy: async () => ({
          Component: (await import("./pages/Data_Keuangan")).Data_Keuangan,
        }),
      },
      {
        path: "settings",
        lazy: async () => ({
          Component: (await import("./pages/Settings")).Settings,
        }),
      },
    ],
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
