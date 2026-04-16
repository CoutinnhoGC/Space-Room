import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Mail, Lock, User, Building2, Shield } from "lucide-react";
import { toast } from "sonner";
import { inferDefaultReservationPermission } from "../lib/permissions";
import { setCurrentUser } from "../lib/session";
import { isValidEmail } from "../lib/validators";
import { cargoService } from "../services/cargoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Cargo, Instituicao } from "../types/api";

export function CadastroPage() {
  const navigate = useNavigate();
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    idInstituicao: "",
    idCargo: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [instituicoesData, cargosData] = await Promise.all([
          instituicaoService.list(),
          cargoService.list(),
        ]);
        setInstituicoes(instituicoesData);
        setCargos(cargosData);
        setForm((current) => ({
          ...current,
          idInstituicao: current.idInstituicao || String(instituicoesData[0]?.idInstituicao ?? ""),
          idCargo: current.idCargo || String(cargosData[0]?.idCargo ?? ""),
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar os dados de apoio.");
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, []);

  const canRegister = useMemo(() => instituicoes.length > 0 && cargos.length > 0, [instituicoes, cargos]);
  const reservaPadrao = useMemo(
    () => inferDefaultReservationPermission(Number(form.idCargo), Number(form.idInstituicao), cargos, instituicoes),
    [form.idCargo, form.idInstituicao, cargos, instituicoes],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim() || !form.confirmarSenha.trim()) {
      toast.error("Preencha todos os campos obrigatorios.");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Informe um e-mail valido.");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas nao coincidem.");
      return;
    }

    if (!canRegister) {
      toast.error("Cadastre cargos e instituicoes no backend antes de criar usuarios.");
      return;
    }

    try {
      setSaving(true);
      const novoUsuario = await usuarioService.create({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senhaHash: form.senha,
        idInstituicao: Number(form.idInstituicao),
        idCargo: Number(form.idCargo),
        ativo: true,
        primeiroAcesso: false,
        podeReservar: reservaPadrao,
      });

      setCurrentUser(novoUsuario);
      toast.success("Conta criada com sucesso.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a conta.");
    } finally {
      setSaving(false);
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
          <p className="text-gray-600">Crie sua conta e comece a gerenciar espacos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Criar Conta</h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                  placeholder="Seu nome completo"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instituicao</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <select
                    value={form.idInstituicao}
                    onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value }))}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingData || !canRegister}
                  >
                    {instituicoes.map((instituicao) => (
                      <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>
                        {instituicao.nomeFantasia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Shield className="w-5 h-5 text-gray-400" />
                  </div>
                  <select
                    value={form.idCargo}
                    onChange={(event) => setForm((current) => ({ ...current, idCargo: event.target.value }))}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingData || !canRegister}
                  >
                    {cargos.map((cargo) => (
                      <option key={cargo.idCargo} value={cargo.idCargo}>
                        {cargo.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
              Perfil inicial de reserva: {reservaPadrao ? "este cargo pode reservar por padrao" : "este cargo comeca apenas com consulta"}.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                  placeholder="Digite sua senha"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(event) => setForm((current) => ({ ...current, confirmarSenha: event.target.value }))}
                  placeholder="Repita sua senha"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {!canRegister && !loadingData && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                O cadastro depende de ao menos uma instituicao e um cargo existentes no backend.
              </div>
            )}

            <button
              type="submit"
              disabled={saving || loadingData || !canRegister}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {saving ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Ja tem uma conta? </span>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Faca login
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">Space 1 V2</div>
      </div>
    </div>
  );
}
