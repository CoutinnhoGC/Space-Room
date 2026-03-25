import { apiRequest } from "../lib/api";
import type { Instituicao } from "../types/api";

export const instituicaoService = {
  list: () => apiRequest<Instituicao[]>("/instituicoes"),
  getById: (id: number) => apiRequest<Instituicao>(`/instituicoes/${id}`),
  create: (payload: Instituicao) =>
    apiRequest<Instituicao>("/instituicoes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Instituicao) =>
    apiRequest<Instituicao>(`/instituicoes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    apiRequest<void>(`/instituicoes/${id}`, {
      method: "DELETE",
    }),
};
