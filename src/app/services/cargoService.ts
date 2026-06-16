import { cachedApiRequest } from "../lib/api";
import { CACHE_TTL } from "./cacheConfig";
import type { Cargo } from "../types/api";

export const cargoService = {
  list: () => cachedApiRequest<Cargo[]>("/cargos", CACHE_TTL.cargos),
  getById: (id: number) => cachedApiRequest<Cargo>(`/cargos/${id}`, CACHE_TTL.cargos),
};
