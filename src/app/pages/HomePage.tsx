import { Bell, CalendarDays, Clock3, MapPin, Megaphone, Plus, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { formatDate, formatDateTime, formatTimeRange, getStatusReservaColor, getStatusReservaLabel } from "../lib/formatters";
import { addMuralMessage, getMuralMessages, removeMuralMessage, subscribeToMural } from "../lib/mural";
import { createNotification } from "../lib/notifications";
import { canAccessManagementNotifications, filterByActiveInstitution } from "../lib/permissions";
import { getReservationSpaceLabel } from "../lib/reservationUtils";
import { getCurrentUser } from "../lib/session";
import { cargoService } from "../services/cargoService";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import type { Cargo, Espaco, Reserva } from "../types/api";

const defaultNotices = [
  "Confirme reservas pendentes para liberar a agenda com antecedência.",
  "Atualize os recursos fixos dos espaços para melhorar a busca interna.",
  "Centralize avisos urgentes aqui antes de publicar comunicados amplos.",
];

export function HomePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muralText, setMuralText] = useState("");
  const [muralVersion, setMuralVersion] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, espacosData, cargosData] = await Promise.all([reservaService.list(), espacoService.list(), cargoService.list()]);
        setReservas(filterByActiveInstitution(reservasData, currentUser, (item) => item.idInstituicao));
        setEspacos(filterByActiveInstitution(espacosData, currentUser, (item) => item.idInstituicao));
        setCargos(cargosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar a tela inicial.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  useEffect(() => subscribeToMural(() => setMuralVersion((current) => current + 1)), []);

  const now = new Date();
  const canManageMural = useMemo(() => canAccessManagementNotifications(currentUser, cargos), [currentUser, cargos]);
  const muralMessages = useMemo(() => getMuralMessages(currentUser?.idInstituicao), [currentUser?.idInstituicao, muralVersion]);
  const upcomingReservations = useMemo(() => reservas.filter((item) => item.status !== "CANCELADA" && new Date(item.dataInicio) >= now).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()).slice(0, 5), [reservas, now]);
  const reservationsToday = useMemo(() => reservas.filter((item) => new Date(item.dataInicio).toDateString() === now.toDateString() && item.status !== "CANCELADA"), [reservas, now]);
  const availableSpaces = useMemo(() => espacos.filter((item) => item.ativo !== false && item.idEspacoPai == null), [espacos]);
  const pendingCount = useMemo(() => reservas.filter((item) => item.status === "PENDENTE").length, [reservas]);
  const featuredReservations = useMemo(() => upcomingReservations.slice(0, 3), [upcomingReservations]);

  const handleOpenReservation = (reservation: Reserva) => {
    navigate(`/reservas?reserva=${reservation.idReserva}`);
  };

  const handleCreateMuralMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser?.idInstituicao || !canManageMural) {
      return;
    }
    if (!muralText.trim()) {
      toast.error("Digite uma mensagem para o mural.");
      return;
    }

    addMuralMessage(currentUser.idInstituicao, muralText.trim(), currentUser.nome);
    createNotification({ type: "RESERVA_ATUALIZADA", institutionId: currentUser.idInstituicao, title: "Mural atualizado", description: `${currentUser.nome} publicou um novo recado no mural.`, actorUserId: currentUser.idUsuario });
    setMuralText("");
    toast.success("Recado publicado no mural.");
  };

  const handleDeleteMuralMessage = (id: string) => {
    if (!window.confirm("Deseja remover este recado do mural?")) {
      return;
    }
    removeMuralMessage(id);
    toast.success("Recado removido.");
  };

  if (loading) {
    return <div className="space-y-6"><div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-slate-950" /></div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide"><Sparkles className="h-4 w-4" />Tela inicial</div>
            <h1 className="text-2xl font-semibold">Bem-vindo, {currentUser?.nome ?? "usuário"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-50">Visualize avisos, próximos compromissos e destaques operacionais antes de entrar na dashboard.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"><div className="text-xs uppercase tracking-wide text-blue-100">Hoje</div><div className="mt-1 text-2xl font-semibold">{reservationsToday.length}</div><div className="text-xs text-blue-100">reservas previstas</div></div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"><div className="text-xs uppercase tracking-wide text-blue-100">Espaços</div><div className="mt-1 text-2xl font-semibold">{availableSpaces.length}</div><div className="text-xs text-blue-100">principais no catálogo</div></div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"><div className="text-xs uppercase tracking-wide text-blue-100">Pendências</div><div className="mt-1 text-2xl font-semibold">{pendingCount}</div><div className="text-xs text-blue-100">reservas aguardando ação</div></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><Megaphone className="h-5 w-5" /></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Mural</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Recados rápidos da operação</p>
              </div>
            </div>
            {canManageMural && <button type="button" onClick={() => document.getElementById("home-mural-input")?.focus()} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Plus className="h-4 w-4" /></button>}
          </div>

          {canManageMural && (
            <form onSubmit={handleCreateMuralMessage} className="mt-4 space-y-3">
              <textarea id="home-mural-input" value={muralText} onChange={(event) => setMuralText(event.target.value)} maxLength={280} rows={3} placeholder="Adicionar recado para a equipe" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500" />
              <button type="submit" className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white">Publicar recado</button>
            </form>
          )}

          <div className="mt-4 space-y-3">
            {muralMessages.length > 0 ? muralMessages.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 px-3 py-3 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-slate-200">{item.message}</p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">{item.authorName} • {formatDateTime(item.createdAt)}</div>
                  </div>
                  {canManageMural && <button type="button" onClick={() => handleDeleteMuralMessage(item.id)} className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
            )) : <p className="text-sm text-gray-600 dark:text-slate-300">Nenhum recado publicado ainda.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Bell className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Avisos</h2><p className="text-sm text-gray-500 dark:text-slate-400">Comunicados operacionais</p></div></div>
          <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">{defaultNotices.map((notice) => <li key={notice} className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-900">{notice}</li>)}</ul>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Clock3 className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Próximo evento</h2><p className="text-sm text-gray-500 dark:text-slate-400">Compromisso mais imediato</p></div></div>
          {upcomingReservations[0] ? <button type="button" onClick={() => handleOpenReservation(upcomingReservations[0])} className="mt-4 w-full rounded-xl bg-gray-50 p-4 text-left transition-colors hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/30"><div className="font-medium text-gray-900 dark:text-slate-100">{upcomingReservations[0].titulo}</div><div className="mt-2 text-sm text-gray-600 dark:text-slate-300">{formatDate(upcomingReservations[0].dataInicio)}</div><div className="text-sm text-gray-600 dark:text-slate-300">{formatTimeRange(upcomingReservations[0].dataInicio, upcomingReservations[0].dataFim)}</div></button> : <p className="mt-4 text-sm text-gray-600 dark:text-slate-300">Nenhum evento futuro encontrado.</p>}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Carrossel de destaques</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Clique para abrir os detalhes da reserva</p>
            </div>
          </div>

          <div className="px-12 md:px-14">
            <Carousel opts={{ align: "start", loop: featuredReservations.length > 1 }}>
              <CarouselContent>
                {(featuredReservations.length > 0 ? featuredReservations : upcomingReservations.slice(0, 1)).map((reservation) => (
                  <CarouselItem key={reservation.idReserva ?? reservation.titulo} className="md:basis-1/2">
                    <button type="button" onClick={() => handleOpenReservation(reservation)} className="h-full w-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-left text-white transition-transform hover:-translate-y-0.5">
                      <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">Destaque</div>
                      <h3 className="mt-4 text-xl font-semibold">{reservation.titulo}</h3>
                      <p className="mt-2 text-sm text-blue-50">{getReservationSpaceLabel(reservation, espacos)}</p>
                      <div className="mt-6 flex items-center gap-2 text-sm text-blue-50"><MapPin className="h-4 w-4" />{formatDate(reservation.dataInicio)} • {formatTimeRange(reservation.dataInicio, reservation.dataFim)}</div>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-5 border-gray-200 bg-white text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              <CarouselNext className="-right-5 border-gray-200 bg-white text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </Carousel>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><CalendarDays className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Eventos</h2><p className="text-sm text-gray-500 dark:text-slate-400">Lista curta para consulta imediata</p></div></div>
          <div className="space-y-3">{upcomingReservations.length > 0 ? upcomingReservations.map((reservation) => <button key={reservation.idReserva ?? `${reservation.titulo}-${reservation.dataInicio}`} type="button" onClick={() => handleOpenReservation(reservation)} className="w-full rounded-xl border border-gray-100 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"><div className="flex items-start justify-between gap-3"><div><div className="font-medium text-gray-900 dark:text-slate-100">{reservation.titulo}</div><div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{getReservationSpaceLabel(reservation, espacos)}</div><div className="text-sm text-gray-500 dark:text-slate-400">{formatDate(reservation.dataInicio)} • {formatTimeRange(reservation.dataInicio, reservation.dataFim)}</div></div><span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(reservation.status)}`}>{getStatusReservaLabel(reservation.status)}</span></div></button>) : <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:bg-slate-900 dark:text-slate-400">Nenhum evento agendado para os próximos períodos.</div>}</div>
        </article>
      </section>
    </div>
  );
}
