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

export function SummaryCard({ title, value, icon: Icon, trend, iconColor = "text-blue-600 dark:text-blue-300", iconBgColor = "bg-blue-50 dark:bg-blue-950/40" }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
          <h3 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-slate-100">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${trend.isPositive ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-500">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`${iconBgColor} rounded-lg p-3`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}