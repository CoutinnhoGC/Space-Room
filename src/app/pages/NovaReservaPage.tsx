import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Calendar, CheckCircle, Clock, Layers3, MapPin, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { createNotification } from "../lib/notifications";
import { canReserve, filterByInstitution } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { getParentSpaces, getReservationSpaceLabel, getSubspacesForSpace, hasReservationConflict } from "../lib/reservationUtils";
import { validateReservationInterval } from "../lib/validators";
import { instituicaoService } from "../services/instituicaoService";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

const inputClassName = "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export function NovaReservaPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const userCanReserve = canReserve(currentUser);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    idInstituicao: "",
    idEspaco: "",
    idSubespaco: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    idUsuario: String(currentUser?.idUsuario ?? ""),
    titulo: "",
    finalidade: "",
    observacao: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [instituicoesData, espacosData, usuariosData, reservasData] = await Promise.all([
          instituicaoService.list(),
          espacoService.list(),
          usuarioService.list(),
          reservaService.list(),
        ]);

        const scopedInstitutions = filterByInstitution(instituicoesData, currentUser, (item) => item.idInstituicao);
        const scopedSpaces = filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao);
        const scopedUsers = filterByInstitution(usuariosData, currentUser, (item) => item.idInstituicao);
        const scopedReservations = filterByInstitution(reservasData, currentUser, (item) => item.idInstituicao);
        const parentSpaces = getParentSpaces(scopedSpaces, currentUser?.idInstituicao ?? scopedInstitutions[0]?.idInstituicao);

        setInstituicoes(scopedInstitutions);
        setEspacos(scopedSpaces);
        setUsuarios(scopedUsers);
        setReservas(scopedReservations);
        setForm((current) => ({
          ...current,
          idInstituicao: current.idInstituicao || String(currentUser?.idInstituicao ?? scopedInstitutions[0]?.idInstituicao ?? ""),
          idUsuario: String(currentUser?.idUsuario ?? scopedUsers[0]?.idUsuario ?? ""),
          idEspaco: current.idEspaco || String(parentSpaces[0]?.idEspaco ?? ""),
          idSubespaco: "",
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar dados para a reserva.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.idInstituicao, currentUser?.idUsuario]);

  const selectedInstitutionSpaces = useMemo(() => getParentSpaces(espacos, form.idInstituicao), [espacos, form.idInstituicao]);
  const availableSubspaces = useMemo(() => getSubspacesForSpace(espacos, form.idEspaco), [espacos, form.idEspaco]);
  const selectedSpace = useMemo(() => espacos.find((item) => item.idEspaco === Number(form.idEspaco)) ?? null, [espacos, form.idEspaco]);
  const responsibleUser = useMemo(() => usuarios.find((item) => item.idUsuario === Number(form.idUsuario)), [usuarios, form.idUsuario]);

  const dataInicio = form.data && form.horaInicio ? `${form.data}T${form.horaInicio}:00` : "";
  const dataFim = form.data && form.horaFim ? `${form.data}T${form.horaFim}:00` : "";
  const showConflict = useMemo(() => {
    if (!form.idEspaco || !dataInicio || !dataFim) {
      return false;
    }

    return hasReservationConflict({
      idEspaco: Number(form.idEspaco),
      idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null,
      dataInicio,
      dataFim,
    }, reservas);
  }, [reservas, form.idEspaco, form.idSubespaco, dataInicio, dataFim]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!userCanReserve) {
      toast.error("Seu perfil não possui permissão para reservar espaços.");
      return;
    }

    if (!form.titulo.trim() || !form.finalidade.trim()) {
      toast.error("Título e finalidade são obrigatórios.");
      return;
    }

    const intervalError = validateReservationInterval(dataInicio, dataFim);
    if (intervalError) {
      toast.error(intervalError);
      return;
    }

    if (!form.idInstituicao || !form.idEspaco || !form.idUsuario) {
      toast.error("Selecione instituição, espaço e responsável válidos.");
      return;
    }

    if (showConflict) {
      toast.error("Já existe uma reserva para esse espaço ou subespaço no intervalo escolhido.");
      return;
    }

    try {
      setSaving(true);
      const created = await reservaService.create({
        idInstituicao: Number(form.idInstituicao),
        idUsuario: Number(form.idUsuario),
        idEspaco: Number(form.idEspaco),
        idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null,
        titulo: form.titulo.trim(),
        finalidade: form.finalidade.trim(),
        observacao: form.observacao.trim(),
        dataInicio,
        dataFim,
        status: "PENDENTE",
      });
      createNotification({
        type: "RESERVA_CRIADA",
        institutionId: created.idInstituicao,
        title: "Nova reserva criada",
        description: `${created.titulo} foi registrada${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`,
        entityId: created.idReserva,
        actorUserId: currentUser?.idUsuario,
      });
      toast.success("Reserva criada com sucesso.");
      navigate("/reservas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/reservas" className="hover:text-blue-600 dark:hover:text-blue-300">Reservas</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-slate-100">Nova reserva</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Nova reserva</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Preencha os dados abaixo para criar uma nova reserva.</p>
      </div>

      {!userCanReserve && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          Seu usuário está configurado apenas para consultar reservas e espaços disponíveis. Fale com a gestão da instituição para liberar reservas no seu perfil.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Building2 className="h-4 w-4" />Instituição</label>
                <select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value, idEspaco: "", idSubespaco: "" }))} className={inputClassName} disabled>
                  {instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><MapPin className="h-4 w-4" />Espaço <span className="text-red-500">*</span></label>
                  <select value={form.idEspaco} onChange={(event) => setForm((current) => ({ ...current, idEspaco: event.target.value, idSubespaco: "" }))} className={inputClassName}>
                    <option value="">Selecione um espaço</option>
                    {selectedInstitutionSpaces.map((space) => <option key={space.idEspaco} value={space.idEspaco}>{space.nome} (Cap. {space.capacidade})</option>)}
                  </select>
                </div>

                {availableSubspaces.length > 0 && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Layers3 className="h-4 w-4" />Subespaço</label>
                    <select value={form.idSubespaco} onChange={(event) => setForm((current) => ({ ...current, idSubespaco: event.target.value }))} className={inputClassName}>
                      <option value="">Reservar o espaço completo</option>
                      {availableSubspaces.map((space) => <option key={space.idEspaco} value={space.idEspaco}>{space.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Título da reserva <span className="text-red-500">*</span></label>
                <input value={form.titulo} maxLength={150} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} type="text" placeholder="Ex.: Aula especial de laboratório" className={inputClassName} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />Data <span className="text-red-500">*</span></label>
                  <input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} className={inputClassName} />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />Horário inicial <span className="text-red-500">*</span></label>
                  <input type="time" value={form.horaInicio} onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))} className={inputClassName} />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />Horário final <span className="text-red-500">*</span></label>
                  <input type="time" value={form.horaFim} onChange={(event) => setForm((current) => ({ ...current, horaFim: event.target.value }))} className={inputClassName} />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300"><User className="h-4 w-4" />Responsável</label>
                <select value={form.idUsuario} onChange={(event) => setForm((current) => ({ ...current, idUsuario: event.target.value }))} className={inputClassName} disabled>
                  {usuarios.map((usuario) => <option key={usuario.idUsuario} value={usuario.idUsuario}>{usuario.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Finalidade <span className="text-red-500">*</span></label>
                <textarea value={form.finalidade} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, finalidade: event.target.value }))} rows={4} placeholder="Descreva a finalidade da reserva" className={`${inputClassName} resize-none`} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Observações</label>
                <textarea value={form.observacao} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} rows={3} placeholder="Observações adicionais" className={`${inputClassName} resize-none`} />
              </div>

              {showConflict && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/60 dark:bg-yellow-950/30">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-300" />
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-medium text-yellow-900 dark:text-yellow-100">Conflito de horário detectado</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">Este espaço ou subespaço já possui uma reserva para o horário selecionado.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                <button type="submit" disabled={saving || loading || !userCanReserve} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-70">
                  <CheckCircle className="h-4 w-4" />
                  {saving ? "Confirmando..." : "Confirmar reserva"}
                </button>
                <Link to="/reservas" className="rounded-lg border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Cancelar</Link>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-100">Dicas para reservar</h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
              <li>Se houver subespaços, você pode reservar apenas a área necessária.</li>
              <li>Ao deixar o subespaço em branco, a reserva ocupa o espaço principal por completo.</li>
              <li>Conflitos de horário são validados no frontend e no backend.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-slate-100">Resumo</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <div>Responsável: {responsibleUser?.nome ?? "Não definido"}</div>
              <div>Perfil: {userCanReserve ? "Pode reservar" : "Somente consulta"}</div>
              {selectedSpace && <div>Seleção: {getReservationSpaceLabel({ idInstituicao: Number(form.idInstituicao || 0), idUsuario: Number(form.idUsuario || 0), idEspaco: Number(form.idEspaco || 0), idSubespaco: form.idSubespaco ? Number(form.idSubespaco) : null, titulo: "", dataInicio: dataInicio || new Date().toISOString(), dataFim: dataFim || new Date().toISOString() }, espacos)}</div>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-slate-100">Espaços da instituição</h3>
            <div className="space-y-2">
              {selectedInstitutionSpaces.slice(0, 6).map((space) => (
                <button key={space.idEspaco} type="button" onClick={() => setForm((current) => ({ ...current, idEspaco: String(space.idEspaco ?? ""), idSubespaco: "" }))} className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-900">
                  {space.nome}
                </button>
              ))}
              {selectedInstitutionSpaces.length === 0 && <div className="text-sm text-gray-500 dark:text-slate-400">Nenhum espaço encontrado para a instituição selecionada.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}