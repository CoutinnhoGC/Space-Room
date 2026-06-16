import { apiRequest, cachedApiRequest, invalidateApiCache } from "../lib/api";
import { isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { CACHE_TTL } from "./cacheConfig";
import type { Usuario } from "../types/api";

function sanitizeUsuarioPayload(payload: Usuario) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return payload;
  }

  const nextPayload: Usuario = { ...payload };
  if (!isPlatformAdmin(currentUser)) {
    nextPayload.idInstituicao = currentUser.idInstituicao;
    delete nextPayload.adminPlataforma;
  }

  return nextPayload;
}

export const usuarioService = {
  list: () => cachedApiRequest<Usuario[]>("/usuarios", CACHE_TTL.usuarios),
  getById: (id: number) => cachedApiRequest<Usuario>(`/usuarios/${id}`, CACHE_TTL.usuarios),
  create: (payload: Usuario) =>
    apiRequest<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify(sanitizeUsuarioPayload(payload)),
    }).finally(() => invalidateApiCache("/usuarios")),
  update: (id: number, payload: Usuario) =>
    apiRequest<Usuario>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeUsuarioPayload(payload)),
    }).finally(() => invalidateApiCache("/usuarios")),
  remove: (id: number) =>
    apiRequest<void>(`/usuarios/${id}`, {
      method: "DELETE",
    }).finally(() => invalidateApiCache("/usuarios")),
};
