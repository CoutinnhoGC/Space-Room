import { Filter, RotateCcw } from "lucide-react";
import { getStatusReservaLabel, getTipoEspacoLabel } from "../lib/formatters";
import type { Instituicao, StatusReserva, TipoEspaco } from "../types/api";

export type DashboardPeriod = "HOJE" | "7_DIAS" | "30_DIAS" | "MES_ATUAL";

export interface DashboardFilters {
  institutionId: string;
  period: DashboardPeriod;
  spaceType: TipoEspaco | "TODOS";
  status: StatusReserva | "TODOS";
}

interface FilterBarProps {
  instituicoes: Instituicao[];
  tiposEspaco: TipoEspaco[];
  value: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
  showInstitutionFilter?: boolean;
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "HOJE", label: "Hoje" },
  { value: "7_DIAS", label: "Ultimos 7 dias" },
  { value: "30_DIAS", label: "Ultimos 30 dias" },
  { value: "MES_ATUAL", label: "Mes atual" },
];

const statusOptions: Array<StatusReserva | "TODOS"> = ["TODOS", "CONFIRMADA", "PENDENTE", "CANCELADA", "CONCLUIDA"];

export function FilterBar({ instituicoes, tiposEspaco, value, onFilterChange, showInstitutionFilter = true }: FilterBarProps) {
  const updateField = <K extends keyof DashboardFilters>(field: K, nextValue: DashboardFilters[K]) => {
    onFilterChange({ ...value, [field]: nextValue });
  };

  const resetFilters = () => {
    onFilterChange({
      institutionId: "TODAS",
      period: "7_DIAS",
      spaceType: "TODOS",
      status: "TODOS",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Instituicao</label>
          <select
            value={value.institutionId}
            onChange={(event) => updateField("institutionId", event.target.value)}
            disabled={!showInstitutionFilter}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TODAS">{showInstitutionFilter ? "Todas as instituicoes" : "Instituicao atual"}</option>
            {instituicoes.map((instituicao) => (
              <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>
                {instituicao.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Periodo</label>
          <select
            value={value.period}
            onChange={(event) => updateField("period", event.target.value as DashboardPeriod)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de Espaco</label>
          <select
            value={value.spaceType}
            onChange={(event) => updateField("spaceType", event.target.value as DashboardFilters["spaceType"])}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TODOS">Todos os tipos</option>
            {tiposEspaco.map((tipo) => (
              <option key={tipo} value={tipo}>
                {getTipoEspacoLabel(tipo)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Status da Reserva</label>
          <select
            value={value.status}
            onChange={(event) => updateField("status", event.target.value as DashboardFilters["status"])}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "TODOS" ? "Todos os status" : getStatusReservaLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
