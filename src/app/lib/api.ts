import type { ApiProblem } from "../types/api";

const API_BASE_URL = "http://localhost:8080";

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
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Nao foi possivel conectar ao backend em http://localhost:8080. Verifique se o Spring Boot esta em execucao.",
      0,
      "Backend indisponivel",
    );
  }
}

export { API_BASE_URL };
