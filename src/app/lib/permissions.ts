import type { Cargo, Instituicao, TipoInstituicao, Usuario } from "../types/api";

const schoolInstitutionTypes: TipoInstituicao[] = ["INSTITUICAO_ENSINO", "ESCOLA", "FACULDADE", "UNIVERSIDADE", "SENAI"];
const schoolRoles = new Set(["diretor", "diretora", "vice diretor", "vice diretora", "vice-diretor", "vice-diretora", "docente", "professor", "professora", "coordenador", "coordenadora"]);
const businessRoles = new Set(["dono", "dona", "proprietario", "proprietaria", "socio", "socia", "gerente", "gestor", "gestora", "administrador", "administradora"]);
const platformAdminRoles = new Set(["administrador da plataforma", "admin plataforma", "super admin"]);
const institutionAdminRoles = new Set(["administrador da instituicao", "admin instituicao", "proprietario da instituicao"]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function isPlatformAdmin(user: Usuario | null | undefined) {
  return user?.adminPlataforma === true;
}

export function isPlatformAdminRole(cargo: Cargo | null | undefined) {
  if (!cargo) {
    return false;
  }

  return cargo.sistema === true && platformAdminRoles.has(normalize(cargo.nome));
}

export function isInstitutionAdminRole(cargo: Cargo | null | undefined) {
  return Boolean(cargo && institutionAdminRoles.has(normalize(cargo.nome)));
}

export function canManageUsers(user: Usuario | null | undefined) {
  return isPlatformAdmin(user) || user?.podeGerenciarUsuarios === true;
}

export function canManageSpaces(user: Usuario | null | undefined) {
  return isPlatformAdmin(user) || user?.podeGerenciarEspacos === true;
}

export function canApproveReservations(user: Usuario | null | undefined) {
  return isPlatformAdmin(user) || user?.podeAprovarReservas === true;
}

export function canViewAudit(user: Usuario | null | undefined, cargo?: Cargo | null) {
  return isPlatformAdmin(user) || user?.podeVisualizarAuditoria === true || isInstitutionAdminRole(cargo);
}

export function canManageInstitutions(user: Usuario | null | undefined) {
  return isPlatformAdmin(user);
}

export function canChooseInstitution(user: Usuario | null | undefined, institutionCount = 1) {
  return Boolean(user) && institutionCount > 1;
}

export function getAccessibleInstitutionId(user: Usuario | null | undefined, requestedInstitutionId?: number | null) {
  if (isPlatformAdmin(user)) {
    return requestedInstitutionId ?? user?.idInstituicao ?? null;
  }

  return user?.idInstituicao ?? requestedInstitutionId ?? null;
}

export function canReserve(user: Usuario | null | undefined) {
  return user?.podeReservar === true;
}

export function canAccessManagementNotifications(user: Usuario | null | undefined, _cargos: Cargo[]) {
  if (!user) {
    return false;
  }

  return isPlatformAdmin(user) || user.podeGerenciarComunicados === true || user.podeGerenciarUsuarios === true;
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

export function filterByActiveInstitution<T>(items: T[], user: Usuario | null | undefined, getInstitutionId: (item: T) => number | undefined) {
  if (!user?.idInstituicao || isPlatformAdmin(user)) {
    return items;
  }

  return items.filter((item) => getInstitutionId(item) === user.idInstituicao);
}

export function getDefaultRolesForInstitutionType(tipo?: TipoInstituicao | null) {
  if (!tipo) {
    return [];
  }

  if (schoolInstitutionTypes.includes(tipo)) {
    return ["diretor", "vice-diretor", "coordenador", "professor", "aluno"];
  }

  if (tipo === "EMPRESA") {
    return ["ceo", "diretor", "gerente", "supervisor", "colaborador"];
  }

  if (tipo === "ORGAO_PUBLICO") {
    return ["gestor", "coordenador", "servidor"];
  }

  if (tipo === "CENTRO_PESQUISA") {
    return ["coordenador", "pesquisador", "tecnico"];
  }

  if (tipo === "COWORKING") {
    return ["gestor", "recepcionista", "membro"];
  }

  return ["coordenador", "pesquisador", "tecnico"];
}

export function isRoleAvailableForInstitution(cargo: Cargo, instituicao?: Instituicao | null) {
  if (cargo.ativo === false || isPlatformAdminRole(cargo)) {
    return false;
  }

  if (cargo.idInstituicao != null && instituicao?.idInstituicao !== cargo.idInstituicao) {
    return false;
  }

  if (cargo.tipoInstituicao != null && instituicao?.tipo !== cargo.tipoInstituicao) {
    return false;
  }

  if (cargo.idInstituicao != null || cargo.tipoInstituicao != null || cargo.personalizado === true) {
    return true;
  }

  const defaultRoles = getDefaultRolesForInstitutionType(instituicao?.tipo);
  return defaultRoles.length === 0 || defaultRoles.includes(normalize(cargo.nome)) || isInstitutionAdminRole(cargo);
}

export function getAssignableRoles(cargos: Cargo[], instituicao: Instituicao | null | undefined, user: Usuario | null | undefined) {
  return cargos.filter((cargo) => isPlatformAdmin(user) ? cargo.ativo !== false : isRoleAvailableForInstitution(cargo, instituicao));
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
