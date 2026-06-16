import { apiRequest } from "../lib/api";
import type { AuthSession, PasswordRecoveryResponse, Usuario } from "../types/api";

interface LoginPayload {
  email: string;
  senha: string;
}

interface ForgotPasswordPayload {
  email: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest<Usuario>("/auth/me"),
  logout: () =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiRequest<PasswordRecoveryResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
