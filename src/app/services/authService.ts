import { apiRequest } from "../lib/api";
import type { PasswordRecoveryResponse, Usuario } from "../types/api";

interface LoginPayload {
  email: string;
  senha: string;
}

interface ForgotPasswordPayload {
  email: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiRequest<Usuario>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiRequest<PasswordRecoveryResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
