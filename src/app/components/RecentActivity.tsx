import { CheckCircle2, Clock, UserPlus, XCircle } from "lucide-react";
import { formatDateTime } from "../lib/formatters";
import { getReservationSpaceLabel } from "../lib/reservationUtils";
import type { Espaco, Reserva, Usuario } from "../types/api";

interface RecentActivityProps {
  reservas: Reserva[];
  usuarios: Usuario[];
  espacos: Espaco[];
}

export function RecentActivity({ reservas, usuarios, espacos }: RecentActivityProps) {
  const activities = [...reservas]
    .sort((a, b) => new Date(b.atualizadoEm ?? b.criadoEm ?? b.dataInicio).getTime() - new Date(a.atualizadoEm ?? a.criadoEm ?? a.dataInicio).getTime())
    .slice(0, 5)
    .map((reserva) => {
      const usuario = usuarios.find((item) => item.idUsuario === reserva.idUsuario);
      const isCanceled = reserva.status === "CANCELADA";
      const isPending = reserva.status === "PENDENTE";

      return {
        id: reserva.idReserva,
        icon: isCanceled ? XCircle : isPending ? Clock : CheckCircle2,
        iconColor: isCanceled ? "text-red-600 dark:text-red-300" : isPending ? "text-yellow-600 dark:text-yellow-300" : "text-green-600 dark:text-green-300",
        iconBg: isCanceled ? "bg-red-50 dark:bg-red-950/30" : isPending ? "bg-yellow-50 dark:bg-yellow-950/30" : "bg-green-50 dark:bg-green-950/30",
        title: isCanceled ? "Reserva cancelada" : isPending ? "Reserva pendente" : "Reserva atualizada",
        description: `${getReservationSpaceLabel(reserva, espacos)} • ${usuario?.nome ?? "Usuário"}`,
        time: formatDateTime(reserva.atualizadoEm ?? reserva.criadoEm ?? reserva.dataInicio),
      };
    });

  if (usuarios.length > 0) {
    activities.unshift({
      id: `user-${usuarios[0].idUsuario}`,
      icon: UserPlus,
      iconColor: "text-blue-600 dark:text-blue-300",
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      title: "Usuário em destaque",
      description: `${usuarios[0].nome} • ${usuarios[0].email}`,
      time: formatDateTime(usuarios[0].atualizadoEm ?? usuarios[0].criadoEm ?? new Date().toISOString()),
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Atividades recentes</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Últimas atualizações do sistema</p>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => {
          const Icon = activity.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`${activity.iconBg} rounded-lg p-2`}>
                <Icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{activity.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{activity.description}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
