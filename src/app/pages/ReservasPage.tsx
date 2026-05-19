import { CalendarRange, Clock3, Edit2, Eye, FileText, Filter, Layers3, Plus, Search, Trash2, User2, X, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { DetailPanel } from "../components/DetailPanel";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { createNotification } from "../lib/notifications";
import { canReserve, filterByActiveInstitution, isPlatformAdmin } from "../lib/permissions";
import { getParentSpaces, getReservationConflictDetails, getReservationSpaceLabel, getSubspacesForSpace, hasReservationConflict } from "../lib/reservationUtils";
import { getCurrentUser } from "../lib/session";
import { validateReservationInterval } from "../lib/validators";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, StatusReserva, Usuario } from "../types/api";

type PanelMode = "quick" | "edit" | null;

const emptyForm = {
  idReserva: "",
  titulo: "",
  finalidade: "",
  idInstituicao: "",
  idUsuario: "",
  idEspaco: "",
  idSubespaco: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  status: "PENDENTE" as StatusReserva,
  observacao: "",
};

const ITEMS_PER_PAGE = 15;
const inputClassName = "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatInputTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function buildQuickDefaults(currentUser: Usuario | null, instituicoes: Instituicao[], usuarios: Usuario[], espacos: Espaco[]) {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  const parentSpaces = getParentSpaces(espacos, currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao);

  return {
    ...emptyForm,
    idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? ""),
    idUsuario: String(currentUser?.idUsuario ?? usuarios[0]?.idUsuario ?? ""),
    idEspaco: String(parentSpaces[0]?.idEspaco ?? ""),
    data: formatInputDate(start),
    horaInicio: formatInputTime(start),
    horaFim: formatInputTime(end),
  };
}

