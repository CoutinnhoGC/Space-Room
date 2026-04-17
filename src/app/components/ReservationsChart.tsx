import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ReservationsChartProps {
  data: Array<{ name: string; reservas: number }>;
}

interface OccupationChartProps {
  data: Array<{ name: string; ocupacao: number }>;
}

const tooltipStyle = { backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.2)", color: "#e2e8f0" };

export function ReservationsChart({ data }: ReservationsChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Reservas por dia</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Últimos 7 dias</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="reservas" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupationChart({ data }: OccupationChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Ocupação por horário</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Taxa média de ocupação</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}`, "Reservas"]} />
          <Bar dataKey="ocupacao" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}