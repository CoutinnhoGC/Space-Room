import { BarChart3, CalendarCheck, ClipboardCheck, KeyRound, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const features = [
  { icon: MapPin, title: "Controle de espacos", text: "Cadastre salas, laboratorios, auditorios, coworkings e subespacos hierarquicos." },
  { icon: CalendarCheck, title: "Gestao de reservas", text: "Organize solicitacoes, conflitos de horario, cancelamentos e historico operacional." },
  { icon: ShieldCheck, title: "Permissoes RBAC", text: "Separe administradores da plataforma, gestores institucionais e cargos personalizados." },
  { icon: ClipboardCheck, title: "Aprovacao por espaco", text: "Defina responsaveis e fluxos de validacao para ambientes sensiveis." },
  { icon: BarChart3, title: "Relatorios", text: "Acompanhe ocupacao, usuarios ativos, reservas pendentes e capacidade disponivel." },
  { icon: KeyRound, title: "Auditoria", text: "Registre eventos criticos de usuarios, reservas, seguranca e configuracoes." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_45%,#fefce8_100%)] text-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/login" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg"><MapPin className="h-5 w-5" /></span>
          <span className="text-lg font-bold">SpaceRoom</span>
        </Link>
        <Link to="/login" className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white">Entrar</Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">Plataforma multiempresa para espacos compartilhados</div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Reserve, aprove e audite ambientes com governanca de verdade.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">O SpaceRoom centraliza controle de espacos, reservas, permissoes e auditoria para escolas, empresas, laboratorios e coworkings, com estrutura preparada para crescimento SaaS.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="mailto:comercial@spaceroom.app?subject=Solicitar demonstracao SpaceRoom" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">Solicitar demonstracao</a>
              <a href="mailto:comercial@spaceroom.app?subject=Contratar SpaceRoom" className="rounded-xl border border-slate-300 bg-white/80 px-6 py-3 font-semibold text-slate-800 transition hover:bg-white">Contratar plataforma</a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-200">Painel operacional</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">RBAC ativo</span>
              </div>
              <div className="grid gap-3">
                {["Reserva pendente no Laboratorio 2", "Diretora Maria aprova Auditorio", "Permissao users.create alterada"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
              <feature.icon className="mb-4 h-7 w-7 text-blue-700" />
              <h2 className="text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-blue-100 bg-blue-600 p-8 text-white shadow-xl shadow-blue-500/20">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black">Planos para crescer com seguranca</h2>
              <p className="mt-2 text-blue-100">Comece com uma instituicao e evolua para multiunidade, aprovacao avancada, auditoria e modulos comerciais.</p>
            </div>
            <a href="mailto:comercial@spaceroom.app?subject=Entrar em contato SpaceRoom" className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50">Entrar em contato</a>
          </div>
        </section>
      </main>
    </div>
  );
}
