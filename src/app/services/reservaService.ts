import { del, get, post, put } from "./api";
import type { Reserva } from "../types/api";

export const reservaService = {
  list: () => get<Reserva[]>("/reservas"),
  getById: (id: number) => get<Reserva>(`/reservas/${id}`),
  create: (payload: Reserva) => post<Reserva>("/reservas", payload),
  update: (id: number, payload: Reserva) => put<Reserva>(`/reservas/${id}`, payload),
  remove: (id: number) => del<void>(`/reservas/${id}`),
};
