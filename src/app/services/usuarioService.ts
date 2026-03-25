import { del, get, post, put } from "./api";
import type { Usuario } from "../types/api";

export const usuarioService = {
  list: () => get<Usuario[]>("/usuarios"),
  getById: (id: number) => get<Usuario>(`/usuarios/${id}`),
  create: (payload: Usuario) => post<Usuario>("/usuarios", payload),
  update: (id: number, payload: Usuario) => put<Usuario>(`/usuarios/${id}`, payload),
  remove: (id: number) => del<void>(`/usuarios/${id}`),
};
