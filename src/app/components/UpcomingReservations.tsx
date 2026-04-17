import { Clock, MapPin, User } from "lucide-react";
import { Link } from "react-router";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { getReservationSpaceLabel } from "../lib/reservationUtils";
import type { Espaco, Reserva, Usuario } from "../types/api";

interface UpcomingReservationsProps {
  reservas: Reserva[];
  usuarios: Usuario[];
  espacos: Espaco[];
}

export function UpcomingReservations({ reservas, usuarios, espacos }: UpcomingReservationsProps) {
  const upcoming = [...reservas]
    .filter((item) => item.status !== "CANCELADA")
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Próximas reservas</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Agendamentos registrados na API</p>
      </div>

      <div className="space-y-3">
        {upcoming.map((reservation) => {
          const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);

          return (
            <div key={reservation.idReserva} className="rounded-lg border border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                    <h4 className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{getReservationSpaceLabel(reservation, espacos)}</h4>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-slate-300 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /><span>{usuario?.nome ?? "Usuário não encontrado"}</span></div>
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /><span>{formatDate(reservation.dataInicio)} • {formatTimeRange(reservation.dataInicio, reservation.dataFim)}</span></div>
                  </div>
                </div>

                <span className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(reservation.status)}`}>
                  {getStatusReservaLabel(reservation.status)}
                </span>
              </div>
            </div>
          );
        })}

        {upcoming.length === 0 && <div className="text-sm text-gray-500 dark:text-slate-400">Nenhuma reserva encontrada.</div>}
      </div>

      <Link to="/reservas" className="mt-4 block w-full rounded-lg py-2 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30">
        Ver todas as reservas
      </Link>
    </div>
  );
}