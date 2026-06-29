import type { ApiProblem } from "../types/api";

const rawBaseUrl = import.meta.env.VITE_API_URL;

function normalizeBaseUrl(url?: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

export const BASE_URL = normalizeBaseUrl(rawBaseUrl);
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
      "A variavel VITE_API_URL nao foi configurada. Defina a URL do backend no arquivo .env ou nas variaveis da Vercel.",
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

async function request<T>(method: string, path: string, data?: BodyInit | Record<string, unknown> | unknown, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(init?.headers);
  const isBodyInit =
    typeof data === "string" ||
    data instanceof Blob ||
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data);

  if (data !== undefined && !isBodyInit && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (API_DEBUG) {
    console.debug("[api] request", {
      method,
      url,
      data,
    });
  }

  try {
    const response = await fetch(url, {
      ...init,
      method,
      headers,
      body: data === undefined ? init?.body : isBodyInit ? (data as BodyInit) : JSON.stringify(data),
    });

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      if (API_DEBUG) {
        console.error("[api] request failed", {
          method,
          url,
          error,
        });
      }
      throw error;
    }

    const connectionError = new ApiError(
      `Nao foi possivel conectar ao backend em ${BASE_URL}. Verifique se a API esta online e se VITE_API_URL esta correta.`,
      0,
      "Backend indisponivel",
    );

    if (API_DEBUG) {
      console.error("[api] request failed", {
        method,
        url,
        error,
      });
    }

    throw connectionError;
  }
}

export function get<T>(path: string, init?: RequestInit) {
  return request<T>("GET", path, undefined, init);
}

export function post<T>(path: string, data?: unknown, init?: RequestInit) {
  return request<T>("POST", path, data, init);
}

export function put<T>(path: string, data?: unknown, init?: RequestInit) {
  return request<T>("PUT", path, data, init);
}

export function del<T>(path: string, init?: RequestInit) {
  return request<T>("DELETE", path, undefined, init);
}

export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(init?.method ?? "GET", path, init?.body, init);
}
