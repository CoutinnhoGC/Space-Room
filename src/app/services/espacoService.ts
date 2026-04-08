import { apiRequest } from "../lib/api";
import type { Espaco } from "../types/api";

export const espacoService = {
  list: () => apiRequest<Espaco[]>("/espacos"),
  getById: (id: number) => apiRequest<Espaco>(`/espacos/${id}`),
  create: (payload: Espaco) =>
    apiRequest<Espaco>("/espacos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Espaco) =>
    apiRequest<Espaco>(`/espacos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/espacos/${id}`, {
      method: "DELETE",
    }),
};
