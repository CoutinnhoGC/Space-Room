import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, Calendar, CheckCircle, Clock, MapPin, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { DashboardFilters, FilterBar } from "../components/FilterBar";
import { RecentActivity } from "../components/RecentActivity";
import { OccupationChart, ReservationsChart } from "../components/ReservationsChart";
import { SpaceStatus } from "../components/SpaceStatus";
import { SummaryCard } from "../components/SummaryCard";
import { UpcomingReservations } from "../components/UpcomingReservations";
import { buildDashboardMetrics, buildOccupationByHour, buildReservationsByDay, filterReservationsByPeriod, getDashboardPeriodLabel } from "../lib/dashboard";
import { formatLongDate } from "../lib/formatters";
import { canChooseInstitution, filterByActiveInstitution, getAccessibleInstitutionId } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

const defaultFilters: DashboardFilters = { institutionId: "TODAS", period: "7_DIAS", spaceType: "TODOS", status: "TODOS" };

export function DashboardPage() {
  const currentUser = getCurrentUser();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const visibleInstitutions = useMemo(() => filterByActiveInstitution(instituicoes, currentUser, (item) => item.idInstituicao), [instituicoes, currentUser]);
  const visibleSpaces = useMemo(() => filterByActiveInstitution(espacos, currentUser, (item) => item.idInstituicao), [espacos, currentUser]);
  const visibleUsers = useMemo(() => filterByActiveInstitution(usuarios, currentUser, (item) => item.idInstituicao), [usuarios, currentUser]);
  const visibleReservations = useMemo(() => filterByActiveInstitution(reservas, currentUser, (item) => item.idInstituicao), [reservas, currentUser]);
  const showInstitutionFilter = canChooseInstitution(currentUser, visibleInstitutions.length);
  const effectiveInstitutionId = showInstitutionFilter ? filters.institutionId : String(getAccessibleInstitutionId(currentUser, visibleInstitutions[0]?.idInstituicao) ?? "");
  const availableSpaceTypes = useMemo(() => [...new Set(visibleSpaces.filter((item) => item.idEspacoPai == null).map((item) => item.tipo))].sort(), [visibleSpaces]);

  const selectedInstitution = useMemo(() => {
    if (effectiveInstitutionId === "TODAS") {
      return currentUser?.idInstituicao ? visibleInstitutions.find((item) => item.idInstituicao === currentUser.idInstituicao) ?? null : null;
    }

    return visibleInstitutions.find((item) => String(item.idInstituicao) === effectiveInstitutionId) ?? null;
  }, [effectiveInstitutionId, visibleInstitutions, currentUser?.idInstituicao]);

  const filteredSpaces = useMemo(() => visibleSpaces.filter((space) => space.idEspacoPai == null && (effectiveInstitutionId === "TODAS" || String(space.idInstituicao) === effectiveInstitutionId) && (filters.spaceType === "TODOS" || space.tipo === filters.spaceType)), [visibleSpaces, effectiveInstitutionId, filters.spaceType]);
  const allowedSpaceIds = useMemo(() => new Set(filteredSpaces.map((item) => item.idEspaco)), [filteredSpaces]);
  const filteredUsers = useMemo(() => visibleUsers.filter((user) => effectiveInstitutionId === "TODAS" || String(user.idInstituicao) === effectiveInstitutionId), [visibleUsers, effectiveInstitutionId]);
  const filteredReservations = useMemo(() => filterReservationsByPeriod(visibleReservations.filter((reservation) => (effectiveInstitutionId === "TODAS" || String(reservation.idInstituicao) === effectiveInstitutionId) && (filters.status === "TODOS" || reservation.status === filters.status) && (filters.spaceType === "TODOS" || reservation.idEspaco == null || allowedSpaceIds.has(reservation.idEspaco))), filters.period), [visibleReservations, effectiveInstitutionId, filters.status, filters.period, allowedSpaceIds, filters.spaceType]);

  const metrics = useMemo(() => buildDashboardMetrics(filteredReservations, visibleSpaces, filteredUsers), [filteredReservations, visibleSpaces, filteredUsers]);
  const reservationsByDay = useMemo(() => buildReservationsByDay(filteredReservations, filters.period), [filteredReservations, filters.period]);
  const occupationByHour = useMemo(() => buildOccupationByHour(filteredReservations), [filteredReservations]);

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-slate-400">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-100 bg-white p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{selectedInstitution?.nomeFantasia ?? "Visao geral"} • {formatLongDate(new Date())}</p>
          </div>
          <div className="min-w-[220px] rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Visao aplicada</div>
            <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">Reservas {getDashboardPeriodLabel(filters.period)}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{filteredReservations.length} reserva(s), {visibleSpaces.length} espaco(s), {filteredUsers.length} usuario(s)</div>
          </div>
        </div>
      </div>

      <FilterBar instituicoes={visibleInstitutions} tiposEspaco={availableSpaceTypes} value={{ ...filters, institutionId: effectiveInstitutionId }} onFilterChange={setFilters} showInstitutionFilter={showInstitutionFilter} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={`Reservas ${getDashboardPeriodLabel(filters.period)}`} value={String(filteredReservations.length)} icon={Calendar} />
        <SummaryCard title="Espacos ocupados agora" value={String(metrics.espacosOcupadosAgora)} icon={MapPin} iconColor="text-orange-600 dark:text-orange-300" iconBgColor="bg-orange-50 dark:bg-orange-950/30" />
        <SummaryCard title="Reservas pendentes" value={String(metrics.reservasPendentes)} icon={Clock} iconColor="text-yellow-600 dark:text-yellow-300" iconBgColor="bg-yellow-50 dark:bg-yellow-950/30" />
        <SummaryCard title="Taxa de ocupacao" value={`${metrics.taxaOcupacao}%`} icon={TrendingUp} iconColor="text-green-600 dark:text-green-300" iconBgColor="bg-green-50 dark:bg-green-950/30" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Espacos disponiveis" value={String(metrics.espacosDisponiveis)} icon={CheckCircle} iconColor="text-green-600 dark:text-green-300" iconBgColor="bg-green-50 dark:bg-green-950/30" />
        <SummaryCard title="Usuarios ativos" value={String(metrics.usuariosAtivos)} icon={Activity} iconColor="text-sky-600 dark:text-sky-300" iconBgColor="bg-sky-50 dark:bg-sky-950/30" />
        <SummaryCard title="Total de espacos" value={String(metrics.totalEspacos)} icon={MapPin} iconColor="text-slate-600 dark:text-slate-300" iconBgColor="bg-slate-100 dark:bg-slate-900" />
        <SummaryCard title="Instituicoes visiveis" value={String(showInstitutionFilter ? (effectiveInstitutionId === "TODAS" ? visibleInstitutions.length : selectedInstitution ? 1 : 0) : selectedInstitution ? 1 : 0)} icon={Building2} iconColor="text-blue-600 dark:text-blue-300" iconBgColor="bg-blue-50 dark:bg-blue-950/30" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReservationsChart data={reservationsByDay} />
        <OccupationChart data={occupationByHour} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><UpcomingReservations reservas={filteredReservations} usuarios={filteredUsers} espacos={visibleSpaces} /></div>
        <div><RecentActivity reservas={filteredReservations} usuarios={filteredUsers} espacos={visibleSpaces} /></div>
      </div>

      <div className="mt-6">
        <SpaceStatus espacos={visibleSpaces} reservas={filteredReservations} />
      </div>
    </>
  );
}
