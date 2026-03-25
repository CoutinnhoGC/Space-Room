import { useEffect, useState } from "react";
import { Menu, Search, Bell, Plus, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { getInitials } from "../lib/formatters";
import { getCurrentUser, setCurrentUser, subscribeToSessionUpdates } from "../lib/session";
import type { Usuario } from "../types/api";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentUser, setCurrentUserState] = useState<Usuario | null>(() => getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => subscribeToSessionUpdates(() => setCurrentUserState(getCurrentUser())), []);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/login");
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
          <Link
            to="/reservas/nova"
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Nova Reserva</span>
          </Link>

          <Link
            to="/reservas/nova"
            className="md:hidden p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </Link>

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

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
