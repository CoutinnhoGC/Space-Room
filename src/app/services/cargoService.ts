import { apiRequest } from "../lib/api";
import type { Cargo } from "../types/api";

export const cargoService = {
  list: () => apiRequest<Cargo[]>("/cargos"),
  getById: (id: number) => apiRequest<Cargo>(`/cargos/${id}`),
};
