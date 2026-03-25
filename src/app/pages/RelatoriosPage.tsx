import { useEffect, useMemo, useState } from "react";
import { Download, Calendar, FileText, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function RelatoriosPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [filtroInstituicao, setFiltroInstituicao] = useState("TODAS");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, usuariosData, espacosData, instituicoesData] = await Promise.all([
          reservaService.list(),
          usuarioService.list(),
          espacoService.list(),
          instituicaoService.list(),
        ]);
        setReservas(reservasData);
        setUsuarios(usuariosData);
        setEspacos(espacosData);
        setInstituicoes(instituicoesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar relatorios.";
        setError(message);
        toast.error(message);
      }
    };

    load();
  }, []);

  const reservasFiltradas = useMemo(() => {
    if (filtroInstituicao === "TODAS") {
      return reservas;
    }

    return reservas.filter((item) => String(item.idInstituicao) === filtroInstituicao);
  }, [reservas, filtroInstituicao]);

  const reports = [
    {
      id: 1,
      title: "Relatorio de Reservas",
      description: "Exporta reservas com espaco, usuario, data e status.",
      icon: TrendingUp,
      color: "blue",
      onClick: () => {
        const lines = ["id,titulo,idUsuario,idEspaco,dataInicio,dataFim,status"];
        reservasFiltradas.forEach((item) => lines.push(`${item.idReserva},${item.titulo},${item.idUsuario},${item.idEspaco},${item.dataInicio},${item.dataFim},${item.status}`));
        downloadCsv("reservas.csv", lines);
        toast.success("Relatorio de reservas gerado.");
      },
    },
    {
      id: 2,
      title: "Reservas por Instituicao",
      description: "Resumo consolidado por instituicao.",
      icon: BarChart3,
      color: "purple",
      onClick: () => {
        const lines = ["instituicao,total_reservas"];
        instituicoes.forEach((instituicao) => {
          const total = reservas.filter((item) => item.idInstituicao === instituicao.idInstituicao).length;
          lines.push(`${instituicao.nomeFantasia},${total}`);
        });
        downloadCsv("reservas-por-instituicao.csv", lines);
        toast.success("Relatorio por instituicao gerado.");
      },
    },
    {
      id: 3,
      title: "Usuarios Mais Ativos",
      description: "Ranking de usuarios com mais reservas.",
      icon: FileText,
      color: "green",
      onClick: () => {
        const lines = ["usuario,total_reservas"];
        usuarios.forEach((usuario) => {
          const total = reservas.filter((item) => item.idUsuario === usuario.idUsuario).length;
          lines.push(`${usuario.nome},${total}`);
        });
        downloadCsv("usuarios-ativos.csv", lines);
        toast.success("Relatorio de usuarios gerado.");
      },
    },
    {
      id: 4,
      title: "Espacos Utilizados",
      description: "Uso dos espacos cadastrados.",
      icon: Calendar,
      color: "orange",
      onClick: () => {
        const lines = ["espaco,total_reservas"];
        espacos.forEach((espaco) => {
          const total = reservas.filter((item) => item.idEspaco === espaco.idEspaco).length;
          lines.push(`${espaco.nome},${total}`);
        });
        downloadCsv("espacos-utilizados.csv", lines);
        toast.success("Relatorio de espacos gerado.");
      },
    },
  ];

  const totalReservas = reservasFiltradas.length;
  const ocupacaoMedia = espacos.length === 0 ? 0 : Math.round((new Set(reservasFiltradas.map((item) => item.idEspaco)).size / espacos.length) * 100);

  if (error) {
    return <div className="bg-white border border-red-100 text-red-700 rounded-xl p-6 text-sm">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Relatorios</h1>
        <p className="text-sm text-gray-500 mt-1">Gere e exporte relatorios do sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Instituicao</label>
            <select value={filtroInstituicao} onChange={(event) => setFiltroInstituicao(event.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="TODAS">Todas</option>
              {instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const colorClasses = {
            blue: { bg: "bg-blue-50", text: "text-blue-600", button: "bg-blue-500 hover:bg-blue-600" },
            purple: { bg: "bg-purple-50", text: "text-purple-600", button: "bg-purple-500 hover:bg-purple-600" },
            green: { bg: "bg-green-50", text: "text-green-600", button: "bg-green-500 hover:bg-green-600" },
            orange: { bg: "bg-orange-50", text: "text-orange-600", button: "bg-orange-500 hover:bg-orange-600" },
          }[report.color as "blue" | "purple" | "green" | "orange"];

          return (
            <div key={report.id} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`${colorClasses.bg} p-3 rounded-lg flex-shrink-0`}><Icon className={`w-6 h-6 ${colorClasses.text}`} /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                  <button onClick={report.onClick} className={`flex items-center gap-2 ${colorClasses.button} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}>
                    <Download className="w-4 h-4" />Gerar Relatorio
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6"><div className="text-3xl font-semibold text-gray-900 mb-1">{totalReservas}</div><div className="text-sm text-gray-500">Total de Reservas</div></div>
        <div className="bg-white border border-gray-100 rounded-xl p-6"><div className="text-3xl font-semibold text-gray-900 mb-1">{ocupacaoMedia}%</div><div className="text-sm text-gray-500">Taxa de Ocupacao Media</div></div>
        <div className="bg-white border border-gray-100 rounded-xl p-6"><div className="text-3xl font-semibold text-gray-900 mb-1">{espacos.length}</div><div className="text-sm text-gray-500">Espacos Cadastrados</div></div>
      </div>
    </>
  );
}
