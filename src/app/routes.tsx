import { createBrowserRouter } from "react-router";
import { DashboardPage } from "./pages/DashboardPage";
import { ReservasPage } from "./pages/ReservasPage";
import { NovaReservaPage } from "./pages/NovaReservaPage";
import { EspacosPage } from "./pages/EspacosPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { InstituicoesPage } from "./pages/InstituicoesPage";
import { CalendarioPage } from "./pages/CalendarioPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/cadastro",
    Component: CadastroPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: DashboardPage,
      },
      {
        path: "dashboard",
        Component: DashboardPage,
      },
      {
        path: "reservas",
        Component: ReservasPage,
      },
      {
        path: "reservas/nova",
        Component: NovaReservaPage,
      },
      {
        path: "espacos",
        Component: EspacosPage,
      },
      {
        path: "usuarios",
        Component: UsuariosPage,
      },
      {
        path: "instituicoes",
        Component: InstituicoesPage,
      },
      {
        path: "calendario",
        Component: CalendarioPage,
      },
      {
        path: "relatorios",
        Component: RelatoriosPage,
      },
      {
        path: "configuracoes",
        Component: ConfiguracoesPage,
      },
    ],
  },
]);