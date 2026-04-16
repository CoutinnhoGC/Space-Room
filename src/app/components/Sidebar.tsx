import { Building2, Calendar, CalendarDays, ChevronLeft, ChevronRight, Home, LayoutDashboard, MapPin, Settings, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router";

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  activeItem: string;
  onItemClick: () => void;
  onToggleCollapse: () => void;
}

const menuSections = [
  {
    title: "Principal",
    items: [
      { id: "inicio", label: "Início", icon: Home, path: "/" },
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { id: "reservas", label: "Reservas", icon: Calendar, path: "/reservas" },
      { id: "espacos", label: "Espaços", icon: MapPin, path: "/espacos" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { id: "usuarios", label: "Usuários", icon: Users, path: "/usuarios" },
      { id: "instituicoes", label: "Instituições", icon: Building2, path: "/instituicoes" },
    ],
  },
  {
    title: "Agenda",
    items: [
      { id: "calendario", label: "Calendário", icon: CalendarDays, path: "/calendario" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/relatorios" },
    ],
  },
  {
    title: "Sistema",
    items: [{ id: "configuracoes", label: "Configurações", icon: Settings, path: "/configuracoes" }],
  },
];

export function Sidebar({ isOpen, collapsed, activeItem, onItemClick, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onItemClick} />}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:z-30 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-slate-800">
          <Link to="/" onClick={onItemClick} className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-lg font-semibold text-transparent">SpaceRoom</h1>
              </div>
            )}
          </Link>

          <button type="button" onClick={onToggleCollapse} className="hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900 lg:flex" title={collapsed ? "Expandir menu" : "Recolher menu"}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <div className="mb-2 px-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{section.title}</span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onItemClick}
                      title={collapsed ? item.label : undefined}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? "justify-center" : "gap-3"} ${isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"}`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-300" : ""}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4 dark:border-slate-800">
          <div className="text-center text-xs text-gray-400 dark:text-slate-500">{collapsed ? "V2" : "Space 1 V2"}</div>
        </div>
      </aside>
    </>
  );
}
