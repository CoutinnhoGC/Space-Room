import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-50"
}: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-400">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`${iconBgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
