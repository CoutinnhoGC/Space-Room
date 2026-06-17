import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { CalendarioPage } from "./pages/CalendarioPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EspacosPage } from "./pages/EspacosPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { InstituicoesPage } from "./pages/InstituicoesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NovaReservaPage } from "./pages/NovaReservaPage";
import { PerfilPage } from "./pages/PerfilPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ReservasPage } from "./pages/ReservasPage";
import { UsuariosPage } from "./pages/UsuariosPage";

export const router = createBrowserRouter([
  {
    Component: PublicRoute,
    children: [
      {
        path: "/login",
        Component: LoginPage,
      },
      {
        path: "/esqueci-senha",
        Component: ForgotPasswordPage,
      },
      {
        path: "/plataforma",
        Component: LandingPage,
      },
    ],
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          {
            index: true,
            Component: HomePage,
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
          {
            path: "perfil",
            Component: PerfilPage,
          },
        ],
      },
    ],
  },
]);
