import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Clock3, MapPin, Megaphone, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { formatDate, formatTimeRange, getStatusReservaColor, getStatusReservaLabel, getTipoEspacoLabel } from "../lib/formatters";
import { filterByInstitution } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import type { Espaco, Reserva } from "../types/api";

const defaultNotices = [
  "Confirme reservas pendentes para liberar agenda com antecedencia.",
  "Atualize recursos fixos dos espacos para melhorar a busca interna.",
  "Centralize avisos urgentes aqui antes de publicar comunicados amplos.",
];

export function HomePage() {
  const currentUser = getCurrentUser();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [reservasData, espacosData] = await Promise.all([reservaService.list(), espacoService.list()]);
        setReservas(filterByInstitution(reservasData, currentUser, (item) => item.idInstituicao));
        setEspacos(filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar a tela inicial.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const now = new Date();

  const upcomingReservations = useMemo(
    () => reservas
      .filter((item) => item.status !== "CANCELADA" && new Date(item.dataInicio) >= now)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
      .slice(0, 5),
    [reservas, now],
  );

  const reservationsToday = useMemo(
    () => reservas.filter((item) => new Date(item.dataInicio).toDateString() === now.toDateString() && item.status !== "CANCELADA"),
    [reservas, now],
  );

  const availableSpaces = useMemo(() => espacos.filter((item) => item.ativo !== false), [espacos]);
  const pendingCount = useMemo(() => reservas.filter((item) => item.status === "PENDENTE").length, [reservas]);

  const featuredSlides = useMemo(() => {
    const baseSlides = availableSpaces.slice(0, 3).map((space) => ({
      title: space.nome,
      subtitle: getTipoEspacoLabel(space.tipo),
      detail: space.localizacao || "Localizacao interna nao informada",
      accent: "from-blue-500 to-blue-600",
    }));

    if (baseSlides.length > 0) {
      return baseSlides;
    }

    return [
      {
        title: "Agenda centralizada",
        subtitle: "Sem dados publicados",
        detail: "Cadastre espacos e reservas para alimentar esta vitrine inicial.",
        accent: "from-blue-500 to-blue-600",
      },
    ];
  }, [availableSpaces]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-white" />
          <div className="h-28 animate-pulse rounded-2xl bg-white" />
          <div className="h-28 animate-pulse rounded-2xl bg-white" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              Tela inicial
            </div>
            <h1 className="text-2xl font-semibold">Bem-vindo, {currentUser?.nome ?? "usuario"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-50">
              Visualize avisos, agenda proxima e destaques operacionais antes de entrar na dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-blue-100">Hoje</div>
              <div className="mt-1 text-2xl font-semibold">{reservationsToday.length}</div>
              <div className="text-xs text-blue-100">reservas previstas</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-blue-100">Espacos</div>
              <div className="mt-1 text-2xl font-semibold">{availableSpaces.length}</div>
              <div className="text-xs text-blue-100">disponiveis no catalogo</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-blue-100">Pendencias</div>
              <div className="mt-1 text-2xl font-semibold">{pendingCount}</div>
              <div className="text-xs text-blue-100">reservas aguardando acao</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Megaphone className="h-5 w-5" /></div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Mural</h2>
              <p className="text-sm text-gray-500">Recado rapido para operacao</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Priorize confirmacoes das reservas mais proximas e valide a disponibilidade dos espacos destacados abaixo.
          </p>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Bell className="h-5 w-5" /></div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Avisos</h2>
              <p className="text-sm text-gray-500">Comunicados operacionais</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            {defaultNotices.map((notice) => (
              <li key={notice} className="rounded-xl bg-gray-50 px-3 py-2">{notice}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Clock3 className="h-5 w-5" /></div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Proximo evento</h2>
              <p className="text-sm text-gray-500">Compromisso mais imediato</p>
            </div>
          </div>
          {upcomingReservations[0] ? (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="font-medium text-gray-900">{upcomingReservations[0].titulo}</div>
              <div className="mt-2 text-sm text-gray-600">{formatDate(upcomingReservations[0].dataInicio)}</div>
              <div className="text-sm text-gray-600">{formatTimeRange(upcomingReservations[0].dataInicio, upcomingReservations[0].dataFim)}</div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">Nenhum evento futuro encontrado.</p>
          )}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Carrossel de destaques</h2>
              <p className="text-sm text-gray-500">Espacos e pontos de atencao com acesso rapido</p>
            </div>
          </div>

          <div className="px-10">
            <Carousel opts={{ align: "start", loop: featuredSlides.length > 1 }}>
              <CarouselContent>
                {featuredSlides.map((slide) => (
                  <CarouselItem key={slide.title} className="md:basis-1/2">
                    <div className={`h-full rounded-2xl bg-gradient-to-br ${slide.accent} p-5 text-white`}>
                      <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                        Destaque
                      </div>
                      <h3 className="mt-4 text-xl font-semibold">{slide.title}</h3>
                      <p className="mt-2 text-sm text-blue-50">{slide.subtitle}</p>
                      <div className="mt-6 flex items-center gap-2 text-sm text-blue-50">
                        <MapPin className="h-4 w-4" />
                        {slide.detail}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 border-gray-200 bg-white text-gray-700" />
              <CarouselNext className="right-0 border-gray-200 bg-white text-gray-700" />
            </Carousel>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Eventos</h2>
              <p className="text-sm text-gray-500">Lista curta para consulta imediata</p>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map((reservation) => (
                <div key={reservation.idReserva ?? `${reservation.titulo}-${reservation.dataInicio}`} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{reservation.titulo}</div>
                      <div className="mt-1 text-sm text-gray-500">{formatDate(reservation.dataInicio)} • {formatTimeRange(reservation.dataInicio, reservation.dataFim)}</div>
                    </div>
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusReservaColor(reservation.status)}`}>
                      {getStatusReservaLabel(reservation.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">Nenhum evento agendado para os proximos periodos.</div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
