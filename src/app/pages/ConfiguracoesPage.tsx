import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, Building2, CheckCheck, Lock, Mail, Save, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, getInitials } from "../lib/formatters";
import { getDefaultNotificationPreferences, getNotificationPreferences, getNotificationsForUser, markAllNotificationsAsRead, markNotificationAsRead, setNotificationPreferences, subscribeToNotificationStore } from "../lib/notifications";
import { canAccessManagementNotifications } from "../lib/permissions";
import { getCurrentUser, setCurrentUser, subscribeToSessionUpdates } from "../lib/session";
import { cargoService } from "../services/cargoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Cargo, Instituicao, NotificationPreferences, Usuario } from "../types/api";

type SettingsSection = "perfil" | "instituicao" | "notificacoes" | "seguranca";

export function ConfiguracoesPage() {
  const [user, setUser] = useState<Usuario | null>(() => getCurrentUser());
  const [institution, setInstitution] = useState<Instituicao | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSection>("perfil");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nome: "",
    email: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [institutionForm, setInstitutionForm] = useState({ nomeFantasia: "", endereco: "", cidade: "", estado: "" });
  const [notificationForm, setNotificationForm] = useState<NotificationPreferences>(getDefaultNotificationPreferences());
  const [notifications, setNotifications] = useState(() => getNotificationsForUser(getCurrentUser()));

  useEffect(() => subscribeToSessionUpdates(() => setUser(getCurrentUser())), []);

  useEffect(() => {
    const load = async () => {
      const sessionUser = getCurrentUser();
      if (!sessionUser?.idUsuario) {
        return;
      }

      try {
        const [usuarioData, cargosData] = await Promise.all([
          usuarioService.getById(Number(sessionUser.idUsuario)),
          cargoService.list(),
        ]);
        setUser(usuarioData);
        setCurrentUser(usuarioData);
        setCargos(cargosData);
        setProfileForm({
          nome: usuarioData.nome,
          email: usuarioData.email,
          novaSenha: "",
          confirmarSenha: "",
        });
        setNotificationForm(getNotificationPreferences(usuarioData.idUsuario));
        setNotifications(getNotificationsForUser(usuarioData));

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
  }, [user?.idUsuario]);

  useEffect(() => {
    if (!user?.idUsuario) {
      return;
    }

    const syncNotifications = () => {
      setNotificationForm(getNotificationPreferences(user.idUsuario));
      setNotifications(getNotificationsForUser(getCurrentUser()));
    };

    syncNotifications();
    return subscribeToNotificationStore(syncNotifications);
  }, [user?.idUsuario]);

  const currentCargo = useMemo(
    () => cargos.find((cargo) => cargo.idCargo === user?.idCargo) ?? null,
    [cargos, user?.idCargo],
  );
  const canManageNotifications = canAccessManagementNotifications(user, cargos);
  const canManageInstitution = canManageNotifications;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.idUsuario) {
      return;
    }

    if (profileForm.novaSenha && profileForm.novaSenha !== profileForm.confirmarSenha) {
      toast.error("A confirmacao da nova senha nao confere.");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await usuarioService.update(user.idUsuario, {
        ...user,
        nome: profileForm.nome.trim(),
        email: profileForm.email.trim(),
        senhaHash: profileForm.novaSenha.trim() || user.senhaHash,
      });
      setUser(updated);
      setCurrentUser(updated);
      setProfileForm((current) => ({ ...current, novaSenha: "", confirmarSenha: "" }));
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

    if (!canManageInstitution) {
      toast.error("Somente cargos de gestao podem alterar os dados institucionais.");
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

  const handleNotificationsSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.idUsuario) {
      return;
    }

    if (!canManageNotifications) {
      toast.error("As notificacoes sao exclusivas para cargos de gestao da instituicao.");
      return;
    }

    try {
      setSavingNotifications(true);
      setNotificationPreferences(user.idUsuario, notificationForm);
      toast.success("Preferencias de notificacao salvas.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const menuItems = [
    { id: "perfil" as const, icon: UserIcon, label: "Perfil" },
    { id: "instituicao" as const, icon: Building2, label: "Instituicao" },
    { id: "notificacoes" as const, icon: Bell, label: "Notificacoes" },
    { id: "seguranca" as const, icon: Shield, label: "Seguranca" },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu perfil, sua instituicao e o fluxo de notificacoes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                {getInitials(user?.nome ?? "Usuario")}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{user?.nome ?? "Usuario"}</div>
                <div className="text-xs text-gray-500 mt-1">{currentCargo?.nome ?? "Cargo nao identificado"}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Instituicao vinculada: <span className="text-gray-700 font-medium">{institution?.nomeFantasia ?? "Nao vinculada"}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === "perfil" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Perfil</h2>
              <p className="text-sm text-gray-500 mb-6">Atualize seus dados de acesso e identifique como voce aparece para a equipe.</p>

              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" value={profileForm.nome} onChange={(event) => setProfileForm((current) => ({ ...current, nome: event.target.value }))} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="password" value={profileForm.novaSenha} onChange={(event) => setProfileForm((current) => ({ ...current, novaSenha: event.target.value }))} placeholder="Preencha apenas se quiser trocar" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="password" value={profileForm.confirmarSenha} onChange={(event) => setProfileForm((current) => ({ ...current, confirmarSenha: event.target.value }))} placeholder="Repita a nova senha" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Cargo atual</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{currentCargo?.nome ?? "Nao identificado"}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Permissao de reserva</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{user?.podeReservar ? "Pode reservar" : "Somente consulta"}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button type="submit" disabled={savingProfile} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                    <Save className="w-4 h-4" />{savingProfile ? "Salvando..." : "Salvar perfil"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "instituicao" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Instituicao</h2>
              <p className="text-sm text-gray-500 mb-6">Mantenha os dados institucionais alinhados com o cadastro oficial.</p>

              {!canManageInstitution && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
                  Somente cargos de gestao podem editar os dados da instituicao. Voce continua com acesso de consulta.
                </div>
              )}

              <form className="space-y-5" onSubmit={handleInstitutionSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da instituicao</label>
                  <input type="text" value={institutionForm.nomeFantasia} onChange={(event) => setInstitutionForm((current) => ({ ...current, nomeFantasia: event.target.value }))} disabled={!canManageInstitution} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereco</label>
                  <input type="text" value={institutionForm.endereco} onChange={(event) => setInstitutionForm((current) => ({ ...current, endereco: event.target.value }))} disabled={!canManageInstitution} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input type="text" value={institutionForm.cidade} onChange={(event) => setInstitutionForm((current) => ({ ...current, cidade: event.target.value }))} disabled={!canManageInstitution} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <input type="text" value={institutionForm.estado} onChange={(event) => setInstitutionForm((current) => ({ ...current, estado: event.target.value }))} disabled={!canManageInstitution} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button type="submit" disabled={savingInstitution || !canManageInstitution} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                    <Save className="w-4 h-4" />{savingInstitution ? "Salvando..." : "Salvar instituicao"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "notificacoes" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notificacoes</h2>
                <p className="text-sm text-gray-500 mb-6">Controle quais alertas da instituicao voce deseja acompanhar.</p>

                {!canManageNotifications ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    As notificacoes de reservas e espacos ficam disponiveis apenas para cargos de gestao da instituicao.
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleNotificationsSubmit}>
                    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-4 hover:border-blue-200 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Novas reservas</div>
                        <div className="text-sm text-gray-500 mt-1">Receba alertas quando uma nova reserva for cadastrada.</div>
                      </div>
                      <input type="checkbox" checked={notificationForm.novasReservas} onChange={(event) => setNotificationForm((current) => ({ ...current, novasReservas: event.target.checked }))} className="mt-1 h-4 w-4" />
                    </label>

                    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-4 hover:border-blue-200 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Alteracoes em reservas</div>
                        <div className="text-sm text-gray-500 mt-1">Inclui edicao, confirmacao e cancelamento de reservas existentes.</div>
                      </div>
                      <input type="checkbox" checked={notificationForm.alteracoesReserva} onChange={(event) => setNotificationForm((current) => ({ ...current, alteracoesReserva: event.target.checked }))} className="mt-1 h-4 w-4" />
                    </label>

                    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-4 hover:border-blue-200 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Novos espacos</div>
                        <div className="text-sm text-gray-500 mt-1">Seja avisado quando um novo espaco for cadastrado para a instituicao.</div>
                      </div>
                      <input type="checkbox" checked={notificationForm.novosEspacos} onChange={(event) => setNotificationForm((current) => ({ ...current, novosEspacos: event.target.checked }))} className="mt-1 h-4 w-4" />
                    </label>

                    <div className="pt-4 border-t border-gray-100">
                      <button type="submit" disabled={savingNotifications} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                        <Save className="w-4 h-4" />{savingNotifications ? "Salvando..." : "Salvar preferencias"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Historico recente</h3>
                    <p className="text-sm text-gray-500 mt-1">Ultimos eventos registrados para sua instituicao</p>
                  </div>
                  {canManageNotifications && user?.idUsuario && (
                    <button type="button" onClick={() => markAllNotificationsAsRead(user.idUsuario)} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                      <CheckCheck className="w-4 h-4" />
                      Marcar tudo como lido
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification) => {
                    const isUnread = user?.idUsuario != null && !notification.readByUserIds?.includes(user.idUsuario);
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => user?.idUsuario && markNotificationAsRead(notification.id, user.idUsuario)}
                        className={`w-full text-left rounded-xl border px-4 py-4 transition-colors ${isUnread ? "border-blue-200 bg-blue-50/60" : "border-gray-100 bg-white hover:bg-gray-50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                            <div className="text-sm text-gray-500 mt-1">{notification.description}</div>
                            <div className="text-xs text-gray-400 mt-2">{formatDateTime(notification.createdAt)}</div>
                          </div>
                          {isUnread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}

                  {notifications.length === 0 && <div className="text-sm text-gray-500">Nenhuma notificacao registrada ainda.</div>}
                </div>
              </div>
            </div>
          )}

          {activeSection === "seguranca" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Seguranca</h2>
              <p className="text-sm text-gray-500 mb-6">Resumo rapido do estado da sua conta no ambiente atual.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Ultimo login</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">{user?.ultimoLoginEm ? formatDateTime(user.ultimoLoginEm) : "Nao registrado"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Status da conta</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">{user?.ativo === false ? "Inativa" : "Ativa"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Primeiro acesso</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">{user?.primeiroAcesso ? "Pendente" : "Concluido"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Sessao local</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">Persistida no navegador atual</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
