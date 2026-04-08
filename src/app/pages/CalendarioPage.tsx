import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { endOfMonth, format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "../components/ui/calendar";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { filterByInstitution } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import type { Espaco, Reserva } from "../types/api";

export function CalendarioPage() {
  const currentUser = getCurrentUser();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, espacosData] = await Promise.all([reservaService.list(), espacoService.list()]);
        setReservas(filterByInstitution(reservasData, currentUser, (item) => item.idInstituicao));
        setEspacos(filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar calendario.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.adminPlataforma, currentUser?.idInstituicao, currentUser?.idUsuario]);

  const selectedReservations = useMemo(() => {
    return reservas
      .filter((reserva) => isSameDay(new Date(reserva.dataInicio), selectedDate))
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }, [reservas, selectedDate]);

  const monthReservations = useMemo(() => {
    return reservas.filter((reserva) => isSameMonth(new Date(reserva.dataInicio), currentMonth) && reserva.status !== "CANCELADA");
  }, [reservas, currentMonth]);

  const reservationDays = useMemo(
    () => monthReservations.map((reserva) => new Date(reserva.dataInicio)),
    [monthReservations],
  );

  const monthSummary = useMemo(() => {
    const confirmed = monthReservations.filter((item) => item.status === "CONFIRMADA").length;
    const pending = monthReservations.filter((item) => item.status === "PENDENTE").length;
    return {
      total: monthReservations.length,
      confirmed,
      pending,
    };
  }, [monthReservations]);

  if (error) {
    return <div className="bg-white border border-red-100 text-red-700 rounded-xl p-6 text-sm">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agenda</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe a ocupacao dos espacos por data e horario</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Calendario</h2>
                <p className="text-xs text-gray-500 mt-1">{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentMonth(startOfMonth(today));
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Hoje
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={selectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{ hasReservations: reservationDays }}
                modifiersClassNames={{
                  hasReservations: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-blue-500",
                }}
                className="w-full"
                classNames={{
                  month: "w-full gap-3",
                  caption_label: "text-sm font-semibold text-gray-900",
                  head_cell: "w-10 text-[0.75rem] font-medium text-gray-400",
                  day: "h-10 w-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700",
                  day_today: "bg-blue-50 text-blue-700",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
                  cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent",
                  row: "mt-1.5 flex w-full justify-between",
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumo do mes</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-50 px-3 py-3 border border-blue-100">
                <div className="text-xs text-blue-700">Reservas</div>
                <div className="text-xl font-semibold text-blue-900 mt-1">{monthSummary.total}</div>
              </div>
              <div className="rounded-xl bg-green-50 px-3 py-3 border border-green-100">
                <div className="text-xs text-green-700">Confirmadas</div>
                <div className="text-xl font-semibold text-green-900 mt-1">{monthSummary.confirmed}</div>
              </div>
              <div className="rounded-xl bg-yellow-50 px-3 py-3 border border-yellow-100">
                <div className="text-xs text-yellow-700">Pendentes</div>
                <div className="text-xl font-semibold text-yellow-900 mt-1">{monthSummary.pending}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Dias com reservas aparecem com um marcador azul no calendario.
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-3">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Dia selecionado
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReservations.length} reserva(s) agendada(s) para esta data</p>
              </div>
              <div className="text-sm text-gray-500">{formatDate(selectedDate.toISOString())}</div>
            </div>

            <div className="space-y-3">
              {selectedReservations.map((item) => {
                const espaco = espacos.find((space) => space.idEspaco === item.idEspaco);
                return (
                  <div key={item.idReserva} className="rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{espaco?.nome ?? item.titulo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTimeRange(item.dataInicio, item.dataFim)}</span>
                        </div>
                        <div className="text-sm text-gray-500">{item.finalidade || item.observacao || "Sem observacao adicional."}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusReservaColor(item.status)}`}>
                        {getStatusReservaLabel(item.status)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!loading && selectedReservations.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-sm text-gray-500 text-center">
                  Nenhuma reserva para a data selecionada.
                </div>
              )}

              {loading && <div className="text-sm text-gray-500">Carregando agenda...</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Janela observada</h3>
            <p className="text-sm text-gray-600">
              Exibindo as reservas de {format(startOfMonth(currentMonth), "dd/MM/yyyy")} ate {format(endOfMonth(currentMonth), "dd/MM/yyyy")}, com foco visual no dia selecionado.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
