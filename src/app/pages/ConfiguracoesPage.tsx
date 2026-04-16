import { Bell, Building2, CheckCheck, Lock, Mail, Save, Shield, User as UserIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const inputClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900";

export function ConfiguracoesPage() {
  const [user, setUser] = useState<Usuario | null>(() => getCurrentUser());
  const [institution, setInstitution] = useState<Instituicao | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSection>("perfil");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: "", email: "", novaSenha: "", confirmarSenha: "" });
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
        const [usuarioData, cargosData] = await Promise.all([usuarioService.getById(Number(sessionUser.idUsuario)), cargoService.list()]);
        setUser(usuarioData);
        setCurrentUser(usuarioData);
        setCargos(cargosData);
        setProfileForm({ nome: usuarioData.nome, email: usuarioData.email, novaSenha: "", confirmarSenha: "" });
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
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar as configurações.");
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

  const currentCargo = useMemo(() => cargos.find((cargo) => cargo.idCargo === user?.idCargo) ?? null, [cargos, user?.idCargo]);
  const canManageNotifications = canAccessManagementNotifications(user, cargos);
  const canManageInstitution = canManageNotifications;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.idUsuario) {
      return;
    }

    if (profileForm.novaSenha && profileForm.novaSenha !== profileForm.confirmarSenha) {
      toast.error("A confirmação da nova senha não confere.");
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
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInstitutionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.idInstituicao) {
      toast.error("Nenhuma instituição vinculada ao usuário atual.");
      return;
    }

    if (!canManageInstitution) {
      toast.error("Somente cargos de gestão podem alterar os dados institucionais.");
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
      toast.success("Instituição atualizada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a instituição.");
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
      toast.error("As notificações são exclusivas para cargos de gestão da instituição.");
      return;
    }

    try {
      setSavingNotifications(true);
      setNotificationPreferences(user.idUsuario, notificationForm);
      toast.success("Preferências de notificação salvas.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const menuItems = [
    { id: "perfil" as const, icon: UserIcon, label: "Perfil" },
    { id: "instituicao" as const, icon: Building2, label: "Instituição" },
    { id: "notificacoes" as const, icon: Bell, label: "Notificações" },
    { id: "seguranca" as const, icon: Shield, label: "Segurança" },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gerencie seu perfil, sua instituição e o fluxo de notificações.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-semibold text-white">
                {getInitials(user?.nome ?? "Usuário")}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user?.nome ?? "Usuário"}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{currentCargo?.nome ?? "Cargo não identificado"}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-slate-400">
              Instituição vinculada: <span className="font-medium text-gray-700 dark:text-slate-200">{institution?.nomeFantasia ?? "Não vinculada"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${activeSection === item.id ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {activeSection === "perfil" && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Perfil</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">Atualize seus dados de acesso e identifique como você aparece para a equipe.</p>

              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Nome</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <input type="text" value={profileForm.nome} onChange={(event) => setProfileForm((current) => ({ ...current, nome: event.target.value }))} className={`${inputClassName} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className={`${inputClassName} pl-10`} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <input type="password" value={profileForm.novaSenha} onChange={(event) => setProfileForm((current) => ({ ...current, novaSenha: event.target.value }))} placeholder="Preencha apenas se quiser trocar" className={`${inputClassName} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Confirmar nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <input type="password" value={profileForm.confirmarSenha} onChange={(event) => setProfileForm((current) => ({ ...current, confirmarSenha: event.target.value }))} placeholder="Repita a nova senha" className={`${inputClassName} pl-10`} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Cargo atual</div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{currentCargo?.nome ?? "Não identificado"}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Permissão de reserva</div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{user?.podeReservar ? "Pode reservar" : "Somente consulta"}</div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                  <button type="submit" disabled={savingProfile} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-70">
                    <Save className="h-4 w-4" />{savingProfile ? "Salvando..." : "Salvar perfil"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "instituicao" && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Instituição</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">Mantenha os dados institucionais alinhados com o cadastro oficial.</p>

              {!canManageInstitution && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">Somente cargos de gestão podem editar os dados da instituição. Você continua com acesso de consulta.</div>}

              <form className="space-y-5" onSubmit={handleInstitutionSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Nome da instituição</label>
                  <input type="text" value={institutionForm.nomeFantasia} onChange={(event) => setInstitutionForm((current) => ({ ...current, nomeFantasia: event.target.value }))} disabled={!canManageInstitution} className={inputClassName} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Endereço</label>
                  <input type="text" value={institutionForm.endereco} onChange={(event) => setInstitutionForm((current) => ({ ...current, endereco: event.target.value }))} disabled={!canManageInstitution} className={inputClassName} />
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Cidade</label>
                    <input type="text" value={institutionForm.cidade} onChange={(event) => setInstitutionForm((current) => ({ ...current, cidade: event.target.value }))} disabled={!canManageInstitution} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Estado</label>
                    <input type="text" value={institutionForm.estado} onChange={(event) => setInstitutionForm((current) => ({ ...current, estado: event.target.value }))} disabled={!canManageInstitution} className={inputClassName} />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                  <button type="submit" disabled={savingInstitution || !canManageInstitution} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-70">
                    <Save className="h-4 w-4" />{savingInstitution ? "Salvando..." : "Salvar instituição"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "notificacoes" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Notificações</h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">Controle quais alertas da instituição você deseja acompanhar.</p>

                {!canManageNotifications ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">As notificações de reservas e espaços ficam disponíveis apenas para cargos de gestão da instituição.</div>
                ) : (
                  <form className="space-y-5" onSubmit={handleNotificationsSubmit}>
                    {[{ key: "novasReservas", title: "Novas reservas", description: "Receba alertas quando uma nova reserva for cadastrada." }, { key: "alteracoesReserva", title: "Alterações em reservas", description: "Inclui edição, confirmação e cancelamento de reservas existentes." }, { key: "novosEspacos", title: "Novos espaços", description: "Seja avisado quando um novo espaço for cadastrado para a instituição." }].map((item) => (
                      <label key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-4 transition-colors hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{item.title}</div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{item.description}</div>
                        </div>
                        <input type="checkbox" checked={notificationForm[item.key as keyof NotificationPreferences]} onChange={(event) => setNotificationForm((current) => ({ ...current, [item.key]: event.target.checked }))} className="mt-1 h-4 w-4" />
                      </label>
                    ))}

                    <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                      <button type="submit" disabled={savingNotifications} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-70">
                        <Save className="h-4 w-4" />{savingNotifications ? "Salvando..." : "Salvar preferências"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Histórico recente</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Últimos eventos registrados para sua instituição.</p>
                  </div>
                  {canManageNotifications && user?.idUsuario && (
                    <button type="button" onClick={() => markAllNotificationsAsRead(user.idUsuario)} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                      <CheckCheck className="h-4 w-4" />Marcar tudo como lido
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification) => {
                    const isUnread = user?.idUsuario != null && !notification.readByUserIds?.includes(user.idUsuario);
                    return (
                      <button key={notification.id} type="button" onClick={() => user?.idUsuario && markNotificationAsRead(notification.id, user.idUsuario)} className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${isUnread ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/30" : "border-gray-100 bg-white hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{notification.title}</div>
                            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{notification.description}</div>
                            <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">{formatDateTime(notification.createdAt)}</div>
                          </div>
                          {isUnread && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    );
                  })}

                  {notifications.length === 0 && <div className="text-sm text-gray-500 dark:text-slate-400">Nenhuma notificação registrada ainda.</div>}
                </div>
              </div>
            </div>
          )}

          {activeSection === "seguranca" && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Segurança</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">Resumo rápido do estado da sua conta no ambiente atual.</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Último login</div>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{user?.ultimoLoginEm ? formatDateTime(user.ultimoLoginEm) : "Não registrado"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Status da conta</div>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{user?.ativo === false ? "Inativa" : "Ativa"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Primeiro acesso</div>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{user?.primeiroAcesso ? "Pendente" : "Concluído"}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Sessão local</div>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">Persistida no navegador atual</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
