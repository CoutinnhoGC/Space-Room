import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReservationsChartProps {
  data: Array<{ name: string; reservas: number }>;
}

interface OccupationChartProps {
  data: Array<{ name: string; ocupacao: number }>;
}

export function ReservationsChart({ data }: ReservationsChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Reservas por Dia</h3>
        <p className="text-sm text-gray-500 mt-1">Ultimos 7 dias</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
          <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
          <Line type="monotone" dataKey="reservas" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupationChart({ data }: OccupationChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ocupacao por Horario</h3>
        <p className="text-sm text-gray-500 mt-1">Taxa de ocupacao media</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
          <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`${value}`, "Reservas"]} />
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
