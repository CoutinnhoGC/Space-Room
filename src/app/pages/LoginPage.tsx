import { Eye, EyeOff, Lock, Mail, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { setAuthenticatedSession } from "../lib/session";
import { isValidEmail } from "../lib/validators";
import { authService } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !senha.trim()) {
      toast.error("Informe e-mail e senha.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      const session = await authService.login({ email: email.trim(), senha });
      setAuthenticatedSession(session);
      toast.success("Login realizado com sucesso.");
      navigate("/", { replace: true });
    } catch (error) {
      setSenha("");
      toast.error(error instanceof Error ? error.message : "Não foi possível realizar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg"><MapPin className="h-8 w-8 text-white" /></div>
          <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent">SpaceRoom</h1>
          <p className="text-gray-600">Acesse sua conta para entrar no ambiente interno.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Acessar sistema</h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">E-mail <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" maxLength={120} className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input type={showPassword ? "text" : "password"} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" maxLength={120} className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600" title={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:opacity-70">{loading ? "Entrando..." : "Entrar"}</button>
          </form>

          <div className="mt-6 text-center"><Link to="/esqueci-senha" className="font-medium text-blue-600 hover:text-blue-700">Esqueci minha senha</Link></div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">SpaceRoom V2.1</div>
      </div>
    </div>
  );
}
