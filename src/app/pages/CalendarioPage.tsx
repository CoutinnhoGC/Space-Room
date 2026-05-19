import { CalendarDays, Clock, MapPin } from "lucide-react";
import { endOfMonth, format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar } from "../components/ui/calendar";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { filterByActiveInstitution } from "../lib/permissions";
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
        setReservas(filterByActiveInstitution(reservasData, currentUser, (item) => item.idInstituicao));
        setEspacos(filterByActiveInstitution(espacosData, currentUser, (item) => item.idInstituicao));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar calendário.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.adminPlataforma, currentUser?.idInstituicao, currentUser?.idUsuario]);

  const selectedReservations = useMemo(() => reservas.filter((reserva) => isSameDay(new Date(reserva.dataInicio), selectedDate)).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()), [reservas, selectedDate]);
  const monthReservations = useMemo(() => reservas.filter((reserva) => isSameMonth(new Date(reserva.dataInicio), currentMonth) && reserva.status !== "CANCELADA"), [reservas, currentMonth]);
  const reservationDays = useMemo(() => monthReservations.map((reserva) => new Date(reserva.dataInicio)), [monthReservations]);
  const monthSummary = useMemo(() => ({ total: monthReservations.length, confirmed: monthReservations.filter((item) => item.status === "CONFIRMADA").length, pending: monthReservations.filter((item) => item.status === "PENDENTE").length }), [monthReservations]);

  if (error) {
    return <div className="rounded-xl border border-red-100 bg-white p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Agenda</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Acompanhe a ocupação dos espaços por data e horário.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Calendário</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
              <button type="button" onClick={() => { const today = new Date(); setSelectedDate(today); setCurrentMonth(startOfMonth(today)); }} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60">Hoje</button>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 dark:border-slate-800 dark:bg-slate-900/70">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={selectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{ hasReservations: reservationDays }}
                modifiersClassNames={{ hasReservations: "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-blue-500" }}
                className="w-full"
                classNames={{ month: "w-full gap-3", caption_label: "text-sm font-semibold text-gray-900 dark:text-slate-100", head_cell: "w-10 text-[0.75rem] font-medium text-gray-400 dark:text-slate-500", day: "h-10 w-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300", day_today: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white", cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent", row: "mt-1.5 flex w-full justify-between" }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-slate-100">Resumo do mês</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 dark:border-blue-900/60 dark:bg-blue-950/30"><div className="text-xs text-blue-700 dark:text-blue-300">Reservas</div><div className="mt-1 text-xl font-semibold text-blue-900 dark:text-blue-100">{monthSummary.total}</div></div>
              <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-3 dark:border-green-900/60 dark:bg-green-950/30"><div className="text-xs text-green-700 dark:text-green-300">Confirmadas</div><div className="mt-1 text-xl font-semibold text-green-900 dark:text-green-100">{monthSummary.confirmed}</div></div>
              <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-3 dark:border-yellow-900/60 dark:bg-yellow-950/30"><div className="text-xs text-yellow-700 dark:text-yellow-300">Pendentes</div><div className="mt-1 text-xl font-semibold text-yellow-900 dark:text-yellow-100">{monthSummary.pending}</div></div>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-slate-400">Dias com reservas aparecem com um marcador azul no calendário.</div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"><CalendarDays className="h-3.5 w-3.5" />Dia selecionado</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{selectedReservations.length} reserva(s) agendada(s) para esta data.</p>
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{formatDate(selectedDate.toISOString())}</div>
            </div>

            <div className="space-y-3">
              {selectedReservations.map((item) => {
                const espaco = espacos.find((space) => space.idEspaco === item.idEspaco);
                return (
                  <div key={item.idReserva} className="rounded-xl border border-gray-100 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><MapPin className="h-4 w-4 text-blue-600 dark:text-blue-300" /><span>{espaco?.nome ?? item.titulo}</span></div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300"><Clock className="h-4 w-4 text-gray-400 dark:text-slate-500" /><span>{formatTimeRange(item.dataInicio, item.dataFim)}</span></div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{item.finalidade || item.observacao || "Sem observação adicional."}</div>
                      </div>
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(item.status)}`}>{getStatusReservaLabel(item.status)}</span>
                    </div>
                  </div>
                );
              })}

              {!loading && selectedReservations.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">Nenhuma reserva para a data selecionada.</div>}
              {loading && <div className="text-sm text-gray-500 dark:text-slate-400">Carregando agenda...</div>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-slate-100">Janela observada</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">Exibindo as reservas de {format(startOfMonth(currentMonth), "dd/MM/yyyy")} até {format(endOfMonth(currentMonth), "dd/MM/yyyy")}, com foco visual no dia selecionado.</p>
          </div>
        </div>
      </div>
    </>
  );
}
