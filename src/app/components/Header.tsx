import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, LogOut, Menu, Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router";
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

  useEffect(() => subscribeToSessionUpdates(() => setCurrentUserState(getCurrentUser())), []);

  useEffect(() => {
    cargoService.list().then(setCargos).catch(() => setCargos([]));
  }, []);

  const canViewNotifications = canAccessManagementNotifications(currentUser, cargos);
  const userCanReserve = canReserve(currentUser);

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
    navigate("/login");
  };

  const handleMarkAllNotificationsAsRead = () => {
    if (!currentUser?.idUsuario) {
      return;
    }

    markAllNotificationsAsRead(currentUser.idUsuario);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex-shrink-0">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar espacos, reservas..."
              className="bg-transparent border-none outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userCanReserve && (
            <Link
              to="/reservas/nova"
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nova Reserva</span>
            </Link>
          )}

          {userCanReserve && (
            <Link
              to="/reservas/nova"
              className="md:hidden p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </Link>
          )}

          {canViewNotifications && (
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Notificacoes">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-blue-600 text-white rounded-full text-[10px] font-semibold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[360px] p-0 overflow-hidden border-gray-200 shadow-lg">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Notificacoes</h3>
                      <p className="text-xs text-gray-500 mt-1">Eventos de reservas e espacos da sua instituicao</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllNotificationsAsRead}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
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
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 transition-colors ${isUnread ? "bg-blue-50/40" : "bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{notification.description}</div>
                            <div className="text-[11px] text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString("pt-BR")}</div>
                          </div>
                          {isUnread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="px-4 py-8 text-sm text-gray-500 text-center">
                      Nenhuma notificacao disponivel no momento.
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100">
                  <Link to="/configuracoes" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                    Ajustar preferencias de notificacao
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">{currentUser?.nome ?? "Visitante"}</div>
              <div className="text-xs text-gray-500">{currentUser?.email ?? "Sem sessao"}</div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {getInitials(currentUser?.nome ?? "Visitante")}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
