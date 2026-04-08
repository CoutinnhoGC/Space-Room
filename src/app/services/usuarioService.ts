import { apiRequest } from "../lib/api";
import type { Usuario } from "../types/api";

export const usuarioService = {
  list: () => apiRequest<Usuario[]>("/usuarios"),
  getById: (id: number) => apiRequest<Usuario>(`/usuarios/${id}`),
  create: (payload: Usuario) =>
    apiRequest<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Usuario) =>
    apiRequest<Usuario>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/usuarios/${id}`, {
      method: "DELETE",
    }),
};
