import { apiRequest, cachedApiRequest, invalidateApiCache } from "../lib/api";
import { isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { CACHE_TTL } from "./cacheConfig";
import type { Reserva } from "../types/api";

function sanitizeReservaPayload(payload: Reserva) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return payload;
  }

  return {
    ...payload,
    idInstituicao: isPlatformAdmin(currentUser) ? payload.idInstituicao : currentUser.idInstituicao,
    idUsuario: payload.idUsuario ?? currentUser.idUsuario ?? 0,
  };
}

export const reservaService = {
  list: () => cachedApiRequest<Reserva[]>("/reservas", CACHE_TTL.reservas),
  getById: (id: number) => cachedApiRequest<Reserva>(`/reservas/${id}`, CACHE_TTL.reservas),
  create: (payload: Reserva) =>
    apiRequest<Reserva>("/reservas", {
      method: "POST",
      body: JSON.stringify(sanitizeReservaPayload(payload)),
    }).finally(() => invalidateApiCache("/reservas")),
  update: (id: number, payload: Reserva) =>
    apiRequest<Reserva>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeReservaPayload(payload)),
    }).finally(() => invalidateApiCache("/reservas")),
  remove: (id: number) =>
    apiRequest<void>(`/reservas/${id}`, {
      method: "DELETE",
    }).finally(() => invalidateApiCache("/reservas")),
};
