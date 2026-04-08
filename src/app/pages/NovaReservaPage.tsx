import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, User, Building2, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { canReserve, filterByInstitution } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { validateReservationInterval } from "../lib/validators";
import { instituicaoService } from "../services/instituicaoService";
import { espacoService } from "../services/espacoService";
import { reservaService } from "../services/reservaService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, Reserva, Usuario } from "../types/api";

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

        setInstituicoes(scopedInstitutions);
        setEspacos(scopedSpaces);
        setUsuarios(scopedUsers);
        setReservas(scopedReservations);
        setForm((current) => ({
          ...current,
          idInstituicao: current.idInstituicao || String(currentUser?.idInstituicao ?? scopedInstitutions[0]?.idInstituicao ?? ""),
          idUsuario: String(currentUser?.idUsuario ?? scopedUsers[0]?.idUsuario ?? ""),
          idEspaco: current.idEspaco || String(scopedSpaces[0]?.idEspaco ?? ""),
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar dados para a reserva.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.idInstituicao, currentUser?.idUsuario]);

  const selectedInstitutionSpaces = useMemo(() => {
    return espacos.filter((item) => String(item.idInstituicao) === form.idInstituicao);
  }, [espacos, form.idInstituicao]);

  const responsibleUser = useMemo(
    () => usuarios.find((item) => item.idUsuario === Number(form.idUsuario)),
    [usuarios, form.idUsuario],
  );

  const dataInicio = form.data && form.horaInicio ? `${form.data}T${form.horaInicio}:00` : "";
  const dataFim = form.data && form.horaFim ? `${form.data}T${form.horaFim}:00` : "";
  const showConflict = useMemo(() => {
    if (!form.idEspaco || !dataInicio || !dataFim) {
      return false;
    }

    return reservas.some((reserva) =>
      reserva.idEspaco === Number(form.idEspaco) &&
      reserva.status !== "CANCELADA" &&
      new Date(dataInicio) < new Date(reserva.dataFim) &&
      new Date(dataFim) > new Date(reserva.dataInicio),
    );
  }, [reservas, form.idEspaco, dataInicio, dataFim]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!userCanReserve) {
      toast.error("Seu perfil nao possui permissao para reservar espacos.");
      return;
    }

    const intervalError = validateReservationInterval(dataInicio, dataFim);
    if (intervalError) {
      toast.error(intervalError);
      return;
    }

    if (!form.idInstituicao || !form.idEspaco || !form.idUsuario) {
      toast.error("Selecione instituicao, espaco e responsavel validos.");
      return;
    }

    if (showConflict) {
      toast.error("Ja existe uma reserva para esse espaco no intervalo escolhido.");
      return;
    }

    try {
      setSaving(true);
      await reservaService.create({
        idInstituicao: Number(form.idInstituicao),
        idUsuario: Number(form.idUsuario),
        idEspaco: Number(form.idEspaco),
        titulo: form.titulo.trim() || `Reserva ${form.data}`,
        finalidade: form.finalidade.trim(),
        observacao: form.observacao.trim(),
        dataInicio,
        dataFim,
        status: "PENDENTE",
      });
      toast.success("Reserva criada com sucesso.");
      navigate("/reservas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/reservas" className="hover:text-blue-600">Reservas</Link>
          <span>/</span>
          <span className="text-gray-900">Nova Reserva</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Nova Reserva</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha os dados abaixo para criar uma nova reserva</p>
      </div>

      {!userCanReserve && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          Seu usuario esta configurado apenas para consultar reservas e espacos disponiveis. Fale com o responsavel da instituicao para liberar reservas no seu perfil.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Building2 className="w-4 h-4" />Instituicao</label>
                <select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value, idEspaco: "" }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled>
                  {instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><MapPin className="w-4 h-4" />Espaco</label>
                <select value={form.idEspaco} onChange={(event) => setForm((current) => ({ ...current, idEspaco: event.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Selecione um espaco</option>
                  {selectedInstitutionSpaces.map((space) => <option key={space.idEspaco} value={space.idEspaco}>{space.nome} (Cap. {space.capacidade})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titulo da reserva</label>
                <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} type="text" placeholder="Ex: Aula especial de laboratorio" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4" />Data</label>
                  <input type="date" value={form.data} onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4" />Horario Inicio</label>
                  <input type="time" value={form.horaInicio} onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4" />Horario Fim</label>
                  <input type="time" value={form.horaFim} onChange={(event) => setForm((current) => ({ ...current, horaFim: event.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4" />Responsavel</label>
                <select value={form.idUsuario} onChange={(event) => setForm((current) => ({ ...current, idUsuario: event.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled>
                  {usuarios.map((usuario) => <option key={usuario.idUsuario} value={usuario.idUsuario}>{usuario.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descricao / Finalidade</label>
                <textarea value={form.finalidade} onChange={(event) => setForm((current) => ({ ...current, finalidade: event.target.value }))} rows={4} placeholder="Descreva a finalidade da reserva" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observacao</label>
                <textarea value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} rows={3} placeholder="Observacoes adicionais" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>

              {showConflict && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-900 mb-1">Conflito de Horario Detectado</h4>
                    <p className="text-sm text-yellow-700">Este espaco ja possui uma reserva para o horario selecionado. Escolha outro horario ou outro espaco.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving || loading || !userCanReserve} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-70">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? "Confirmando..." : "Confirmar Reserva"}
                </button>
                <Link to="/reservas" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancelar</Link>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Dicas para Reservar</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>Verifique a disponibilidade antes de confirmar.</li>
              <li>A reserva sempre fica vinculada a sua instituicao.</li>
              <li>Conflitos de horario sao bloqueados no frontend e no backend.</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumo</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Responsavel: {responsibleUser?.nome ?? "Nao definido"}</div>
              <div>Perfil: {userCanReserve ? "Pode reservar" : "Somente consulta"}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Espacos da Instituicao</h3>
            <div className="space-y-2">
              {selectedInstitutionSpaces.slice(0, 5).map((space) => (
                <button key={space.idEspaco} onClick={() => setForm((current) => ({ ...current, idEspaco: String(space.idEspaco ?? "") }))} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  {space.nome}
                </button>
              ))}
              {selectedInstitutionSpaces.length === 0 && <div className="text-sm text-gray-500">Nenhum espaco encontrado para a instituicao selecionada.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
