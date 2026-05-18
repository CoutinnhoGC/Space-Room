import type { Espaco, Reserva } from "../types/api";

interface ReservationCandidate {
  idReserva?: number | null;
  idEspaco: number;
  idSubespaco?: number | null;
  dataInicio: string;
  dataFim: string;
}

export interface SpaceOption {
  id: number;
  label: string;
  level: number;
  space: Espaco;
}

export interface ReservationConflictDetails {
  conflict: boolean;
  reason: "SELF" | "PARENT_BLOCKS_CHILD" | "CHILD_BLOCKS_PARENT" | null;
  message: string;
  blockingSpace: Espaco | null;
  blockingReservation: Reserva | null;
}

export interface SpaceAvailabilityDetails {
  status: "disponivel" | "reservado" | "indisponivel";
  source: "PROPRIO_ESPACO" | "PAI" | "FILHO" | "FILHOS_OCUPADOS" | null;
  message: string;
  blockingSpace: Espaco | null;
  blockingReservation: Reserva | null;
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

export function getSpaceById(espacos: Espaco[], idEspaco?: number | string | null) {
  if (!idEspaco) {
    return null;
  }

  return espacos.find((item) => String(item.idEspaco) === String(idEspaco)) ?? null;
}

export function getAncestorSpaces(espacos: Espaco[], idEspaco?: number | string | null) {
  const ancestors: Espaco[] = [];
  const visited = new Set<string>();
  let current = getSpaceById(espacos, idEspaco);

  while (current?.idEspacoPai) {
    const parent = getSpaceById(espacos, current.idEspacoPai);
    if (!parent || visited.has(String(parent.idEspaco))) {
      break;
    }

    ancestors.unshift(parent);
    visited.add(String(parent.idEspaco));
    current = parent;
  }

  return ancestors;
}

export function getDescendantSpaces(espacos: Espaco[], idEspaco?: number | string | null) {
  if (!idEspaco) {
    return [];
  }

  const descendants: Espaco[] = [];
  const queue = [...getSubspacesForSpace(espacos, idEspaco)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    descendants.push(current);
    queue.push(...getSubspacesForSpace(espacos, current.idEspaco));
  }

  return descendants;
}

export function getRootSpace(espacos: Espaco[], idEspaco?: number | string | null) {
  const current = getSpaceById(espacos, idEspaco);
  if (!current) {
    return null;
  }

  const ancestors = getAncestorSpaces(espacos, current.idEspaco);
  return ancestors[0] ?? current;
}

export function getSpaceHierarchyLevel(espacos: Espaco[], idEspaco?: number | string | null) {
  return getAncestorSpaces(espacos, idEspaco).length;
}

export function getSpacePathIds(espacos: Espaco[], idEspaco?: number | string | null) {
  const current = getSpaceById(espacos, idEspaco);
  if (!current?.idEspaco) {
    return [];
  }

  return [...getAncestorSpaces(espacos, current.idEspaco).map((item) => item.idEspaco as number), current.idEspaco];
}

export function getHierarchicalSpaceOptions(espacos: Espaco[], institutionId?: number | string | null) {
  const roots = getParentSpaces(espacos, institutionId);
  const options: SpaceOption[] = [];

  const visit = (space: Espaco, level: number) => {
    if (!space.idEspaco) {
      return;
    }

    options.push({
      id: space.idEspaco,
      label: getEspacoHierarchyLabel(space, espacos),
      level,
      space,
    });

    getSubspacesForSpace(espacos, space.idEspaco)
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((child) => visit(child, level + 1));
  };

  roots
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach((space) => visit(space, 0));

  return options;
}

export function canAssignParentSpace(espacos: Espaco[], space: Pick<Espaco, "idEspaco" | "idInstituicao">, parentId?: number | null) {
  if (!parentId) {
    return { valid: true as const, reason: "" };
  }

  if (space.idEspaco && parentId === space.idEspaco) {
    return { valid: false as const, reason: "Um espaco nao pode ser pai dele mesmo." };
  }

  const parent = getSpaceById(espacos, parentId);
  if (!parent) {
    return { valid: false as const, reason: "O espaco pai informado nao foi encontrado." };
  }

  if (parent.idInstituicao !== space.idInstituicao) {
    return { valid: false as const, reason: "O espaco pai deve pertencer a mesma instituicao." };
  }

  if (space.idEspaco && getDescendantSpaces(espacos, space.idEspaco).some((item) => item.idEspaco === parentId)) {
    return { valid: false as const, reason: "Nao e possivel criar circularidade na hierarquia." };
  }

  return { valid: true as const, reason: "" };
}

function resolveReservedSpaceId(reserva: Pick<Reserva, "idEspaco" | "idSubespaco">) {
  return reserva.idSubespaco ?? reserva.idEspaco;
}

function overlaps(candidate: Pick<ReservationCandidate, "dataInicio" | "dataFim">, reserva: Pick<Reserva, "dataInicio" | "dataFim">) {
  return new Date(candidate.dataInicio) < new Date(reserva.dataFim) && new Date(candidate.dataFim) > new Date(reserva.dataInicio);
}

function isAncestorSpace(espacos: Espaco[], ancestorId: number, descendantId: number) {
  return getAncestorSpaces(espacos, descendantId).some((item) => item.idEspaco === ancestorId);
}

export function getEspacoHierarchyLabel(espaco: Espaco | null | undefined, espacos: Espaco[]) {
  if (!espaco) {
    return "Espaco nao encontrado";
  }

  const names = [...getAncestorSpaces(espacos, espaco.idEspaco).map((item) => item.nome), espaco.nome];
  return names.join(" • ");
}

export function getReservationSpaceLabel(reserva: Reserva | null | undefined, espacos: Espaco[]) {
  if (!reserva) {
    return "Espaco nao encontrado";
  }

  const reservedSpace = getSpaceById(espacos, resolveReservedSpaceId(reserva));
  return getEspacoHierarchyLabel(reservedSpace, espacos);
}

export function getReservationConflictDetails(candidate: ReservationCandidate, reservas: Reserva[], espacos: Espaco[]): ReservationConflictDetails {
  const candidateTargetId = candidate.idSubespaco ?? candidate.idEspaco;
  const candidateSpace = getSpaceById(espacos, candidateTargetId);

  if (!candidateSpace) {
    return {
      conflict: false,
      reason: null,
      message: "",
      blockingSpace: null,
      blockingReservation: null,
    };
  }

  for (const reserva of reservas) {
    if (reserva.idReserva === candidate.idReserva || reserva.status === "CANCELADA" || !overlaps(candidate, reserva)) {
      continue;
    }

    const reservedTargetId = resolveReservedSpaceId(reserva);
    const reservedSpace = getSpaceById(espacos, reservedTargetId);
    if (!reservedSpace) {
      continue;
    }

    if (reservedSpace.idEspaco === candidateSpace.idEspaco) {
      return {
        conflict: true,
        reason: "SELF",
        message: "Ja existe uma reserva no proprio espaco para este intervalo.",
        blockingSpace: reservedSpace,
        blockingReservation: reserva,
      };
    }

    if (isAncestorSpace(espacos, reservedSpace.idEspaco as number, candidateSpace.idEspaco as number) && reservedSpace.bloqueiaSubespacos !== false) {
      return {
        conflict: true,
        reason: "PARENT_BLOCKS_CHILD",
        message: `${reservedSpace.nome} bloqueia este subespaco no intervalo selecionado.`,
        blockingSpace: reservedSpace,
        blockingReservation: reserva,
      };
    }

    if (isAncestorSpace(espacos, candidateSpace.idEspaco as number, reservedSpace.idEspaco as number) && candidateSpace.bloqueadoPorSubespacos === true) {
      return {
        conflict: true,
        reason: "CHILD_BLOCKS_PARENT",
        message: `${reservedSpace.nome} bloqueia o espaco pai neste intervalo.`,
        blockingSpace: reservedSpace,
        blockingReservation: reserva,
      };
    }
  }

  return {
    conflict: false,
    reason: null,
    message: "",
    blockingSpace: null,
    blockingReservation: null,
  };
}

export function hasReservationConflict(candidate: ReservationCandidate, reservas: Reserva[], espacos: Espaco[] = []) {
  if (espacos.length === 0) {
    return reservas.some((reserva) => {
      if (reserva.idReserva === candidate.idReserva || reserva.status === "CANCELADA" || reserva.idEspaco !== candidate.idEspaco) {
        return false;
      }

      if (!overlaps(candidate, reserva)) {
        return false;
      }

      if (!candidate.idSubespaco || !reserva.idSubespaco) {
        return true;
      }

      return reserva.idSubespaco === candidate.idSubespaco;
    });
  }

  return getReservationConflictDetails(candidate, reservas, espacos).conflict;
}

export function getSpaceAvailabilityDetails(espaco: Espaco, reservas: Reserva[], espacos: Espaco[], interval?: Pick<ReservationCandidate, "dataInicio" | "dataFim">): SpaceAvailabilityDetails {
  const currentInterval = interval ?? {
    dataInicio: new Date().toISOString(),
    dataFim: new Date(Date.now() + 60_000).toISOString(),
  };

  const rootSpace = getRootSpace(espacos, espaco.idEspaco) ?? espaco;
  const candidate: ReservationCandidate = {
    idEspaco: rootSpace.idEspaco as number,
    idSubespaco: rootSpace.idEspaco === espaco.idEspaco ? null : (espaco.idEspaco as number),
    dataInicio: currentInterval.dataInicio,
    dataFim: currentInterval.dataFim,
  };

  const conflict = getReservationConflictDetails(candidate, reservas, espacos);
  if (conflict.conflict) {
    return {
      status: conflict.reason === "SELF" ? "reservado" : "indisponivel",
      source: conflict.reason === "SELF" ? "PROPRIO_ESPACO" : conflict.reason === "PARENT_BLOCKS_CHILD" ? "PAI" : "FILHO",
      message: conflict.message,
      blockingSpace: conflict.blockingSpace,
      blockingReservation: conflict.blockingReservation,
    };
  }

  const directChildren = getSubspacesForSpace(espacos, espaco.idEspaco);
  if (directChildren.length > 0) {
    const allChildrenUnavailable = directChildren.every((child) => {
      const childAvailability = getSpaceAvailabilityDetails(child, reservas, espacos, currentInterval);
      return childAvailability.status !== "disponivel";
    });

    if (allChildrenUnavailable) {
      return {
        status: "indisponivel",
        source: "FILHOS_OCUPADOS",
        message: "Todos os subespacos deste espaco estao ocupados no intervalo.",
        blockingSpace: null,
        blockingReservation: null,
      };
    }
  }

  return {
    status: "disponivel",
    source: null,
    message: "Disponivel para reserva.",
    blockingSpace: null,
    blockingReservation: null,
  };
}
