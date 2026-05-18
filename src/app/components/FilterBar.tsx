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
const inputClass = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function FilterBar({ instituicoes, tiposEspaco, value, onFilterChange, showInstitutionFilter = true }: FilterBarProps) {
  const updateField = <K extends keyof DashboardFilters>(field: K, nextValue: DashboardFilters[K]) => onFilterChange({ ...value, [field]: nextValue });
  const resetFilters = () => onFilterChange({ institutionId: showInstitutionFilter ? "TODAS" : value.institutionId, period: "7_DIAS", spaceType: "TODOS", status: "TODOS" });

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" /><h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Filtros</h3></div>
        <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"><RotateCcw className="h-3.5 w-3.5" />Limpar</button>
      </div>

      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${showInstitutionFilter ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {showInstitutionFilter && <div><label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Instituicao</label><select value={value.institutionId} onChange={(event) => updateField("institutionId", event.target.value)} className={inputClass}><option value="TODAS">Todas as instituicoes</option>{instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}</select></div>}
        <div><label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Periodo</label><select value={value.period} onChange={(event) => updateField("period", event.target.value as DashboardPeriod)} className={inputClass}>{periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div><label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Tipo de espaco</label><select value={value.spaceType} onChange={(event) => updateField("spaceType", event.target.value as DashboardFilters["spaceType"])} className={inputClass}><option value="TODOS">Todos os tipos</option>{tiposEspaco.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}</select></div>
        <div><label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Status da reserva</label><select value={value.status} onChange={(event) => updateField("status", event.target.value as DashboardFilters["status"])} className={inputClass}>{statusOptions.map((status) => <option key={status} value={status}>{status === "TODOS" ? "Todos os status" : getStatusReservaLabel(status)}</option>)}</select></div>
      </div>
    </div>
  );
}
