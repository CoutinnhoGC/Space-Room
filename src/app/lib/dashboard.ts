import { eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";
import type { DashboardPeriod } from "../components/FilterBar";
import type { DashboardMetrics, Espaco, Reserva, Usuario } from "../types/api";
import { isReservaAtivaAgora, isReservaHoje } from "./formatters";

export function buildDashboardMetrics(reservas: Reserva[], espacos: Espaco[], usuarios: Usuario[]): DashboardMetrics {
  const now = new Date();
  const totalEspacos = espacos.length;
  const espacosOcupadosAgora = reservas.filter((item) => item.status !== "CANCELADA" && isReservaAtivaAgora(item, now)).length;
  const reservasHoje = reservas.filter((item) => item.status !== "CANCELADA" && isReservaHoje(item, now)).length;
  const reservasPendentes = reservas.filter((item) => item.status === "PENDENTE").length;
  const espacosDisponiveis = Math.max(totalEspacos - espacosOcupadosAgora, 0);
  const taxaOcupacao = totalEspacos === 0 ? 0 : Math.round((espacosOcupadosAgora / totalEspacos) * 100);
  const usuariosAtivos = usuarios.filter((item) => item.ativo !== false).length;

  return {
    totalReservasHoje: reservasHoje,
    espacosOcupadosAgora,
    reservasPendentes,
    taxaOcupacao,
    espacosDisponiveis,
    usuariosAtivos,
    totalEspacos,
    totalInstituicoes: new Set(usuarios.map((item) => item.idInstituicao)).size,
  };
}

export function filterReservationsByPeriod(reservas: Reserva[], period: DashboardPeriod, now = new Date()) {
  const currentDate = startOfDay(now);
  const currentMonthStart = startOfMonth(currentDate);

  return reservas.filter((item) => {
    const start = new Date(item.dataInicio);

    switch (period) {
      case "HOJE":
        return start >= currentDate && start <= endOfDay(currentDate);
      case "7_DIAS":
        return start >= subDays(currentDate, 6) && start <= endOfDay(currentDate);
      case "30_DIAS":
        return start >= subDays(currentDate, 29) && start <= endOfDay(currentDate);
      case "MES_ATUAL":
        return start >= currentMonthStart && start <= endOfMonth(currentDate);
    }
  });
}

export function getDashboardPeriodLabel(period: DashboardPeriod) {
  switch (period) {
    case "HOJE":
      return "hoje";
    case "7_DIAS":
      return "nos ultimos 7 dias";
    case "30_DIAS":
      return "nos ultimos 30 dias";
    case "MES_ATUAL":
      return "no mes atual";
  }
}

export function buildReservationsByDay(reservas: Reserva[], period: DashboardPeriod) {
  const today = startOfDay(new Date());
  const periodStart = (() => {
    switch (period) {
      case "HOJE":
        return today;
      case "7_DIAS":
        return subDays(today, 6);
      case "30_DIAS":
        return subDays(today, 29);
      case "MES_ATUAL":
        return startOfMonth(today);
    }
  })();

  const interval = eachDayOfInterval({ start: periodStart, end: today });
  const shortRange = interval.length <= 7;

  return interval.map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const count = reservas.filter((item) => item.dataInicio.startsWith(key) && item.status !== "CANCELADA").length;

    return {
      name: format(date, shortRange ? "EEE" : "dd/MM"),
      reservas: count,
    };
  });
}

export function buildOccupationByHour(reservas: Reserva[]) {
  const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  return hours.map((hour) => {
    const [hourPart] = hour.split(":");
    const count = reservas.filter((item) => {
      const start = new Date(item.dataInicio).getHours();
      const end = new Date(item.dataFim).getHours();
      const value = Number(hourPart);
      return item.status !== "CANCELADA" && value >= start && value < end;
    }).length;

    return {
      name: hour,
      ocupacao: count,
    };
  });
}
