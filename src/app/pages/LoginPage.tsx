import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { setCurrentUser } from "../lib/session";
import { isValidEmail } from "../lib/validators";
import { usuarioService } from "../services/usuarioService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(null);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      toast.error("Informe e-mail e senha.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail valido.");
      return;
    }

    try {
      setLoading(true);
      const usuarios = await usuarioService.list();
      const usuario = usuarios.find((item) => item.email.toLowerCase() === email.toLowerCase());

      if (!usuario) {
        toast.error("Usuario nao encontrado.");
        return;
      }

      if (usuario.ativo === false) {
        toast.error("Este usuario esta inativo.");
        return;
      }

      if (usuario.senhaHash && usuario.senhaHash !== senha) {
        toast.error("Senha incorreta.");
        return;
      }

      const atualizado = await usuarioService.update(Number(usuario.idUsuario), {
        ...usuario,
        ultimoLoginEm: new Date().toISOString(),
        primeiroAcesso: false,
      });

      setCurrentUser(atualizado);
      toast.success("Login realizado com sucesso.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel realizar login.");
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
          <p className="text-gray-600">Sistema de Gerenciamento de Espacos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Acessar Sistema</h2>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
              Como o backend nao possui autenticacao dedicada, este login valida o usuario pelo e-mail e usa a senha cadastrada no proprio campo `senhaHash`.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Nao tem uma conta? </span>
            <Link to="/cadastro" className="text-blue-600 hover:text-blue-700 font-medium">
              Cadastre-se
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">SpaceRoom v1.0</div>
      </div>
    </div>
  );
}
