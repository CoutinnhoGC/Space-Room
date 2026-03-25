import { apiRequest } from "../lib/api";
import type { Reserva } from "../types/api";

export const reservaService = {
  list: () => apiRequest<Reserva[]>("/reservas"),
  getById: (id: number) => apiRequest<Reserva>(`/reservas/${id}`),
  create: (payload: Reserva) =>
    apiRequest<Reserva>("/reservas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Reserva) =>
    apiRequest<Reserva>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/reservas/${id}`, {
      method: "DELETE",
    }),
};
