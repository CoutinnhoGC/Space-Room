import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Edit2, XCircle, Save, X, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { canReserve, filterByInstitution, isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { reservaService } from "../services/reservaService";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, StatusReserva, Usuario } from "../types/api";

const emptyForm = {
  idReserva: "",
  titulo: "",
  finalidade: "",
  idInstituicao: "",
  idUsuario: "",
  idEspaco: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  status: "PENDENTE" as StatusReserva,
  observacao: "",
};

export function ReservasPage() {
  const currentUser = getCurrentUser();
  const userCanReserve = canReserve(currentUser);
  const platformAdmin = isPlatformAdmin(currentUser);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservasData, usuariosData, espacosData, instituicoesData] = await Promise.all([
        reservaService.list(),
        usuarioService.list(),
        espacoService.list(),
        instituicaoService.list(),
      ]);
      const scopedReservas = filterByInstitution(reservasData, currentUser, (item) => item.idInstituicao);
      const scopedUsuarios = filterByInstitution(usuariosData, currentUser, (item) => item.idInstituicao);
      const scopedEspacos = filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao);
      const scopedInstituicoes = filterByInstitution(instituicoesData, currentUser, (item) => item.idInstituicao);

      setReservas(scopedReservas);
      setUsuarios(scopedUsuarios);
      setEspacos(scopedEspacos);
      setInstituicoes(scopedInstituicoes);
      setForm((current) => ({
        ...current,
        idInstituicao: current.idInstituicao || String(currentUser?.idInstituicao ?? scopedInstituicoes[0]?.idInstituicao ?? ""),
        idUsuario: current.idUsuario || String(currentUser?.idUsuario ?? scopedUsuarios[0]?.idUsuario ?? ""),
        idEspaco: current.idEspaco || String(scopedEspacos[0]?.idEspaco ?? ""),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return reservas.filter((reservation) => {
      const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);
      const espaco = espacos.find((item) => item.idEspaco === reservation.idEspaco);
      const text = `${reservation.titulo} ${usuario?.nome ?? ""} ${espaco?.nome ?? ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFiltro === "TODOS" || reservation.status === statusFiltro;
      return matchesSearch && matchesStatus;
    });
  }, [reservas, usuarios, espacos, search, statusFiltro]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? ""),
      idUsuario: String(currentUser?.idUsuario ?? usuarios[0]?.idUsuario ?? ""),
      idEspaco: String(espacos[0]?.idEspaco ?? ""),
    });
    setShowForm(false);
  };

  const handleEdit = (reservation: Reserva) => {
    const start = new Date(reservation.dataInicio);
    const end = new Date(reservation.dataFim);
    setForm({
      idReserva: String(reservation.idReserva ?? ""),
      titulo: reservation.titulo,
      finalidade: reservation.finalidade ?? "",
      idInstituicao: String(reservation.idInstituicao),
      idUsuario: String(reservation.idUsuario),
      idEspaco: String(reservation.idEspaco),
      data: reservation.dataInicio.slice(0, 10),
      horaInicio: start.toISOString().slice(11, 16),
      horaFim: end.toISOString().slice(11, 16),
      status: reservation.status ?? "PENDENTE",
      observacao: reservation.observacao ?? "",
    });
    setShowForm(true);
  };

  const handleDelete = async (idReserva?: number) => {
    if (!idReserva) {
      return;
    }

    try {
      await reservaService.remove(idReserva);
      toast.success("Reserva removida com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a reserva.");
    }
  };

  const handleCancel = async (reservation: Reserva) => {
    try {
      await reservaService.update(Number(reservation.idReserva), { ...reservation, status: "CANCELADA" });
      toast.success("Reserva cancelada com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cancelar a reserva.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!userCanReserve) {
      toast.error("Seu perfil nao possui permissao para reservar espacos.");
      return;
    }

    if (!form.titulo.trim() || !form.data || !form.horaInicio || !form.horaFim) {
      toast.error("Preencha titulo, data e horarios.");
      return;
    }

    const dataInicio = `${form.data}T${form.horaInicio}:00`;
    const dataFim = `${form.data}T${form.horaFim}:00`;

    if (new Date(dataFim) <= new Date(dataInicio)) {
      toast.error("O horario final deve ser maior que o inicial.");
      return;
    }

    try {
      setSaving(true);
      const payload: Reserva = {
        titulo: form.titulo.trim(),
        finalidade: form.finalidade.trim(),
        idInstituicao: Number(form.idInstituicao),
        idUsuario: Number(form.idUsuario),
        idEspaco: Number(form.idEspaco),
        dataInicio,
        dataFim,
        status: form.status,
        observacao: form.observacao.trim(),
      };

      if (form.idReserva) {
        await reservaService.update(Number(form.idReserva), { ...payload, idReserva: Number(form.idReserva) });
        toast.success("Reserva atualizada com sucesso.");
      } else {
        await reservaService.create(payload);
        toast.success("Reserva criada com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reservas</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie as reservas visiveis para a sua instituicao</p>
          </div>
          {userCanReserve && (
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(true); resetForm(); }} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                <Plus className="w-4 h-4" />
                Reserva Rapida
              </button>
              <Link to="/reservas/nova" className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
                <Plus className="w-4 h-4" />
                Nova Reserva
              </Link>
            </div>
          )}
        </div>
      </div>

      {!userCanReserve && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          Seu acesso permite consultar reservas e espacos disponiveis, mas nao criar novas reservas.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{form.idReserva ? "Editar reserva" : "Nova reserva"}</h2>
            <button onClick={resetForm} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} placeholder="Titulo" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.finalidade} onChange={(event) => setForm((current) => ({ ...current, finalidade: event.target.value }))} placeholder="Finalidade" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" disabled>
              {instituicoes.map((item) => <option key={item.idInstituicao} value={item.idInstituicao}>{item.nomeFantasia}</option>)}
            </select>
            <select value={form.idUsuario} onChange={(event) => setForm((current) => ({ ...current, idUsuario: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" disabled={!platformAdmin}>
              {usuarios.map((item) => <option key={item.idUsuario} value={item.idUsuario}>{item.nome}</option>)}
            </select>
            <select value={form.idEspaco} onChange={(event) => setForm((current) => ({ ...current, idEspaco: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {espacos.map((item) => <option key={item.idEspaco} value={item.idEspaco}>{item.nome}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StatusReserva }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <option value="PENDENTE">Pendente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="CONCLUIDA">Concluida</option>
            </select>
            <input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <input type="time" value={form.horaInicio} onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
              <input type="time" value={form.horaFim} onChange={(event) => setForm((current) => ({ ...current, horaFim: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            </div>
            <textarea value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observacao" rows={4} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg md:col-span-2" />
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving || !userCanReserve} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-70"><Save className="w-4 h-4" />{saving ? "Salvando..." : "Salvar"}</button>
              <button type="button" onClick={resetForm} className="px-5 py-3 border border-gray-200 rounded-lg text-gray-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar por espaco, responsavel..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <select value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="TODOS">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="CONCLUIDA">Concluida</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">{filtered.length} resultado(s)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Espaco</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Responsavel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Horario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filtered.map((reservation) => {
                const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);
                const espaco = espacos.find((item) => item.idEspaco === reservation.idEspaco);
                return (
                  <tr key={reservation.idReserva} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{espaco?.nome ?? reservation.titulo}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-700">{usuario?.nome ?? "Usuario nao encontrado"}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-700">{formatDate(reservation.dataInicio)}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-700">{formatTimeRange(reservation.dataInicio, reservation.dataFim)}</div></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusReservaColor(reservation.status)}`}>{getStatusReservaLabel(reservation.status)}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Visualizar"><Eye className="w-4 h-4" /></button>
                        {userCanReserve && <button onClick={() => handleEdit(reservation)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>}
                        {userCanReserve && <button onClick={() => handleCancel(reservation)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Cancelar"><XCircle className="w-4 h-4" /></button>}
                        {platformAdmin && <button onClick={() => handleDelete(reservation.idReserva)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">Mostrando <span className="font-medium">{filtered.length}</span> resultado(s)</div>
        </div>
      </div>
      {loading && <div className="mt-4 text-sm text-gray-500">Carregando reservas...</div>}
    </>
  );
}
