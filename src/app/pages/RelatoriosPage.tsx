import { BarChart3, Calendar, Download, FileText, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { canChooseInstitution, filterByInstitution, getAccessibleInstitutionId } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
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
  const currentUser = getCurrentUser();
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
        const [reservasData, usuariosData, espacosData, instituicoesData] = await Promise.all([reservaService.list(), usuarioService.list(), espacoService.list(), instituicaoService.list()]);
        setReservas(filterByInstitution(reservasData, currentUser, (item) => item.idInstituicao));
        setUsuarios(filterByInstitution(usuariosData, currentUser, (item) => item.idInstituicao));
        setEspacos(filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao));
        setInstituicoes(filterByInstitution(instituicoesData, currentUser, (item) => item.idInstituicao));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar relatorios.";
        setError(message);
        toast.error(message);
      }
    };

    load();
  }, [currentUser]);

  const showInstitutionFilter = canChooseInstitution(currentUser, instituicoes.length);
  const effectiveInstitutionId = showInstitutionFilter ? filtroInstituicao : String(getAccessibleInstitutionId(currentUser, instituicoes[0]?.idInstituicao) ?? "");
  const reservasFiltradas = useMemo(() => effectiveInstitutionId === "TODAS" ? reservas : reservas.filter((item) => String(item.idInstituicao) === effectiveInstitutionId), [reservas, effectiveInstitutionId]);
  const usuariosFiltrados = useMemo(() => effectiveInstitutionId === "TODAS" ? usuarios : usuarios.filter((item) => String(item.idInstituicao) === effectiveInstitutionId), [usuarios, effectiveInstitutionId]);
  const espacosFiltrados = useMemo(() => effectiveInstitutionId === "TODAS" ? espacos : espacos.filter((item) => String(item.idInstituicao) === effectiveInstitutionId), [espacos, effectiveInstitutionId]);
  const instituicoesFiltradas = useMemo(() => effectiveInstitutionId === "TODAS" ? instituicoes : instituicoes.filter((item) => String(item.idInstituicao) === effectiveInstitutionId), [instituicoes, effectiveInstitutionId]);

  const reports = [
    { id: 1, title: "Relatorio de reservas", description: "Exporta reservas com espaco, usuario, data e status.", icon: TrendingUp, color: "blue", onClick: () => { const lines = ["id,titulo,idUsuario,idEspaco,dataInicio,dataFim,status"]; reservasFiltradas.forEach((item) => lines.push(`${item.idReserva},${item.titulo},${item.idUsuario},${item.idEspaco},${item.dataInicio},${item.dataFim},${item.status}`)); downloadCsv("reservas.csv", lines); toast.success("Relatorio de reservas gerado."); } },
    { id: 2, title: "Reservas por instituicao", description: "Resumo consolidado por instituicao.", icon: BarChart3, color: "purple", onClick: () => { const lines = ["instituicao,total_reservas"]; instituicoesFiltradas.forEach((instituicao) => { const total = reservasFiltradas.filter((item) => item.idInstituicao === instituicao.idInstituicao).length; lines.push(`${instituicao.nomeFantasia},${total}`); }); downloadCsv("reservas-por-instituicao.csv", lines); toast.success("Relatorio por instituicao gerado."); } },
    { id: 3, title: "Usuarios mais ativos", description: "Ranking de usuarios com mais reservas.", icon: FileText, color: "green", onClick: () => { const lines = ["usuario,total_reservas"]; usuariosFiltrados.forEach((usuario) => { const total = reservasFiltradas.filter((item) => item.idUsuario === usuario.idUsuario).length; lines.push(`${usuario.nome},${total}`); }); downloadCsv("usuarios-ativos.csv", lines); toast.success("Relatorio de usuarios gerado."); } },
    { id: 4, title: "Espacos utilizados", description: "Uso dos espacos cadastrados.", icon: Calendar, color: "orange", onClick: () => { const lines = ["espaco,total_reservas"]; espacosFiltrados.forEach((espaco) => { const total = reservasFiltradas.filter((item) => item.idEspaco === espaco.idEspaco || item.idSubespaco === espaco.idEspaco).length; lines.push(`${espaco.nome},${total}`); }); downloadCsv("espacos-utilizados.csv", lines); toast.success("Relatorio de espacos gerado."); } },
  ];

  const totalReservas = reservasFiltradas.length;
  const ocupacaoMedia = espacosFiltrados.length === 0 ? 0 : Math.round((new Set(reservasFiltradas.map((item) => item.idSubespaco ?? item.idEspaco)).size / espacosFiltrados.length) * 100);

  if (error) {
    return <div className="rounded-xl border border-red-100 bg-white p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Relatorios</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gere e exporte relatorios do sistema.</p>
      </div>

      {showInstitutionFilter && <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Instituicao</label><select value={filtroInstituicao} onChange={(event) => setFiltroInstituicao(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="TODAS">Todas</option>{instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}</select></div></div></div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          const colorClasses = { blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-300", button: "bg-blue-500 hover:bg-blue-600" }, purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-300", button: "bg-purple-500 hover:bg-purple-600" }, green: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-300", button: "bg-green-500 hover:bg-green-600" }, orange: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-300", button: "bg-orange-500 hover:bg-orange-600" } }[report.color as "blue" | "purple" | "green" | "orange"];
          return <div key={report.id} className="rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-4"><div className={`${colorClasses.bg} rounded-lg p-3`}><Icon className={`h-6 w-6 ${colorClasses.text}`} /></div><div className="flex-1"><h3 className="mb-1 font-semibold text-gray-900 dark:text-slate-100">{report.title}</h3><p className="mb-4 text-sm text-gray-500 dark:text-slate-400">{report.description}</p><button onClick={report.onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${colorClasses.button}`}><Download className="h-4 w-4" />Gerar relatorio</button></div></div></div>;
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"><div className="mb-1 text-3xl font-semibold text-gray-900 dark:text-slate-100">{totalReservas}</div><div className="text-sm text-gray-500 dark:text-slate-400">Total de reservas</div></div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"><div className="mb-1 text-3xl font-semibold text-gray-900 dark:text-slate-100">{ocupacaoMedia}%</div><div className="text-sm text-gray-500 dark:text-slate-400">Taxa de ocupacao media</div></div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"><div className="mb-1 text-3xl font-semibold text-gray-900 dark:text-slate-100">{espacosFiltrados.length}</div><div className="text-sm text-gray-500 dark:text-slate-400">Espacos cadastrados</div></div>
      </div>
    </>
  );
}
