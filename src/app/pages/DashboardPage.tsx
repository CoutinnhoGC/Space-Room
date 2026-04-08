import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, Calendar, CheckCircle, Clock, MapPin, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { DashboardFilters, FilterBar } from "../components/FilterBar";
import { RecentActivity } from "../components/RecentActivity";
import { ReservationsChart, OccupationChart } from "../components/ReservationsChart";
import { SpaceStatus } from "../components/SpaceStatus";
import { SummaryCard } from "../components/SummaryCard";
import { UpcomingReservations } from "../components/UpcomingReservations";
import { buildDashboardMetrics, buildOccupationByHour, buildReservationsByDay, filterReservationsByPeriod, getDashboardPeriodLabel } from "../lib/dashboard";
import { formatLongDate } from "../lib/formatters";
import { filterByInstitution } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

const defaultFilters: DashboardFilters = {
  institutionId: "TODAS",
  period: "7_DIAS",
  spaceType: "TODOS",
  status: "TODOS",
};

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

  const visibleInstitutions = useMemo(
    () => filterByInstitution(instituicoes, currentUser, (item) => item.idInstituicao),
    [instituicoes, currentUser],
  );
  const visibleSpaces = useMemo(
    () => filterByInstitution(espacos, currentUser, (item) => item.idInstituicao),
    [espacos, currentUser],
  );
  const visibleUsers = useMemo(
    () => filterByInstitution(usuarios, currentUser, (item) => item.idInstituicao),
    [usuarios, currentUser],
  );
  const visibleReservations = useMemo(
    () => filterByInstitution(reservas, currentUser, (item) => item.idInstituicao),
    [reservas, currentUser],
  );

  const availableSpaceTypes = useMemo(
    () => [...new Set(visibleSpaces.map((item) => item.tipo))].sort(),
    [visibleSpaces],
  );

  const selectedInstitution = useMemo(() => {
    if (filters.institutionId === "TODAS") {
      return currentUser?.idInstituicao
        ? visibleInstitutions.find((item) => item.idInstituicao === currentUser.idInstituicao) ?? null
        : null;
    }

    return visibleInstitutions.find((item) => String(item.idInstituicao) === filters.institutionId) ?? null;
  }, [filters.institutionId, visibleInstitutions, currentUser?.idInstituicao]);

  const filteredSpaces = useMemo(() => {
    return visibleSpaces.filter((space) => {
      const matchesInstitution = filters.institutionId === "TODAS" || String(space.idInstituicao) === filters.institutionId;
      const matchesType = filters.spaceType === "TODOS" || space.tipo === filters.spaceType;
      return matchesInstitution && matchesType;
    });
  }, [visibleSpaces, filters.institutionId, filters.spaceType]);

  const allowedSpaceIds = useMemo(() => new Set(filteredSpaces.map((item) => item.idEspaco)), [filteredSpaces]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((user) => filters.institutionId === "TODAS" || String(user.idInstituicao) === filters.institutionId);
  }, [visibleUsers, filters.institutionId]);

  const filteredReservations = useMemo(() => {
    const institutionAndTypeFiltered = visibleReservations.filter((reservation) => {
      const matchesInstitution = filters.institutionId === "TODAS" || String(reservation.idInstituicao) === filters.institutionId;
      const matchesStatus = filters.status === "TODOS" || reservation.status === filters.status;
      const matchesSpaceType =
        filters.spaceType === "TODOS" || reservation.idEspaco == null || allowedSpaceIds.has(reservation.idEspaco);
      return matchesInstitution && matchesStatus && matchesSpaceType;
    });

    return filterReservationsByPeriod(institutionAndTypeFiltered, filters.period);
  }, [visibleReservations, filters.institutionId, filters.status, filters.period, allowedSpaceIds]);

  const metrics = useMemo(
    () => buildDashboardMetrics(filteredReservations, filteredSpaces, filteredUsers),
    [filteredReservations, filteredSpaces, filteredUsers],
  );
  const reservationsByDay = useMemo(
    () => buildReservationsByDay(filteredReservations, filters.period),
    [filteredReservations, filters.period],
  );
  const occupationByHour = useMemo(() => buildOccupationByHour(filteredReservations), [filteredReservations]);

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
              {(selectedInstitution?.nomeFantasia ?? "Visao geral")} • {formatLongDate(new Date())}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 min-w-[220px]">
            <div className="text-xs uppercase tracking-wide text-gray-500">Visao aplicada</div>
            <div className="text-sm font-medium text-gray-900 mt-1">Reservas {getDashboardPeriodLabel(filters.period)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {filteredReservations.length} reserva(s), {filteredSpaces.length} espaco(s), {filteredUsers.length} usuario(s)
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        instituicoes={visibleInstitutions}
        tiposEspaco={availableSpaceTypes}
        value={filters}
        onFilterChange={setFilters}
        showInstitutionFilter={visibleInstitutions.length > 1}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title={`Reservas ${getDashboardPeriodLabel(filters.period)}`} value={String(filteredReservations.length)} icon={Calendar} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <SummaryCard title="Espacos Ocupados Agora" value={String(metrics.espacosOcupadosAgora)} icon={MapPin} iconColor="text-orange-600" iconBgColor="bg-orange-50" />
        <SummaryCard title="Reservas Pendentes" value={String(metrics.reservasPendentes)} icon={Clock} iconColor="text-yellow-600" iconBgColor="bg-yellow-50" />
        <SummaryCard title="Taxa de Ocupacao" value={`${metrics.taxaOcupacao}%`} icon={TrendingUp} iconColor="text-green-600" iconBgColor="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Espacos Disponiveis" value={String(metrics.espacosDisponiveis)} icon={CheckCircle} iconColor="text-green-600" iconBgColor="bg-green-50" />
        <SummaryCard title="Usuarios Ativos" value={String(metrics.usuariosAtivos)} icon={Activity} iconColor="text-purple-600" iconBgColor="bg-purple-50" />
        <SummaryCard title="Total de Espacos" value={String(metrics.totalEspacos)} icon={MapPin} iconColor="text-gray-600" iconBgColor="bg-gray-50" />
        <SummaryCard title="Instituicoes no Filtro" value={String(filters.institutionId === "TODAS" ? visibleInstitutions.length : selectedInstitution ? 1 : 0)} icon={Building2} iconColor="text-sky-600" iconBgColor="bg-sky-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReservationsChart data={reservationsByDay} />
        <OccupationChart data={occupationByHour} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingReservations reservas={filteredReservations} usuarios={filteredUsers} espacos={filteredSpaces} />
        </div>

        <div>
          <RecentActivity reservas={filteredReservations} usuarios={filteredUsers} espacos={filteredSpaces} />
        </div>
      </div>

      <div className="mt-6">
        <SpaceStatus espacos={filteredSpaces} reservas={filteredReservations} />
      </div>
    </>
  );
}
