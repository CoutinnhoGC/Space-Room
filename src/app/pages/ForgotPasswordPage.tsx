import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "../lib/formatters";
import { isValidEmail } from "../lib/validators";
import { authService } from "../services/authService";
import type { PasswordRecoveryResponse } from "../types/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasswordRecoveryResponse | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Informe seu e-mail.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail valido.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword({ email: email.trim() });
      setResult(response);
      toast.success("Solicitacao de recuperacao enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar solicitacao.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            SpaceRoom
          </h1>
          <p className="text-gray-600">Recuperacao de senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Esqueceu sua senha?</h2>
          <p className="text-gray-600 mb-6">
            Informe seu e-mail para gerar um link de recuperacao.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>

          {result && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
              <p className="font-medium">Entrega configurada em modo mock funcional.</p>
              <p>Destino: {result.email}</p>
              <p>Token: <span className="font-mono break-all">{result.recoveryToken}</span></p>
              <p>Expira em: {formatDateTime(result.expiresAt)}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">SpaceRoom v1.0</div>
      </div>
    </div>
  );
}
