import { CheckCircle2, XCircle, UserPlus, Clock } from "lucide-react";
import { formatDateTime } from "../lib/formatters";
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
      const espaco = espacos.find((item) => item.idEspaco === reserva.idEspaco);
      const isCanceled = reserva.status === "CANCELADA";
      const isPending = reserva.status === "PENDENTE";

      return {
        id: reserva.idReserva,
        icon: isCanceled ? XCircle : isPending ? Clock : CheckCircle2,
        iconColor: isCanceled ? "text-red-600" : isPending ? "text-yellow-600" : "text-green-600",
        iconBg: isCanceled ? "bg-red-50" : isPending ? "bg-yellow-50" : "bg-green-50",
        title: isCanceled ? "Reserva cancelada" : isPending ? "Reserva pendente" : "Reserva atualizada",
        description: `${espaco?.nome ?? reserva.titulo} • ${usuario?.nome ?? "Usuario"}`,
        time: formatDateTime(reserva.atualizadoEm ?? reserva.criadoEm ?? reserva.dataInicio),
      };
    });

  if (usuarios.length > 0) {
    activities.unshift({
      id: `user-${usuarios[0].idUsuario}`,
      icon: UserPlus,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      title: "Usuario em destaque",
      description: `${usuarios[0].nome} • ${usuarios[0].email}`,
      time: formatDateTime(usuarios[0].atualizadoEm ?? usuarios[0].criadoEm ?? new Date().toISOString()),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
        <p className="text-sm text-gray-500 mt-1">Ultimas atualizacoes do sistema</p>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => {
          const Icon = activity.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`${activity.iconBg} p-2 rounded-lg flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${activity.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
