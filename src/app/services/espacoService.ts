import { apiRequest } from "../lib/api";
import { getCurrentUser } from "../lib/session";
import type { Espaco } from "../types/api";

function sanitizeEspacoPayload(payload: Espaco) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return payload;
  }

  return {
    ...payload,
    idInstituicao: currentUser.idInstituicao,
  };
}

export const espacoService = {
  list: () => apiRequest<Espaco[]>("/espacos"),
  getById: (id: number) => apiRequest<Espaco>(`/espacos/${id}`),
  create: (payload: Espaco) =>
    apiRequest<Espaco>("/espacos", {
      method: "POST",
      body: JSON.stringify(sanitizeEspacoPayload(payload)),
    }),
  update: (id: number, payload: Espaco) =>
    apiRequest<Espaco>(`/espacos/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeEspacoPayload(payload)),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/espacos/${id}`, {
      method: "DELETE",
    }),
};
