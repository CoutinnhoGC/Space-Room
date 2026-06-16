import { apiRequest, cachedApiRequest, invalidateApiCache } from "../lib/api";
import { getCurrentUser } from "../lib/session";
import { CACHE_TTL } from "./cacheConfig";
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
  list: () => cachedApiRequest<Espaco[]>("/espacos", CACHE_TTL.espacos),
  getById: (id: number) => cachedApiRequest<Espaco>(`/espacos/${id}`, CACHE_TTL.espacos),
  create: (payload: Espaco) =>
    apiRequest<Espaco>("/espacos", {
      method: "POST",
      body: JSON.stringify(sanitizeEspacoPayload(payload)),
    }).finally(() => invalidateApiCache("/espacos")),
  update: (id: number, payload: Espaco) =>
    apiRequest<Espaco>(`/espacos/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeEspacoPayload(payload)),
    }).finally(() => invalidateApiCache("/espacos")),
  remove: (id: number) =>
    apiRequest<void>(`/espacos/${id}`, {
      method: "DELETE",
    }).finally(() => invalidateApiCache("/espacos")),
};
