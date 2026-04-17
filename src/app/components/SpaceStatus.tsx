import { CheckCircle, Clock, MapPin, XCircle } from "lucide-react";
import { getEspacoStatus } from "../lib/formatters";
import { getEspacoHierarchyLabel } from "../lib/reservationUtils";
import type { Espaco, Reserva } from "../types/api";

interface SpaceStatusProps {
  espacos: Espaco[];
  reservas: Reserva[];
}

const statusConfig = {
  disponivel: { label: "Disponível", color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900/60", icon: CheckCircle },
  reservado: { label: "Reservado", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/60", icon: Clock },
  indisponivel: { label: "Indisponível", color: "text-gray-700 dark:text-slate-300", bg: "bg-gray-50 dark:bg-slate-900", border: "border-gray-200 dark:border-slate-700", icon: XCircle },
};

export function SpaceStatus({ espacos, reservas }: SpaceStatusProps) {
  const mainSpaces = espacos.filter((item) => item.idEspacoPai == null);
  const statuses = mainSpaces.map((espaco) => ({ ...espaco, status: getEspacoStatus(espaco, reservas) }));
  const stats = {
    disponivel: statuses.filter((item) => item.status === "disponivel").length,
    reservado: statuses.filter((item) => item.status === "reservado").length,
    indisponivel: statuses.filter((item) => item.status === "indisponivel").length,
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Status dos espaços</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Situação atual calculada pelas reservas</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {Object.entries(stats).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;
          return <div key={status} className={`rounded-lg border p-3 ${config.bg} ${config.border}`}><div className="mb-1 flex items-center gap-2"><Icon className={`h-4 w-4 ${config.color}`} /><span className={`text-xs font-medium ${config.color}`}>{config.label}</span></div><div className={`text-2xl font-semibold ${config.color}`}>{count}</div></div>;
        })}
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {statuses.map((space) => {
          const config = statusConfig[space.status as keyof typeof statusConfig];
          const Icon = config.icon;
          return <div key={space.idEspaco} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-900"><div className="flex min-w-0 flex-1 items-center gap-3"><MapPin className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-slate-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{getEspacoHierarchyLabel(space, mainSpaces)}</p><p className="text-xs text-gray-500 dark:text-slate-400">Capacidade: {space.capacidade} pessoas</p></div></div><div className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 ${config.bg}`}><Icon className={`h-3.5 w-3.5 ${config.color}`} /><span className={`hidden text-xs font-medium sm:inline ${config.color}`}>{config.label}</span></div></div>;
        })}
      </div>
    </div>
  );
}