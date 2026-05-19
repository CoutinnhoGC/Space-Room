import { apiRequest } from "../lib/api";
import { getCurrentUser } from "../lib/session";
import type { Reserva } from "../types/api";

function sanitizeReservaPayload(payload: Reserva) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return payload;
  }

  return {
    ...payload,
    idInstituicao: currentUser.idInstituicao,
    idUsuario: currentUser.idUsuario ?? payload.idUsuario,
  };
}

export const reservaService = {
  list: () => apiRequest<Reserva[]>("/reservas"),
  getById: (id: number) => apiRequest<Reserva>(`/reservas/${id}`),
  create: (payload: Reserva) =>
    apiRequest<Reserva>("/reservas", {
      method: "POST",
      body: JSON.stringify(sanitizeReservaPayload(payload)),
    }),
  update: (id: number, payload: Reserva) =>
    apiRequest<Reserva>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(sanitizeReservaPayload(payload)),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/reservas/${id}`, {
      method: "DELETE",
    }),
};