export function ReservasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const userCanReserve = canReserve(currentUser);
  const platformAdmin = isPlatformAdmin(currentUser);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reserva | null>(null);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [responsavelFiltro, setResponsavelFiltro] = useState("TODOS");
  const [espacoFiltro, setEspacoFiltro] = useState("TODOS");
  const [dataFiltro, setDataFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
      const scopedReservas = filterByActiveInstitution(reservasData, currentUser, (item) => item.idInstituicao);
      const scopedUsuarios = filterByActiveInstitution(usuariosData, currentUser, (item) => item.idInstituicao);
      const scopedEspacos = filterByActiveInstitution(espacosData, currentUser, (item) => item.idInstituicao);
      const scopedInstituicoes = filterByActiveInstitution(instituicoesData, currentUser, (item) => item.idInstituicao);
      const parentSpaces = getParentSpaces(scopedEspacos, currentUser?.idInstituicao ?? scopedInstituicoes[0]?.idInstituicao);

      setReservas(scopedReservas);
      setUsuarios(scopedUsuarios);
      setEspacos(scopedEspacos);
      setInstituicoes(scopedInstituicoes);
      setForm((current) => ({
        ...current,
        idInstituicao: current.idInstituicao || String(currentUser?.idInstituicao ?? scopedInstituicoes[0]?.idInstituicao ?? ""),
        idUsuario: current.idUsuario || String(currentUser?.idUsuario ?? scopedUsuarios[0]?.idUsuario ?? ""),
        idEspaco: current.idEspaco || String(parentSpaces[0]?.idEspaco ?? ""),
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFiltro, responsavelFiltro, espacoFiltro, dataFiltro]);

  useEffect(() => {
    const id = Number(searchParams.get("reserva") || 0);
    if (!id || reservas.length === 0) {
      return;
    }

    const reservation = reservas.find((item) => item.idReserva === id);
    if (reservation) {
      setSelectedReservation(reservation);
    }
  }, [searchParams, reservas]);

  const parentSpaces = useMemo(() => getParentSpaces(espacos, form.idInstituicao), [espacos, form.idInstituicao]);
  const availableSubspaces = useMemo(() => getSubspacesForSpace(espacos, form.idEspaco), [espacos, form.idEspaco]);
  const conflictDetails = useMemo(() => {
    const dataInicio = form.data && form.horaInicio ? `${form.data}T${form.horaInicio}:00` : "";
    const dataFim = form.data && form.horaFim ? `${form.data}T${form.horaFim}:00` : "";
    if (!form.idEspaco || !dataInicio || !dataFim) {
      return null;
    }

    return getReservationConflictDetails({
      idReserva: form.idReserva ? Number(form.idReserva) : null,
      idEspaco: Number(form.idEspaco),
      idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null,
      dataInicio,
      dataFim,
    }, reservas, espacos);
  }, [form, reservas, espacos]);

  const filtered = useMemo(() => {
    return reservas.filter((reservation) => {
      const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);
      const text = `${reservation.titulo} ${usuario?.nome ?? ""} ${getReservationSpaceLabel(reservation, espacos)}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFiltro === "TODOS" || reservation.status === statusFiltro;
      const matchesResponsavel = responsavelFiltro === "TODOS" || String(reservation.idUsuario) === responsavelFiltro;
      const matchesEspaco = espacoFiltro === "TODOS" || String(reservation.idEspaco) === espacoFiltro;
      const matchesData = !dataFiltro || reservation.dataInicio.slice(0, 10) === dataFiltro;
      return matchesSearch && matchesStatus && matchesResponsavel && matchesEspaco && matchesData;
    });
  }, [reservas, usuarios, espacos, search, statusFiltro, responsavelFiltro, espacoFiltro, dataFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedReservations = useMemo(() => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filtered, currentPage]);

  const selectedReservationRelations = useMemo(() => {
    if (!selectedReservation) {
      return { usuario: null, espaco: null, subespaco: null, instituicao: null };
    }

    return {
      usuario: usuarios.find((item) => item.idUsuario === selectedReservation.idUsuario) ?? null,
      espaco: espacos.find((item) => item.idEspaco === selectedReservation.idEspaco) ?? null,
      subespaco: selectedReservation.idSubespaco ? espacos.find((item) => item.idEspaco === selectedReservation.idSubespaco) ?? null : null,
      instituicao: instituicoes.find((item) => item.idInstituicao === selectedReservation.idInstituicao) ?? null,
    };
  }, [selectedReservation, usuarios, espacos, instituicoes]);

  const closePanels = () => {
    setPanelMode(null);
    setSelectedReservation(null);
    if (searchParams.get("reserva")) {
      setSearchParams({});
    }
  };

  const openDetails = (reservation: Reserva) => {
    setSelectedReservation(reservation);
    setSearchParams({ reserva: String(reservation.idReserva ?? "") });
  };

  const openQuickReservation = () => {
    setForm(buildQuickDefaults(currentUser, instituicoes, usuarios, espacos));
    setPanelMode("quick");
  };

  const openEditReservation = (reservation: Reserva) => {
    const start = new Date(reservation.dataInicio);
    const end = new Date(reservation.dataFim);
    setForm({
      idReserva: String(reservation.idReserva ?? ""),
      titulo: reservation.titulo,
      finalidade: reservation.finalidade ?? "",
      idInstituicao: String(reservation.idInstituicao),
      idUsuario: String(reservation.idUsuario),
      idEspaco: String(reservation.idEspaco),
      idSubespaco: String(reservation.idSubespaco ?? ""),
      data: reservation.dataInicio.slice(0, 10),
      horaInicio: start.toISOString().slice(11, 16),
      horaFim: end.toISOString().slice(11, 16),
      status: reservation.status ?? "PENDENTE",
      observacao: reservation.observacao ?? "",
    });
    setPanelMode("edit");
  };

  const handleDelete = async (idReserva?: number) => {
    if (!idReserva || !window.confirm("Deseja confirmar a exclusao desta reserva?")) {
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
    if (!window.confirm("Deseja confirmar o cancelamento desta reserva?")) {
      return;
    }

    try {
      const updated = await reservaService.update(Number(reservation.idReserva), { ...reservation, status: "CANCELADA" });
      createNotification({ type: "RESERVA_ATUALIZADA", institutionId: updated.idInstituicao, title: "Reserva cancelada", description: `${updated.titulo} foi cancelada${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`, entityId: updated.idReserva, actorUserId: currentUser?.idUsuario });
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

    if (!form.titulo.trim() || !form.finalidade.trim()) {
      toast.error("Titulo e finalidade sao obrigatorios.");
      return;
    }

    const dataInicio = form.data && form.horaInicio ? `${form.data}T${form.horaInicio}:00` : "";
    const dataFim = form.data && form.horaFim ? `${form.data}T${form.horaFim}:00` : "";
    const intervalError = validateReservationInterval(dataInicio, dataFim);
    if (intervalError) {
      toast.error(intervalError);
      return;
    }

    if (!form.idEspaco || !form.idInstituicao || !form.idUsuario) {
      toast.error("Selecione espaco, instituicao e responsavel validos.");
      return;
    }

    const hasConflict = hasReservationConflict({
      idReserva: form.idReserva ? Number(form.idReserva) : null,
      idEspaco: Number(form.idEspaco),
      idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null,
      dataInicio,
      dataFim,
    }, reservas, espacos);
    if (hasConflict) {
      toast.error(conflictDetails?.message || "Ja existe uma reserva para esse espaco ou subespaco no intervalo selecionado.");
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
        idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null,
        dataInicio,
        dataFim,
        status: panelMode === "quick" ? "CONFIRMADA" : form.status,
        observacao: form.observacao.trim(),
      };

      if (form.idReserva) {
        const updated = await reservaService.update(Number(form.idReserva), { ...payload, idReserva: Number(form.idReserva) });
        createNotification({ type: "RESERVA_ATUALIZADA", institutionId: updated.idInstituicao, title: "Reserva alterada", description: `${updated.titulo} foi atualizada${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`, entityId: updated.idReserva, actorUserId: currentUser?.idUsuario });
        toast.success("Reserva atualizada com sucesso.");
      } else {
        const created = await reservaService.create(payload);
        createNotification({ type: "RESERVA_CRIADA", institutionId: created.idInstituicao, title: panelMode === "quick" ? "Reserva rapida criada" : "Nova reserva criada", description: `${created.titulo} foi registrada${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`, entityId: created.idReserva, actorUserId: currentUser?.idUsuario });
        toast.success(panelMode === "quick" ? "Reserva rapida criada com sucesso." : "Reserva criada com sucesso.");
      }

      closePanels();
      setForm(emptyForm);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Reservas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gerencie apenas as reservas da instituicao ativa.</p>
          </div>
          {userCanReserve && <div className="flex gap-2"><button onClick={openQuickReservation} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Plus className="h-4 w-4" />Reserva rapida</button><Link to="/reservas/nova" className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700"><Plus className="h-4 w-4" />Nova reserva</Link></div>}
        </div>
      </div>

      {!userCanReserve && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">Seu acesso permite consultar reservas e espacos disponiveis, mas nao criar novas reservas.</div>}

      {panelMode && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{panelMode === "quick" ? "Reserva rapida" : form.idReserva ? "Editar reserva" : "Nova reserva"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{panelMode === "quick" ? "Preencha os campos essenciais para registrar uma reserva imediata." : "Os conflitos entre pai e filhos sao validados antes do envio."}</p>
            </div>
            <button onClick={closePanels} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Titulo <span className="text-red-500">*</span></label>
              <input value={form.titulo} maxLength={150} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} placeholder="Titulo da reserva" className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Finalidade <span className="text-red-500">*</span></label>
              <input value={form.finalidade} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, finalidade: event.target.value }))} placeholder="Finalidade da reserva" className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Instituicao <span className="text-red-500">*</span></label>
              <select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value, idEspaco: "", idSubespaco: "" }))} className={inputClassName} disabled>{instituicoes.map((item) => <option key={item.idInstituicao} value={item.idInstituicao}>{item.nomeFantasia}</option>)}</select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Responsavel <span className="text-red-500">*</span></label>
              <select value={form.idUsuario} onChange={(event) => setForm((current) => ({ ...current, idUsuario: event.target.value }))} className={inputClassName} disabled={!platformAdmin || panelMode === "quick"}>{usuarios.map((item) => <option key={item.idUsuario} value={item.idUsuario}>{item.nome}</option>)}</select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Espaco <span className="text-red-500">*</span></label>
              <select value={form.idEspaco} onChange={(event) => setForm((current) => ({ ...current, idEspaco: event.target.value, idSubespaco: "" }))} className={inputClassName}>{parentSpaces.map((item) => <option key={item.idEspaco} value={item.idEspaco}>{item.nome}</option>)}</select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Layers3 className="h-4 w-4" />Subespaco</label>
              <select value={form.idSubespaco} onChange={(event) => setForm((current) => ({ ...current, idSubespaco: event.target.value }))} className={inputClassName} disabled={availableSubspaces.length === 0}>
                <option value="">{availableSubspaces.length > 0 ? "Reservar o espaco completo" : "Sem subespacos cadastrados"}</option>
                {availableSubspaces.map((item) => <option key={item.idEspaco} value={item.idEspaco}>{item.nome}</option>)}
              </select>
            </div>
            {panelMode !== "quick" && <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StatusReserva }))} className={inputClassName}><option value="PENDENTE">Pendente</option><option value="CONFIRMADA">Confirmada</option><option value="CANCELADA">Cancelada</option><option value="CONCLUIDA">Concluida</option></select></div>}
            <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Data <span className="text-red-500">*</span></label><input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} className={inputClassName} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Inicio <span className="text-red-500">*</span></label><input type="time" value={form.horaInicio} onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))} className={inputClassName} /></div><div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Fim <span className="text-red-500">*</span></label><input type="time" value={form.horaFim} onChange={(event) => setForm((current) => ({ ...current, horaFim: event.target.value }))} className={inputClassName} /></div></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Observacoes</label><textarea value={form.observacao} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observacoes" rows={4} className={`${inputClassName} resize-none`} /></div>
            {conflictDetails?.conflict && <div className="md:col-span-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-900 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-100"><div className="font-medium">Conflito detectado</div><div className="mt-1">{conflictDetails.message}</div></div>}
            {panelMode === "quick" && <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">A reserva rapida usa sua instituicao e o seu perfil atual para registrar uma reserva objetiva, com confirmacao imediata quando nao houver conflito de horario.</div>}
            <div className="md:col-span-2 flex items-center gap-3"><button type="submit" disabled={saving || !userCanReserve} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white disabled:opacity-70"><FileText className="h-4 w-4" />{saving ? "Salvando..." : panelMode === "quick" ? "Confirmar reserva rapida" : "Salvar"}</button><button type="button" onClick={closePanels} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button></div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Filter className="h-4 w-4" />Filtros</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-2"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" /><input value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar por espaco, subespaco, responsavel ou titulo..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500" /></div></div>
          <select value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)} className={inputClassName}><option value="TODOS">Todos os status</option><option value="PENDENTE">Pendente</option><option value="CONFIRMADA">Confirmada</option><option value="CANCELADA">Cancelada</option><option value="CONCLUIDA">Concluida</option></select>
          <select value={responsavelFiltro} onChange={(event) => setResponsavelFiltro(event.target.value)} className={inputClassName}><option value="TODOS">Todos os responsaveis</option>{usuarios.map((item) => <option key={item.idUsuario} value={item.idUsuario}>{item.nome}</option>)}</select>
          <select value={espacoFiltro} onChange={(event) => setEspacoFiltro(event.target.value)} className={inputClassName}><option value="TODOS">Todos os espacos</option>{getParentSpaces(espacos, currentUser?.idInstituicao).map((item) => <option key={item.idEspaco} value={item.idEspaco}>{item.nome}</option>)}</select>
          <input type="date" value={dataFiltro} onChange={(event) => setDataFiltro(event.target.value)} className={inputClassName} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900"><tr><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Espaco</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Responsavel</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Data</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Horario</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Status</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Acoes</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {!loading && paginatedReservations.map((reservation) => {
                const usuario = usuarios.find((item) => item.idUsuario === reservation.idUsuario);
                return <tr key={reservation.idReserva} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/60"><td className="px-6 py-4"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">{getReservationSpaceLabel(reservation, espacos)}</div></td><td className="px-6 py-4"><div className="text-sm text-gray-700 dark:text-slate-300">{usuario?.nome ?? "Usuario nao encontrado"}</div></td><td className="px-6 py-4"><div className="text-sm text-gray-700 dark:text-slate-300">{formatDate(reservation.dataInicio)}</div></td><td className="px-6 py-4"><div className="text-sm text-gray-700 dark:text-slate-300">{formatTimeRange(reservation.dataInicio, reservation.dataFim)}</div></td><td className="px-6 py-4"><span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(reservation.status)}`}>{getStatusReservaLabel(reservation.status)}</span></td><td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openDetails(reservation)} className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800" title="Visualizar detalhes" type="button"><Eye className="h-4 w-4" /></button>{userCanReserve && <button onClick={() => openEditReservation(reservation)} className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40" title="Editar reserva" type="button"><Edit2 className="h-4 w-4" /></button>}{userCanReserve && <button onClick={() => handleCancel(reservation)} className="rounded p-1.5 text-yellow-600 transition-colors hover:bg-yellow-50 dark:text-yellow-300 dark:hover:bg-yellow-950/40" title="Cancelar reserva" type="button"><XCircle className="h-4 w-4" /></button>}{platformAdmin && <button onClick={() => handleDelete(reservation.idReserva)} className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40" title="Excluir reserva" type="button"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-slate-800"><div className="text-sm text-gray-600 dark:text-slate-400">Mostrando <span className="font-medium">{paginatedReservations.length}</span> de <span className="font-medium">{filtered.length}</span> resultado(s)</div><div className="flex items-center gap-2"><button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Anterior</button><span className="text-sm text-gray-500 dark:text-slate-400">Pagina {currentPage} de {totalPages}</span><button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Proxima</button></div></div>
      </div>
      {loading && <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">Carregando reservas...</div>}

      {selectedReservation && (
        <DetailPanel title={selectedReservation.titulo} subtitle="Visualizacao da reserva em modo de leitura." onClose={() => closePanels()}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><CalendarRange className="h-4 w-4 text-blue-600 dark:text-blue-300" />Data</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{formatDate(selectedReservation.dataInicio)}</div></div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-300" />Horario</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{formatTimeRange(selectedReservation.dataInicio, selectedReservation.dataFim)}</div></div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Espaco principal</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservationRelations.espaco?.nome ?? "Espaco nao encontrado"}</div></div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><Layers3 className="h-4 w-4 text-blue-600 dark:text-blue-300" />Subespaco</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservationRelations.subespaco?.nome ?? "Reserva do espaco completo"}</div></div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100"><User2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />Responsavel</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservationRelations.usuario?.nome ?? "Usuario nao encontrado"}</div></div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Reserva</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{getReservationSpaceLabel(selectedReservation, espacos)}</div></div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Instituicao</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservationRelations.instituicao?.nomeFantasia ?? "Instituicao nao encontrada"}</div></div><div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Status</div><div className="mt-2"><span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(selectedReservation.status)}`}>{getStatusReservaLabel(selectedReservation.status)}</span></div></div></div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Finalidade</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservation.finalidade || "Nao informada."}</div></div><div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="text-sm font-medium text-gray-900 dark:text-slate-100">Observacoes</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{selectedReservation.observacao || "Nenhuma observacao registrada."}</div></div></div>
        </DetailPanel>
      )}
    </>
  );
}
