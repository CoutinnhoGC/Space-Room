import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Mail, Shield, Edit2, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "../lib/formatters";
import { filterByInstitution, inferDefaultReservationPermission, isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { isValidEmail, validatePositiveId } from "../lib/validators";
import { cargoService } from "../services/cargoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Cargo, Instituicao, Usuario } from "../types/api";

const emptyForm = {
  idUsuario: "",
  nome: "",
  email: "",
  senhaHash: "",
  idInstituicao: "",
  idCargo: "",
  ativo: true,
  podeReservar: false,
};

export function UsuariosPage() {
  const currentUser = getCurrentUser();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const visibleInstitutions = useMemo(
    () => filterByInstitution(instituicoes, currentUser, (item) => item.idInstituicao),
    [instituicoes, currentUser],
  );

  const visibleUsers = useMemo(
    () => filterByInstitution(usuarios, currentUser, (item) => item.idInstituicao),
    [usuarios, currentUser],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, cargosData, instituicoesData] = await Promise.all([
        usuarioService.list(),
        cargoService.list(),
        instituicaoService.list(),
      ]);
      setUsuarios(usuariosData);
      setCargos(cargosData);
      setInstituicoes(instituicoesData);

      const institutionId = currentUser?.idInstituicao ?? instituicoesData[0]?.idInstituicao ?? "";
      const cargoId = cargosData[0]?.idCargo ?? "";
      setForm((current) => ({
        ...current,
        idCargo: current.idCargo || String(cargoId),
        idInstituicao: current.idInstituicao || String(institutionId),
        podeReservar: current.idUsuario
          ? current.podeReservar
          : inferDefaultReservationPermission(Number(current.idCargo || cargoId), Number(current.idInstituicao || institutionId), cargosData, instituicoesData),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((user) => {
      const cargo = cargos.find((item) => item.idCargo === user.idCargo);
      const text = `${user.nome} ${user.email} ${cargo?.nome ?? ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [visibleUsers, cargos, search]);

  const resetForm = () => {
    const defaultInstitution = currentUser?.idInstituicao ?? visibleInstitutions[0]?.idInstituicao ?? "";
    const defaultCargo = cargos[0]?.idCargo ?? "";
    setForm({
      ...emptyForm,
      idCargo: String(defaultCargo),
      idInstituicao: String(defaultInstitution),
      podeReservar: inferDefaultReservationPermission(Number(defaultCargo), Number(defaultInstitution), cargos, instituicoes),
    });
    setShowForm(false);
  };

  const handleEdit = (usuario: Usuario) => {
    setForm({
      idUsuario: String(usuario.idUsuario ?? ""),
      nome: usuario.nome,
      email: usuario.email,
      senhaHash: usuario.senhaHash ?? "",
      idInstituicao: String(usuario.idInstituicao),
      idCargo: String(usuario.idCargo),
      ativo: usuario.ativo !== false,
      podeReservar: usuario.podeReservar === true,
    });
    setShowForm(true);
  };

  const handleDelete = async (idUsuario?: number) => {
    if (!idUsuario) {
      return;
    }

    try {
      await usuarioService.remove(idUsuario);
      toast.success("Usuario removido com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o usuario.");
    }
  };

  const openNewUserForm = () => {
    const defaultInstitution = currentUser?.idInstituicao ?? visibleInstitutions[0]?.idInstituicao ?? "";
    const defaultCargo = cargos[0]?.idCargo ?? "";
    setShowForm(true);
    setForm({
      ...emptyForm,
      idCargo: String(defaultCargo),
      idInstituicao: String(defaultInstitution),
      podeReservar: inferDefaultReservationPermission(Number(defaultCargo), Number(defaultInstitution), cargos, instituicoes),
    });
  };

  const handleInstitutionOrRoleChange = (changes: Partial<typeof form>) => {
    setForm((current) => {
      const next = { ...current, ...changes };
      if (!current.idUsuario) {
        next.podeReservar = inferDefaultReservationPermission(
          Number(next.idCargo),
          Number(next.idInstituicao),
          cargos,
          instituicoes,
        );
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail sao obrigatorios.");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Informe um e-mail valido.");
      return;
    }

    const instituicaoError = validatePositiveId(Number(form.idInstituicao), "Instituicao");
    const cargoError = validatePositiveId(Number(form.idCargo), "Cargo");
    if (instituicaoError || cargoError) {
      toast.error(instituicaoError || cargoError || "IDs invalidos.");
      return;
    }

    try {
      setSaving(true);
      const payload: Usuario = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senhaHash: form.senhaHash || undefined,
        idInstituicao: Number(form.idInstituicao),
        idCargo: Number(form.idCargo),
        ativo: form.ativo,
        primeiroAcesso: false,
        podeReservar: form.podeReservar,
      };

      if (form.idUsuario) {
        await usuarioService.update(Number(form.idUsuario), { ...payload, idUsuario: Number(form.idUsuario) });
        toast.success("Usuario atualizado com sucesso.");
      } else {
        await usuarioService.create(payload);
        toast.success("Usuario criado com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o usuario.");
    } finally {
      setSaving(false);
    }
  };

  const platformAdmin = isPlatformAdmin(currentUser);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os usuarios da sua instituicao e escolha quem pode reservar.</p>
          </div>
          <button
            onClick={openNewUserForm}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Usuario
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{form.idUsuario ? "Editar usuario" : "Novo usuario"}</h2>
            <button onClick={resetForm} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.senhaHash} onChange={(event) => setForm((current) => ({ ...current, senhaHash: event.target.value }))} placeholder="Senha" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <select value={form.idCargo} onChange={(event) => handleInstitutionOrRoleChange({ idCargo: event.target.value })} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {cargos.map((cargo) => (
                <option key={cargo.idCargo} value={cargo.idCargo}>{cargo.nome}</option>
              ))}
            </select>
            <select value={form.idInstituicao} onChange={(event) => handleInstitutionOrRoleChange({ idInstituicao: event.target.value })} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" disabled={!platformAdmin}>
              {visibleInstitutions.map((instituicao) => (
                <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
              Usuario ativo
            </label>
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <input type="checkbox" checked={form.podeReservar} onChange={(event) => setForm((current) => ({ ...current, podeReservar: event.target.checked }))} />
              Pode reservar espacos
            </label>
            <div className="md:col-span-2 text-xs text-gray-500">
              Cargos como diretor, vice, docente, dono e gerente recebem permissao de reserva por padrao. Aqui voce pode liberar ou bloquear individualmente.
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-70">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-3 border border-gray-200 rounded-lg text-gray-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuarios..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Nome</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">E-mail</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Funcao</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Reserva</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && filteredUsers.map((user) => {
              const cargo = cargos.find((item) => item.idCargo === user.idCargo);
              return (
                <tr key={user.idUsuario} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(user.nome)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-3.5 h-3.5 text-gray-400" />{user.email}</div></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700"><Shield className="w-3.5 h-3.5 text-gray-400" />{cargo?.nome ?? "Sem cargo"}</div></td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-medium ${user.podeReservar ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{user.podeReservar ? "Pode reservar" : "Somente consulta"}</span></td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-medium ${user.ativo === false ? "bg-gray-50 text-gray-700" : "bg-green-50 text-green-700"}`}>{user.ativo === false ? "Inativo" : "Ativo"}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user.idUsuario)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-6 text-sm text-gray-500">Carregando usuarios...</div>}
        {!loading && filteredUsers.length === 0 && <div className="p-6 text-sm text-gray-500">Nenhum usuario encontrado.</div>}
      </div>
    </>
  );
}
