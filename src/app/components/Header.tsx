import { Bell, CheckCheck, LogOut, Menu, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getInitials } from "../lib/formatters";
import { getNotificationsForUser, markAllNotificationsAsRead, markNotificationAsRead, subscribeToNotificationStore } from "../lib/notifications";
import { canAccessManagementNotifications, canReserve } from "../lib/permissions";
import { getCurrentUser, setCurrentUser, subscribeToSessionUpdates } from "../lib/session";
import { cargoService } from "../services/cargoService";
import type { Cargo, Usuario } from "../types/api";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentUser, setCurrentUserState] = useState<Usuario | null>(() => getCurrentUser());
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotificationsForUser(getCurrentUser()).slice(0, 8));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => subscribeToSessionUpdates(() => setCurrentUserState(getCurrentUser())), []);

  useEffect(() => {
    cargoService.list().then(setCargos).catch(() => setCargos([]));
  }, []);

  const canViewNotifications = canAccessManagementNotifications(currentUser, cargos);
  const userCanReserve = canReserve(currentUser);
  const hideReservationAction = location.pathname.startsWith("/reservas");

  useEffect(() => {
    if (!canViewNotifications) {
      setNotifications([]);
      return;
    }

    const syncNotifications = () => {
      setNotifications(getNotificationsForUser(getCurrentUser()).slice(0, 8));
    };

    syncNotifications();
    return subscribeToNotificationStore(syncNotifications);
  }, [canViewNotifications, currentUser?.idUsuario]);

  const unreadCount = useMemo(() => {
    if (!currentUser?.idUsuario) {
      return 0;
    }

    return notifications.filter((item) => !item.readByUserIds?.includes(currentUser.idUsuario)).length;
  }, [notifications, currentUser?.idUsuario]);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/login", { replace: true });
  };

  const handleMarkAllNotificationsAsRead = () => {
    if (!currentUser?.idUsuario) {
      return;
    }

    markAllNotificationsAsRead(currentUser.idUsuario);
  };

  return (
    <header className="h-16 flex-shrink-0 border-b border-gray-100 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex flex-1 items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
            type="button"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar espacos, reservas..."
              className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userCanReserve && !hideReservationAction && (
            <Link
              to="/reservas/nova"
              className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 md:flex"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Nova Reserva</span>
            </Link>
          )}

          {userCanReserve && !hideReservationAction && (
            <Link
              to="/reservas/nova"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-white md:hidden"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}

          {canViewNotifications && (
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <button className="relative rounded-lg p-2 transition-colors hover:bg-gray-100" title="Notificacoes" type="button">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[360px] overflow-hidden border-gray-200 p-0 shadow-lg">
                <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Notificacoes</h3>
                      <p className="mt-1 text-xs text-gray-500">Eventos de reservas e espacos da sua instituicao</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllNotificationsAsRead}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Ler todas
                    </button>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.map((notification) => {
                    const isUnread = currentUser?.idUsuario != null && !notification.readByUserIds?.includes(currentUser.idUsuario);
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => currentUser?.idUsuario && markNotificationAsRead(notification.id, currentUser.idUsuario)}
                        className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-blue-50/50 ${isUnread ? "bg-blue-50/40" : "bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                            <div className="mt-1 text-xs text-gray-500">{notification.description}</div>
                            <div className="mt-2 text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString("pt-BR")}</div>
                          </div>
                          {isUnread && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      Nenhuma notificacao disponivel no momento.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3">
                  <Link to="/configuracoes" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                    Ajustar preferencias de notificacao
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
            <Link
              to="/perfil"
              className="flex items-center gap-3 rounded-xl p-1 pr-2 transition-colors hover:bg-gray-50"
              title="Abrir perfil"
            >
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-gray-900">{currentUser?.nome ?? "Visitante"}</div>
                <div className="text-xs text-gray-500">{currentUser?.email ?? "Sem sessao"}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-medium text-white">
                {getInitials(currentUser?.nome ?? "Visitante")}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              title="Sair"
              type="button"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
