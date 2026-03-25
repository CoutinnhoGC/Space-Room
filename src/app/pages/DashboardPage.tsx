import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, MapPin, Clock, Activity, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { FilterBar } from "../components/FilterBar";
import { SummaryCard } from "../components/SummaryCard";
import { ReservationsChart, OccupationChart } from "../components/ReservationsChart";
import { UpcomingReservations } from "../components/UpcomingReservations";
import { RecentActivity } from "../components/RecentActivity";
import { SpaceStatus } from "../components/SpaceStatus";
import { buildDashboardMetrics, buildOccupationByHour, buildReservationsByDay } from "../lib/dashboard";
import { formatLongDate } from "../lib/formatters";
import { instituicaoService } from "../services/instituicaoService";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import { getCurrentUser } from "../lib/session";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

export function DashboardPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, espacosData, usuariosData, instituicoesData] = await Promise.all([
          reservaService.list(),
          espacoService.list(),
          usuarioService.list(),
          instituicaoService.list(),
        ]);
        setReservas(reservasData);
        setEspacos(espacosData);
        setUsuarios(usuariosData);
        setInstituicoes(instituicoesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar dashboard.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => buildDashboardMetrics(reservas, espacos, usuarios), [reservas, espacos, usuarios]);
  const reservationsByDay = useMemo(() => buildReservationsByDay(reservas), [reservas]);
  const occupationByHour = useMemo(() => buildOccupationByHour(reservas), [reservas]);
  const currentInstitution = instituicoes.find((item) => item.idInstituicao === currentUser?.idInstituicao);

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="bg-white border border-red-100 text-red-700 rounded-xl p-6 text-sm">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {(currentInstitution?.nomeFantasia ?? "Visao geral")} • {formatLongDate(new Date())}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Periodo:</span>
            <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Hoje</option>
              <option>Ultimos 7 dias</option>
              <option>Ultimos 30 dias</option>
            </select>
          </div>
        </div>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Reservas Hoje" value={String(metrics.totalReservasHoje)} icon={Calendar} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <SummaryCard title="Espacos Ocupados Agora" value={String(metrics.espacosOcupadosAgora)} icon={MapPin} iconColor="text-orange-600" iconBgColor="bg-orange-50" />
        <SummaryCard title="Reservas Pendentes" value={String(metrics.reservasPendentes)} icon={Clock} iconColor="text-yellow-600" iconBgColor="bg-yellow-50" />
        <SummaryCard title="Taxa de Ocupacao" value={`${metrics.taxaOcupacao}%`} icon={TrendingUp} iconColor="text-green-600" iconBgColor="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Espacos Disponiveis" value={String(metrics.espacosDisponiveis)} icon={CheckCircle} iconColor="text-green-600" iconBgColor="bg-green-50" />
        <SummaryCard title="Usuarios Ativos" value={String(metrics.usuariosAtivos)} icon={Activity} iconColor="text-purple-600" iconBgColor="bg-purple-50" />
        <SummaryCard title="Total de Espacos" value={String(metrics.totalEspacos)} icon={MapPin} iconColor="text-gray-600" iconBgColor="bg-gray-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReservationsChart data={reservationsByDay} />
        <OccupationChart data={occupationByHour} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingReservations reservas={reservas} usuarios={usuarios} espacos={espacos} />
        </div>

        <div>
          <RecentActivity reservas={reservas} usuarios={usuarios} espacos={espacos} />
        </div>
      </div>

      <div className="mt-6">
        <SpaceStatus espacos={espacos} reservas={reservas} />
      </div>
    </>
  );
}
