import { Filter } from "lucide-react";

interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Instituição */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Instituição
          </label>
          <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>UFRJ - Campus Principal</option>
            <option>UERJ - Maracanã</option>
            <option>PUC-Rio</option>
            <option>Todas as instituições</option>
          </select>
        </div>

        {/* Período */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Período
          </label>
          <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Hoje</option>
            <option>Esta semana</option>
            <option>Este mês</option>
            <option>Últimos 30 dias</option>
          </select>
        </div>

        {/* Tipo de Espaço */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Tipo de Espaço
          </label>
          <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Todos os tipos</option>
            <option>Sala de Aula</option>
            <option>Laboratório</option>
            <option>Auditório</option>
            <option>Sala de Reunião</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Status
          </label>
          <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Todos os status</option>
            <option>Confirmada</option>
            <option>Pendente</option>
            <option>Cancelada</option>
          </select>
        </div>
      </div>
    </div>
  );
}