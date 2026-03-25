import { Link } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  CalendarDays, 
  BarChart3, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  activeItem: string;
  onItemClick: () => void;
}

const menuSections = [
  {
    title: "Principal",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'reservas', label: 'Reservas', icon: Calendar, path: '/reservas' },
      { id: 'espacos', label: 'Espaços', icon: MapPin, path: '/espacos' },
    ]
  },
  {
    title: "Gestão",
    items: [
      { id: 'usuarios', label: 'Usuários', icon: Users, path: '/usuarios' },
      { id: 'instituicoes', label: 'Instituições', icon: Building2, path: '/instituicoes' },
    ]
  },
  {
    title: "Agenda",
    items: [
      { id: 'calendario', label: 'Calendário', icon: CalendarDays, path: '/calendario' },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
    ]
  },
  {
    title: "Sistema",
    items: [
      { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
    ]
  }
];

export function Sidebar({ isOpen, activeItem, onItemClick }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onItemClick}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static left-0 top-0 h-screen bg-white border-r border-gray-100 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                SpaceRoom
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onItemClick}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            SpaceRoom v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
