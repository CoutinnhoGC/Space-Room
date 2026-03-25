import { del, get, post, put } from "./api";
import type { Instituicao } from "../types/api";

export const instituicaoService = {
  list: () => get<Instituicao[]>("/instituicoes"),
  getById: (id: number) => get<Instituicao>(`/instituicoes/${id}`),
  create: (payload: Instituicao) => post<Instituicao>("/instituicoes", payload),
  update: (id: number, payload: Instituicao) => put<Instituicao>(`/instituicoes/${id}`, payload),
  remove: (id: number) => del<void>(`/instituicoes/${id}`),
};
