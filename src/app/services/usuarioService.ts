import { apiRequest } from "../lib/api";
import { isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
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
  list: () => apiRequest<Usuario[]>("/usuarios"),
  getById: (id: number) => apiRequest<Usuario>(`/usuarios/${id}`),
  create: (payload: Usuario) =>
    apiRequest<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify(sanitizeUsuarioPayload(payload)),
    }),
  update: (id: number, payload: Usuario) =>
    apiRequest<Usuario>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeUsuarioPayload(payload)),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/usuarios/${id}`, {
      method: "DELETE",
    }),
};
