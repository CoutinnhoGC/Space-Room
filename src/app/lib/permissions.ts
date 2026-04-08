import type { Cargo, Instituicao, TipoInstituicao, Usuario } from "../types/api";

const schoolInstitutionTypes: TipoInstituicao[] = ["ESCOLA", "FACULDADE", "UNIVERSIDADE", "SENAI"];
const schoolRoles = new Set(["diretor", "diretora", "vice diretor", "vice diretora", "vice-diretor", "vice-diretora", "docente", "professor", "professora", "coordenador", "coordenadora"]);
const businessRoles = new Set(["dono", "dona", "proprietario", "proprietaria", "socio", "socia", "gerente", "gestor", "gestora", "administrador", "administradora"]);
const managementRoles = new Set([
  "diretor",
  "diretora",
  "vice diretor",
  "vice diretora",
  "vice-diretor",
  "vice-diretora",
  "coordenador",
  "coordenadora",
  "dono",
  "dona",
  "proprietario",
  "proprietaria",
  "socio",
  "socia",
  "gerente",
  "gestor",
  "gestora",
  "administrador",
  "administradora",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function isManagementCargoName(value?: string | null) {
  if (!value) {
    return false;
  }

  return managementRoles.has(normalize(value));
}

export function isPlatformAdmin(user: Usuario | null | undefined) {
  return user?.adminPlataforma === true;
}

export function canManageInstitutions(user: Usuario | null | undefined) {
  return isPlatformAdmin(user);
}

export function canReserve(user: Usuario | null | undefined) {
  return user?.podeReservar === true;
}

export function canAccessManagementNotifications(user: Usuario | null | undefined, cargos: Cargo[]) {
  if (!user) {
    return false;
  }

  if (isPlatformAdmin(user)) {
    return true;
  }

  const cargo = cargos.find((item) => item.idCargo === user.idCargo);
  return isManagementCargoName(cargo?.nome);
}

export function isRestrictedToOwnInstitution(user: Usuario | null | undefined) {
  return Boolean(user && !isPlatformAdmin(user));
}

export function belongsToInstitution(user: Usuario | null | undefined, idInstituicao?: number | null) {
  if (!user || idInstituicao == null || isPlatformAdmin(user)) {
    return true;
  }

  return user.idInstituicao === idInstituicao;
}

export function filterByInstitution<T>(items: T[], user: Usuario | null | undefined, getInstitutionId: (item: T) => number | undefined) {
  if (!isRestrictedToOwnInstitution(user)) {
    return items;
  }

  return items.filter((item) => getInstitutionId(item) === user?.idInstituicao);
}

export function inferDefaultReservationPermission(cargoId: number | undefined, institutionId: number | undefined, cargos: Cargo[], instituicoes: Instituicao[]) {
  if (!cargoId || !institutionId) {
    return false;
  }

  const cargo = cargos.find((item) => item.idCargo === cargoId);
  const instituicao = instituicoes.find((item) => item.idInstituicao === institutionId);
  if (!cargo || !instituicao) {
    return false;
  }

  const normalizedRole = normalize(cargo.nome);
  const allowedRoles = schoolInstitutionTypes.includes(instituicao.tipo) ? schoolRoles : businessRoles;
  return allowedRoles.has(normalizedRole);
}
