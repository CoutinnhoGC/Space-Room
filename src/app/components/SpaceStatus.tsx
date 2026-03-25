import { MapPin, CheckCircle, Clock, XCircle } from "lucide-react";
import { getEspacoStatus } from "../lib/formatters";
import type { Espaco, Reserva } from "../types/api";

interface SpaceStatusProps {
  espacos: Espaco[];
  reservas: Reserva[];
}

const statusConfig = {
  disponivel: {
    label: "Disponivel",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
  },
  reservado: {
    label: "Reservado",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  indisponivel: {
    label: "Indisponivel",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: XCircle,
  },
};

export function SpaceStatus({ espacos, reservas }: SpaceStatusProps) {
  const statuses = espacos.map((espaco) => ({ ...espaco, status: getEspacoStatus(espaco, reservas) }));
  const stats = {
    disponivel: statuses.filter((item) => item.status === "disponivel").length,
    reservado: statuses.filter((item) => item.status === "reservado").length,
    indisponivel: statuses.filter((item) => item.status === "indisponivel").length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status dos Espacos</h3>
        <p className="text-sm text-gray-500 mt-1">Situacao atual calculada pelas reservas</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(stats).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;

          return (
            <div key={status} className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
              <div className={`text-2xl font-semibold ${config.color}`}>{count}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {statuses.map((space) => {
          const config = statusConfig[space.status as keyof typeof statusConfig];
          const Icon = config.icon;

          return (
            <div key={space.idEspaco} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{space.nome}</p>
                  <p className="text-xs text-gray-500">Capacidade: {space.capacidade} pessoas</p>
                </div>
              </div>

              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bg} flex-shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color} hidden sm:inline`}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
