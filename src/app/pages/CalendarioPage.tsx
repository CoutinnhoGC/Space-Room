import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { reservaService } from "../services/reservaService";
import { espacoService } from "../services/espacoService";
import type { Espaco, Reserva } from "../types/api";

export function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, espacosData] = await Promise.all([reservaService.list(), espacoService.list()]);
        setReservas(reservasData);
        setEspacos(espacosData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar calendario.";
        setError(message);
        toast.error(message);
      }
    };

    load();
  }, []);

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const selectedReservations = useMemo(() => {
    return reservas
      .filter((reserva) => isSameDay(new Date(reserva.dataInicio), selectedDate))
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }, [reservas, selectedDate]);

  if (error) {
    return <div className="bg-white border border-red-100 text-red-700 rounded-xl p-6 text-sm">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
        <p className="text-sm text-gray-500 mt-1">Visualize as reservas por data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth((value) => subMonths(value, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => { setCurrentMonth(startOfMonth(new Date())); setSelectedDate(new Date()); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Hoje</button>
                <button onClick={() => setCurrentMonth((value) => addMonths(value, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">{days.map((day) => <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">{day}</div>)}</div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const isToday = isSameDay(date, new Date());
                const hasReservation = reservas.some((reserva) => isSameDay(new Date(reserva.dataInicio), date));
                const isSelected = isSameDay(date, selectedDate);

                return (
                  <button key={date.toISOString()} onClick={() => setSelectedDate(date)} className={`aspect-square p-2 rounded-lg text-sm transition-all relative ${isSelected ? "bg-blue-500 text-white font-semibold" : hasReservation ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "hover:bg-gray-50 text-gray-700"} ${!isSameMonth(date, currentMonth) ? "opacity-40" : ""}`}>
                    {format(date, "d")}
                    {hasReservation && !isSelected && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-blue-600"}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservas do Dia</h3>
            <p className="text-sm text-gray-500 mb-4">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>

            <div className="space-y-3">
              {selectedReservations.map((item) => {
                const espaco = espacos.find((space) => space.idEspaco === item.idEspaco);
                return (
                  <div key={item.idReserva} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-1 h-full bg-blue-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{espaco?.nome ?? item.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(item.dataInicio), "HH:mm")} - {format(new Date(item.dataFim), "HH:mm")}</p>
                    </div>
                  </div>
                );
              })}
              {selectedReservations.length === 0 && <div className="text-sm text-gray-500">Nenhuma reserva para a data selecionada.</div>}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Legenda</h4>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li>Dia selecionado: azul forte</li>
                  <li>Dia com reservas: azul claro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
