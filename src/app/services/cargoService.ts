import { get } from "./api";
import type { Cargo } from "../types/api";

export const cargoService = {
  list: () => get<Cargo[]>("/cargos"),
  getById: (id: number) => get<Cargo>(`/cargos/${id}`),
};
