import type { Espaco, Reserva } from "../types/api";

interface ReservationCandidate {
  idReserva?: number | null;
  idEspaco: number;
  idSubespaco?: number | null;
  dataInicio: string;
  dataFim: string;
}

export function getParentSpaces(espacos: Espaco[], institutionId?: number | string | null) {
  return espacos.filter((item) => {
    const sameInstitution = institutionId == null || String(item.idInstituicao) === String(institutionId);
    return sameInstitution && item.idEspacoPai == null;
  });
}

export function getSubspacesForSpace(espacos: Espaco[], idEspaco?: number | string | null) {
  if (!idEspaco) {
    return [];
  }

  return espacos.filter((item) => String(item.idEspacoPai ?? "") === String(idEspaco));
}

export function getEspacoHierarchyLabel(espaco: Espaco | null | undefined, espacos: Espaco[]) {
  if (!espaco) {
    return "Espaço não encontrado";
  }

  if (!espaco.idEspacoPai) {
    return espaco.nome;
  }

  const parent = espacos.find((item) => item.idEspaco === espaco.idEspacoPai);
  return parent ? `${parent.nome} • ${espaco.nome}` : espaco.nome;
}

export function getReservationSpaceLabel(reserva: Reserva | null | undefined, espacos: Espaco[]) {
  if (!reserva) {
    return "Espaço não encontrado";
  }

  const espaco = espacos.find((item) => item.idEspaco === reserva.idEspaco);
  const subespaco = reserva.idSubespaco ? espacos.find((item) => item.idEspaco === reserva.idSubespaco) : null;

  if (espaco && subespaco) {
    return `${espaco.nome} • ${subespaco.nome}`;
  }

  return espaco?.nome ?? "Espaço não encontrado";
}

export function hasReservationConflict(candidate: ReservationCandidate, reservas: Reserva[]) {
  return reservas.some((reserva) => {
    if (reserva.idReserva === candidate.idReserva) {
      return false;
    }

    if (reserva.status === "CANCELADA") {
      return false;
    }

    if (reserva.idEspaco !== candidate.idEspaco) {
      return false;
    }

    const overlap = new Date(candidate.dataInicio) < new Date(reserva.dataFim) && new Date(candidate.dataFim) > new Date(reserva.dataInicio);
    if (!overlap) {
      return false;
    }

    if (!candidate.idSubespaco) {
      return true;
    }

    if (!reserva.idSubespaco) {
      return true;
    }

    return reserva.idSubespaco === candidate.idSubespaco;
  });
}