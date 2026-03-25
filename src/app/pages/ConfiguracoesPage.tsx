import { FormEvent, useEffect, useState } from "react";
import { User, Building2, Bell, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, setCurrentUser } from "../lib/session";
import { cargoService } from "../services/cargoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Cargo, Instituicao, Usuario } from "../types/api";

export function ConfiguracoesPage() {
  const sessionUser = getCurrentUser();
  const [user, setUser] = useState<Usuario | null>(sessionUser);
  const [institution, setInstitution] = useState<Instituicao | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: sessionUser?.nome ?? "", email: sessionUser?.email ?? "", idCargo: String(sessionUser?.idCargo ?? "") });
  const [institutionForm, setInstitutionForm] = useState({ nomeFantasia: "", endereco: "", cidade: "", estado: "" });

  useEffect(() => {
    const load = async () => {
      if (!sessionUser?.idUsuario) {
        return;
      }

      try {
        const [usuarioData, cargosData] = await Promise.all([
          usuarioService.getById(Number(sessionUser.idUsuario)),
          cargoService.list(),
        ]);
        setUser(usuarioData);
        setCargos(cargosData);
        setProfileForm({ nome: usuarioData.nome, email: usuarioData.email, idCargo: String(usuarioData.idCargo) });

        if (usuarioData.idInstituicao) {
          const instituicaoData = await instituicaoService.getById(usuarioData.idInstituicao);
          setInstitution(instituicaoData);
          setInstitutionForm({
            nomeFantasia: instituicaoData.nomeFantasia,
            endereco: instituicaoData.endereco ?? "",
            cidade: instituicaoData.cidade ?? "",
            estado: instituicaoData.estado ?? "",
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar as configuracoes.");
      }
    };

    load();
  }, [sessionUser?.idUsuario]);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.idUsuario) {
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await usuarioService.update(user.idUsuario, {
        ...user,
        nome: profileForm.nome,
        email: profileForm.email,
        idCargo: Number(profileForm.idCargo),
      });
      setUser(updated);
      setCurrentUser(updated);
      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInstitutionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.idInstituicao) {
      toast.error("Nenhuma instituicao vinculada ao usuario atual.");
      return;
    }

    try {
      setSavingInstitution(true);
      const updated = await instituicaoService.update(institution.idInstituicao, {
        ...institution,
        nomeFantasia: institutionForm.nomeFantasia,
        endereco: institutionForm.endereco,
        cidade: institutionForm.cidade,
        estado: institutionForm.estado,
      });
      setInstitution(updated);
      toast.success("Instituicao atualizada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a instituicao.");
    } finally {
      setSavingInstitution(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie suas preferencias e dados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <nav className="space-y-1">
              {[{ icon: User, label: "Perfil" }, { icon: Building2, label: "Instituicao" }, { icon: Bell, label: "Notificacoes" }, { icon: Shield, label: "Seguranca" }].map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informacoes do Perfil</h2>
            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input type="text" value={profileForm.nome} onChange={(event) => setProfileForm((current) => ({ ...current, nome: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <select value={profileForm.idCargo} onChange={(event) => setProfileForm((current) => ({ ...current, idCargo: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {cargos.map((cargo) => <option key={cargo.idCargo} value={cargo.idCargo}>{cargo.nome}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={savingProfile} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                  <Save className="w-4 h-4" />{savingProfile ? "Salvando..." : "Salvar Alteracoes"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informacoes da Instituicao</h2>
            <form className="space-y-5" onSubmit={handleInstitutionSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Instituicao</label>
                <input type="text" value={institutionForm.nomeFantasia} onChange={(event) => setInstitutionForm((current) => ({ ...current, nomeFantasia: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereco</label>
                <input type="text" value={institutionForm.endereco} onChange={(event) => setInstitutionForm((current) => ({ ...current, endereco: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input type="text" value={institutionForm.cidade} onChange={(event) => setInstitutionForm((current) => ({ ...current, cidade: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input type="text" value={institutionForm.estado} onChange={(event) => setInstitutionForm((current) => ({ ...current, estado: event.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={savingInstitution} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                  <Save className="w-4 h-4" />{savingInstitution ? "Salvando..." : "Salvar Alteracoes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
