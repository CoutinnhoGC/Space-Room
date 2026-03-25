import { Clock, MapPin, User } from "lucide-react";
import { Link } from "react-router";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
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
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Proximas Reservas</h3>
        <p className="text-sm text-gray-500 mt-1">Agendamentos registrados na API</p>
      </div>

      <div className="space-y-3">
        {upcoming.map((reservation) => {
          const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);
          const espaco = espacos.find((item) => item.idEspaco === reservation.idEspaco);

          return (
            <div key={reservation.idReserva} className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <h4 className="font-medium text-gray-900 text-sm truncate">{espaco?.nome ?? reservation.titulo}</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{usuario?.nome ?? "Usuario nao encontrado"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(reservation.dataInicio)} • {formatTimeRange(reservation.dataInicio, reservation.dataFim)}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusReservaColor(reservation.status)}`}>
                  {getStatusReservaLabel(reservation.status)}
                </span>
              </div>
            </div>
          );
        })}

        {upcoming.length === 0 && <div className="text-sm text-gray-500">Nenhuma reserva encontrada.</div>}
      </div>

      <Link to="/reservas" className="block w-full mt-4 py-2 text-center text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
        Ver todas as reservas
      </Link>
    </div>
  );
}
