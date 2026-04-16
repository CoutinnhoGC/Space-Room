import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Espaco, Instituicao, Reserva, StatusReserva, TipoEspaco, TipoInstituicao, Usuario } from "../types/api";

export function formatDate(date: string) {
  return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string) {
  return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatTimeRange(start: string, end: string) {
  return `${format(parseISO(start), "HH:mm")} - ${format(parseISO(end), "HH:mm")}`;
}

export function formatLongDate(date: Date) {
  return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatMonthYear(date: Date) {
  return format(date, "MMMM yyyy", { locale: ptBR });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getStatusReservaLabel(status?: StatusReserva | null) {
  const map: Record<StatusReserva, string> = {
    PENDENTE: "Pendente",
    CONFIRMADA: "Confirmada",
    CANCELADA: "Cancelada",
    CONCLUIDA: "Concluída",
  };

  return map[status ?? "PENDENTE"];
}

export function getStatusReservaColor(status?: StatusReserva | null) {
  const map: Record<StatusReserva, string> = {
    PENDENTE: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/60",
    CONFIRMADA: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60",
    CANCELADA: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
    CONCLUIDA: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
  };

  return map[status ?? "PENDENTE"];
}

export function getInstituicaoNome(instituicao?: Instituicao | null) {
  return instituicao?.nomeFantasia ?? "Instituição não informada";
}

export function getTipoInstituicaoLabel(tipo?: TipoInstituicao | null) {
  const map: Record<TipoInstituicao, string> = {
    ESCOLA: "Escola",
    FACULDADE: "Faculdade",
    UNIVERSIDADE: "Universidade",
    SENAI: "Senai",
    EMPRESA: "Empresa",
    COWORKING: "Coworking",
    OUTRO: "Outro",
  };

  return tipo ? map[tipo] : "Outro";
}

export function getTipoEspacoLabel(tipo?: TipoEspaco | null) {
  const map: Record<TipoEspaco, string> = {
    SALA: "Sala",
    LABORATORIO: "Laboratório",
    AUDITORIO: "Auditório",
    BIBLIOTECA: "Biblioteca",
    COWORKING: "Coworking",
    SALA_REUNIAO: "Sala de Reunião",
    OUTRO: "Outro",
  };

  return tipo ? map[tipo] : "Outro";
}

export function isReservaAtivaAgora(reserva: Reserva, now = new Date()) {
  return new Date(reserva.dataInicio) <= now && new Date(reserva.dataFim) >= now;
}

export function isReservaHoje(reserva: Reserva, now = new Date()) {
  return isSameDay(new Date(reserva.dataInicio), now);
}

export function getEspacoStatus(espaco: Espaco, reservas: Reserva[], now = new Date()) {
  if (espaco.ativo === false) {
    return "indisponivel";
  }

  const reservaAtiva = reservas.find(
    (reserva) =>
      reserva.idEspaco === espaco.idEspaco &&
      reserva.status !== "CANCELADA" &&
      new Date(reserva.dataInicio) <= now &&
      new Date(reserva.dataFim) >= now,
  );

  return reservaAtiva ? "reservado" : "disponivel";
}

export function resolveReservaRelations(
  reserva: Reserva,
  usuarios: Usuario[],
  espacos: Espaco[],
  instituicoes: Instituicao[],
) {
  return {
    usuario: usuarios.find((item) => item.idUsuario === reserva.idUsuario),
    espaco: espacos.find((item) => item.idEspaco === reserva.idEspaco),
    instituicao: instituicoes.find((item) => item.idInstituicao === reserva.idInstituicao),
  };
}
