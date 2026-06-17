import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Mail, Plus, Save, Search, Shield, Trash2, UserCheck, UserRound, X, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DetailPanel } from "../components/DetailPanel";
import { getInitials } from "../lib/formatters";
import { canChooseInstitution, canManageUsers, filterByInstitution, getAssignableRoles, inferDefaultReservationPermission, isPlatformAdmin, isPlatformAdminRole } from "../lib/permissions";
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
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState(emptyForm);

  const visibleInstitutions = useMemo(
    () => filterByInstitution(instituicoes, currentUser, (item) => item.idInstituicao),
    [instituicoes, currentUser],
  );

  const visibleUsers = useMemo(
    () => filterByInstitution(usuarios, currentUser, (item) => item.idInstituicao).filter((user) => isPlatformAdmin(currentUser) || user.adminPlataforma !== true),
    [usuarios, currentUser],
  );

  const selectedInstitution = useMemo(
    () => instituicoes.find((item) => item.idInstituicao === Number(form.idInstituicao)) ?? visibleInstitutions[0] ?? null,
    [form.idInstituicao, instituicoes, visibleInstitutions],
  );

  const assignableRoles = useMemo(
    () => getAssignableRoles(cargos, selectedInstitution, currentUser),
    [cargos, selectedInstitution, currentUser],
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
      const defaultInstitution = instituicoesData.find((item) => item.idInstituicao === Number(institutionId)) ?? instituicoesData[0] ?? null;
      const cargoId = getAssignableRoles(cargosData, defaultInstitution, currentUser)[0]?.idCargo ?? "";
      setForm((current) => ({
        ...current,
        idCargo: current.idCargo || String(cargoId),
        idInstituicao: current.idInstituicao || String(institutionId),
        podeReservar: current.idUsuario
          ? current.podeReservar
          : inferDefaultReservationPermission(Number(current.idCargo || cargoId), Number(current.idInstituicao || institutionId), cargosData, instituicoesData),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar usuários.");
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

  const selectedUserRelations = useMemo(() => {
    if (!selectedUser) {
      return { cargo: null, instituicao: null };
    }

    return {
      cargo: cargos.find((item) => item.idCargo === selectedUser.idCargo) ?? null,
      instituicao: instituicoes.find((item) => item.idInstituicao === selectedUser.idInstituicao) ?? null,
    };
  }, [selectedUser, cargos, instituicoes]);

  const resetForm = () => {
    const defaultInstitution = currentUser?.idInstituicao ?? visibleInstitutions[0]?.idInstituicao ?? "";
    const defaultCargo = getAssignableRoles(cargos, visibleInstitutions.find((item) => item.idInstituicao === Number(defaultInstitution)), currentUser)[0]?.idCargo ?? "";
    setForm({
      ...emptyForm,
      idCargo: String(defaultCargo),
      idInstituicao: String(defaultInstitution),
      ativo: true,
      podeReservar: inferDefaultReservationPermission(Number(defaultCargo), Number(defaultInstitution), cargos, instituicoes),
    });
    setShowForm(false);
  };

  const handleEdit = (usuario: Usuario) => {
    const cargo = cargos.find((item) => item.idCargo === usuario.idCargo);
    if (!isPlatformAdmin(currentUser) && (usuario.adminPlataforma === true || isPlatformAdminRole(cargo))) {
      toast.error("Somente administradores da plataforma podem alterar administradores da plataforma.");
      return;
    }

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
    if (!idUsuario || !window.confirm("Deseja confirmar a exclusão deste usuário?")) {
      return;
    }

    const usuario = usuarios.find((item) => item.idUsuario === idUsuario);
    const cargo = cargos.find((item) => item.idCargo === usuario?.idCargo);
    if (!isPlatformAdmin(currentUser) && (usuario?.adminPlataforma === true || isPlatformAdminRole(cargo))) {
      toast.error("Somente administradores da plataforma podem remover administradores da plataforma.");
      return;
    }

    try {
      await usuarioService.remove(idUsuario);
      toast.success("Usuário removido com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o usuário.");
    }
  };

  const openNewUserForm = () => {
    const defaultInstitution = currentUser?.idInstituicao ?? visibleInstitutions[0]?.idInstituicao ?? "";
    const defaultCargo = getAssignableRoles(cargos, visibleInstitutions.find((item) => item.idInstituicao === Number(defaultInstitution)), currentUser)[0]?.idCargo ?? "";
    setSelectedUser(null);
    setShowForm(true);
    setForm({
      ...emptyForm,
      idCargo: String(defaultCargo),
      idInstituicao: String(defaultInstitution),
      ativo: true,
      podeReservar: inferDefaultReservationPermission(Number(defaultCargo), Number(defaultInstitution), cargos, instituicoes),
    });
  };

  const handleInstitutionOrRoleChange = (changes: Partial<typeof form>) => {
    setForm((current) => {
      const next = { ...current, ...changes };
      if (!current.idUsuario) {
        next.podeReservar = inferDefaultReservationPermission(Number(next.idCargo), Number(next.idInstituicao), cargos, instituicoes);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    const instituicaoError = validatePositiveId(Number(form.idInstituicao), "Instituição");
    const cargoError = validatePositiveId(Number(form.idCargo), "Cargo");
    if (instituicaoError || cargoError) {
      toast.error(instituicaoError || cargoError || "IDs inválidos.");
      return;
    }

    if (!canManageUsers(currentUser)) {
      toast.error("Seu perfil nao possui permissao para gerenciar usuarios.");
      return;
    }

    const cargoSelecionado = cargos.find((item) => item.idCargo === Number(form.idCargo));
    if (!isPlatformAdmin(currentUser) && isPlatformAdminRole(cargoSelecionado)) {
      toast.error("Somente administradores da plataforma podem criar ou editar administradores da plataforma.");
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
        ativo: form.idUsuario ? form.ativo : true,
        primeiroAcesso: false,
        podeReservar: form.podeReservar,
      };

      if (form.idUsuario) {
        await usuarioService.update(Number(form.idUsuario), { ...payload, idUsuario: Number(form.idUsuario) });
        toast.success("Usuário atualizado com sucesso.");
      } else {
        await usuarioService.create(payload);
        toast.success("Usuário criado com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  const platformAdmin = isPlatformAdmin(currentUser);
  const userCanManageUsers = canManageUsers(currentUser);
  const showInstitutionSelector = canChooseInstitution(currentUser, visibleInstitutions.length);

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Usuários</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gerencie os usuários da sua instituição e escolha quem pode reservar.</p>
          </div>
          <button onClick={openNewUserForm} disabled={!userCanManageUsers} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-60">
            <Plus className="h-4 w-4" />
            Novo usuário
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{form.idUsuario ? "Editar usuário" : "Novo usuário"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">No cadastro, o usuário já entra ativo por padrão. O status só aparece em edição.</p>
            </div>
            <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900" type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome completo" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <input value={form.senhaHash} onChange={(event) => setForm((current) => ({ ...current, senhaHash: event.target.value }))} placeholder={form.idUsuario ? "Nova senha (opcional)" : "Senha inicial"} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            <select value={form.idCargo} onChange={(event) => handleInstitutionOrRoleChange({ idCargo: event.target.value })} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {assignableRoles.map((cargo) => <option key={cargo.idCargo} value={cargo.idCargo}>{cargo.nome}</option>)}
            </select>
            {showInstitutionSelector ? <select value={form.idInstituicao} onChange={(event) => handleInstitutionOrRoleChange({ idInstituicao: event.target.value })} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" disabled={!platformAdmin}>
              {visibleInstitutions.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}
            </select> : <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{visibleInstitutions[0]?.nomeFantasia ?? "Instituição atual"}</div>}
            {form.idUsuario && (
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
                Usuário ativo
              </label>
            )}
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <input type="checkbox" checked={form.podeReservar} onChange={(event) => setForm((current) => ({ ...current, podeReservar: event.target.checked }))} />
              Pode reservar espaços
            </label>
            <div className="text-xs text-gray-500 md:col-span-2 dark:text-slate-400">
              Os cargos listados respeitam o tipo da instituição e ocultam cargos de sistema da plataforma para usuários institucionais.
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving || !userCanManageUsers} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white disabled:opacity-70">
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuários..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">E-mail</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">Função</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">Reserva</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-600 dark:text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {!loading && filteredUsers.map((user) => {
              const cargo = cargos.find((item) => item.idCargo === user.idCargo);
              const protectedPlatformAdmin = user.adminPlataforma === true || isPlatformAdminRole(cargo);
              const canModifyRow = platformAdmin || !protectedPlatformAdmin;
              return (
                <tr key={user.idUsuario} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-medium text-white">{getInitials(user.nome)}</div>
                      <button type="button" onClick={() => setSelectedUser(user)} className="text-left text-sm font-medium text-gray-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-300">{user.nome}</button>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><Mail className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />{user.email}</div></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><Shield className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />{cargo?.nome ?? "Sem cargo"}</div></td>
                  <td className="px-6 py-4"><span className={`rounded-md px-2.5 py-1 text-xs font-medium ${user.podeReservar ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{user.podeReservar ? "Pode reservar" : "Somente consulta"}</span></td>
                  <td className="px-6 py-4"><span className={`rounded-md px-2.5 py-1 text-xs font-medium ${user.ativo === false ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300" : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"}`}>{user.ativo === false ? "Inativo" : "Ativo"}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedUser(user)} className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800" title="Visualizar usuário" type="button"><Eye className="h-4 w-4" /></button>
                      {canModifyRow && <button onClick={() => handleEdit(user)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40" title="Editar usuário" type="button"><Edit2 className="h-4 w-4" /></button>}
                      {canModifyRow && <button onClick={() => handleDelete(user.idUsuario)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40" title="Excluir usuário" type="button"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-6 text-sm text-gray-500 dark:text-slate-400">Carregando usuários...</div>}
        {!loading && filteredUsers.length === 0 && <div className="p-6 text-sm text-gray-500 dark:text-slate-400">Nenhum usuário encontrado.</div>}
      </div>

      {selectedUser && (
        <DetailPanel title={selectedUser.nome} subtitle="Visualização do usuário em modo de leitura." onClose={() => setSelectedUser(null)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><Mail className="h-4 w-4 text-blue-600 dark:text-blue-300" />E-mail</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUser.email}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><Shield className="h-4 w-4 text-blue-600 dark:text-blue-300" />Função</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUserRelations.cargo?.nome ?? "Não informada"}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">Instituição</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUserRelations.instituicao?.nomeFantasia ?? "Não informada"}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">Permissão de reserva</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUser.podeReservar ? "Pode reservar espaços" : "Somente consulta"}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />Status</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUser.ativo === false ? "Usuário inativo" : "Usuário ativo"}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><UserRound className="h-4 w-4 text-blue-600 dark:text-blue-300" />Primeiro acesso</div>
              <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedUser.primeiroAcesso ? "Pendente" : "Concluído"}</div>
            </div>
          </div>
        </DetailPanel>
      )}
    </>
  );
}

