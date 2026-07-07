import { apiRequest, cachedApiRequest, invalidateApiCache } from "../lib/api";
import { CACHE_TTL } from "./cacheConfig";
import type { Instituicao, InstituicaoResumo } from "../types/api";

export const instituicaoService = {
  list: () => cachedApiRequest<Instituicao[]>("/instituicoes", CACHE_TTL.instituicoes),
  summary: () => cachedApiRequest<InstituicaoResumo[]>("/instituicoes/resumo", CACHE_TTL.instituicoes),
  getById: (id: number) => cachedApiRequest<Instituicao>(`/instituicoes/${id}`, CACHE_TTL.instituicoes),
  create: (payload: Instituicao) =>
    apiRequest<Instituicao>("/instituicoes", {
      method: "POST",
      body: JSON.stringify(payload),
    }).finally(() => invalidateApiCache("/instituicoes")),
  update: (id: number, payload: Instituicao) =>
    apiRequest<Instituicao>(`/instituicoes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).finally(() => invalidateApiCache("/instituicoes")),
  remove: (id: number) =>
    apiRequest<void>(`/instituicoes/${id}`, {
      method: "DELETE",
    }).finally(() => invalidateApiCache("/instituicoes")),
};
