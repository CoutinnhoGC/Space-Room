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
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword({ email: email.trim() });
      setResult(response);
      toast.success("Solicitação de recuperação enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg"><MapPin className="h-8 w-8 text-white" /></div>
            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent">SpaceRoom</h1>
            <p className="text-gray-600">Recuperação de senha</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Esqueceu sua senha?</h2>
            <p className="mb-6 text-gray-600">Informe seu e-mail para gerar um link de recuperação.</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">E-mail <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><Mail className="h-5 w-5 text-gray-400" /></div>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" maxLength={120} className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:opacity-70">{loading ? "Enviando..." : "Enviar link"}</button>
            </form>

            {result && <div className="mt-6 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-medium">Entrega configurada em modo mock funcional.</p><p>Destino: {result.email}</p><p>Token: <span className="break-all font-mono">{result.recoveryToken}</span></p><p>Expira em: {formatDateTime(result.expiresAt)}</p></div>}

            <div className="mt-6 text-center"><Link to="/login" className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Voltar ao login</Link></div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">SpaceRoom V2.1</div>
        </div>
      </div>
    </div>
  );
}