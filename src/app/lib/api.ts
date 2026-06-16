import { clearCurrentSession, getAccessToken } from "./session";
import type { ApiProblem } from "../types/api";

const rawBaseUrl = import.meta.env.VITE_API_URL;

function normalizeBaseUrl(url?: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

export const BASE_URL = normalizeBaseUrl(rawBaseUrl);
export const API_BASE_URL = BASE_URL;
const API_DEBUG = import.meta.env.VITE_API_DEBUG === "true";

export class ApiError extends Error {
  status: number;
  title?: string;

  constructor(message: string, status = 500, title?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
  }
}

function buildUrl(path: string) {
  if (!BASE_URL) {
    throw new ApiError(
      "A variavel VITE_API_URL nao foi configurada. Defina a URL da API nas variaveis do frontend.",
      500,
      "Configuracao da API ausente",
    );
  }

  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json") || contentType.includes("application/problem+json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const problem = typeof payload === "object" ? (payload as ApiProblem) : undefined;
    throw new ApiError(
      problem?.detail || (typeof payload === "string" && payload) || "Falha na comunicacao com a API.",
      response.status,
      problem?.title,
    );
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(init?.headers);
  const accessToken = getAccessToken();

  if (!headers.has("Content-Type") && init?.body !== undefined) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (API_DEBUG) {
    console.debug(`[api] ${init?.method ?? "GET"} ${url}`);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      clearCurrentSession();
    }

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      if (API_DEBUG) {
        console.error(`[api] ${init?.method ?? "GET"} ${url} failed`, error);
      }
      throw error;
    }

    const connectionError = new ApiError(
      `Nao foi possivel conectar a API em ${BASE_URL}. Verifique se VITE_API_URL esta apontando para o servico correto.`,
      0,
      "API indisponivel",
    );

    if (API_DEBUG) {
      console.error(`[api] ${init?.method ?? "GET"} ${url} failed`, error);
    }

    throw connectionError;
  }
}
