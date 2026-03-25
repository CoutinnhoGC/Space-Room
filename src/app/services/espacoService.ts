import { del, get, post, put } from "./api";
import type { Espaco } from "../types/api";

export const espacoService = {
  list: () => get<Espaco[]>("/espacos"),
  getById: (id: number) => get<Espaco>(`/espacos/${id}`),
  create: (payload: Espaco) => post<Espaco>("/espacos", payload),
  update: (id: number, payload: Espaco) => put<Espaco>(`/espacos/${id}`, payload),
  remove: (id: number) => del<void>(`/espacos/${id}`),
};
