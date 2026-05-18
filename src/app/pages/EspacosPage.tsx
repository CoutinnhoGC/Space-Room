import { Edit2, GitBranch, Layers3, Lock, MapPin, Plus, Save, Search, Trash2, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTipoEspacoLabel } from "../lib/formatters";
import { createNotification } from "../lib/notifications";
import { canChooseInstitution, filterByInstitution, isPlatformAdmin } from "../lib/permissions";
import { canAssignParentSpace, getEspacoHierarchyLabel, getHierarchicalSpaceOptions, getSpaceHierarchyLevel, getSpacePathIds, getSubspacesForSpace } from "../lib/reservationUtils";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import type { Espaco, Instituicao, TipoEspaco } from "../types/api";

const tipos: TipoEspaco[] = ["SALA", "LABORATORIO", "AUDITORIO", "BIBLIOTECA", "COWORKING", "SALA_REUNIAO", "OUTRO"];
const emptyForm = {
  idEspaco: "",
  idInstituicao: "",
  idEspacoPai: "",
  nome: "",
  descricao: "",
  tipo: "SALA" as TipoEspaco,
  capacidade: "",
  localizacao: "",
  permiteSubespacos: false,
  bloqueiaSubespacos: true,
  bloqueadoPorSubespacos: true,
  ativo: true,
};
const inputClassName = "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export function EspacosPage() {
  const currentUser = getCurrentUser();
  const platformAdmin = isPlatformAdmin(currentUser);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [espacosData, instituicoesData] = await Promise.all([espacoService.list(), instituicaoService.list()]);
      const scopedSpaces = filterByInstitution(espacosData, currentUser, (item) => item.idInstituicao);
      const scopedInstitutions = filterByInstitution(instituicoesData, currentUser, (item) => item.idInstituicao);
      setEspacos(scopedSpaces.map((space) => ({ ...space, hierarchyLevel: getSpaceHierarchyLevel(scopedSpaces, space.idEspaco) })));
      setInstituicoes(scopedInstitutions);
      setForm((current) => ({ ...current, idInstituicao: current.idInstituicao || String(currentUser?.idInstituicao ?? scopedInstitutions[0]?.idInstituicao ?? "") }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar espacos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showInstitutionSelector = canChooseInstitution(currentUser, instituicoes.length);
  const parentSpaceOptions = useMemo(() => getHierarchicalSpaceOptions(espacos, form.idInstituicao).filter((item) => String(item.id) !== form.idEspaco), [espacos, form.idInstituicao, form.idEspaco]);

  const filtered = useMemo(() => {
    return espacos.filter((space) => {
      const hierarchy = getEspacoHierarchyLabel(space, espacos).toLowerCase();
      const details = `${space.localizacao ?? ""} ${space.descricao ?? ""}`.toLowerCase();
      const matchesSearch = `${hierarchy} ${details}`.includes(search.toLowerCase());
      const matchesType = tipoFiltro === "TODOS" || space.tipo === tipoFiltro;
      return matchesSearch && matchesType;
    });
  }, [espacos, search, tipoFiltro]);

  const resetForm = () => {
    setForm({ ...emptyForm, idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? "") });
    setShowForm(false);
  };

  const handleEdit = (space: Espaco) => {
    setForm({
      idEspaco: String(space.idEspaco ?? ""),
      idInstituicao: String(space.idInstituicao),
      idEspacoPai: String(space.idEspacoPai ?? ""),
      nome: space.nome,
      descricao: space.descricao ?? "",
      tipo: space.tipo,
      capacidade: String(space.capacidade),
      localizacao: space.localizacao ?? "",
      permiteSubespacos: space.permiteSubespacos === true,
      bloqueiaSubespacos: space.bloqueiaSubespacos !== false,
      bloqueadoPorSubespacos: space.bloqueadoPorSubespacos === true,
      ativo: space.ativo !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (idEspaco?: number) => {
    if (!idEspaco || !window.confirm("Deseja confirmar a exclusao deste espaco?")) {
      return;
    }

    if (getSubspacesForSpace(espacos, idEspaco).length > 0) {
      toast.error("Remova ou reatribua os subespacos antes de excluir este espaco.");
      return;
    }

    try {
      await espacoService.remove(idEspaco);
      toast.success("Espaco removido com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o espaco.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.capacidade.trim() || !form.idInstituicao) {
      toast.error("Preencha nome, capacidade e instituicao.");
      return;
    }

    const hierarchyCheck = canAssignParentSpace(espacos, { idEspaco: form.idEspaco ? Number(form.idEspaco) : undefined, idInstituicao: Number(form.idInstituicao) }, form.idEspacoPai ? Number(form.idEspacoPai) : null);
    if (!hierarchyCheck.valid) {
      toast.error(hierarchyCheck.reason);
      return;
    }

    try {
      setSaving(true);
      const parentId = form.idEspacoPai ? Number(form.idEspacoPai) : null;
      const hierarchyLevel = parentId ? getSpaceHierarchyLevel(espacos, parentId) + 1 : 0;
      const hierarchyPath = parentId ? [...getSpacePathIds(espacos, parentId), form.idEspaco || "new"].join("/") : form.idEspaco || "new";
      const payload: Espaco = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        capacidade: Number(form.capacidade),
        localizacao: form.localizacao.trim(),
        idInstituicao: Number(form.idInstituicao),
        idEspacoPai: parentId,
        permiteSubespacos: parentId ? false : form.permiteSubespacos,
        bloqueiaSubespacos: parentId ? false : form.bloqueiaSubespacos,
        bloqueadoPorSubespacos: form.bloqueadoPorSubespacos,
        hierarchyLevel,
        hierarchyPath,
        ativo: form.ativo,
      };

      if (form.idEspaco) {
        await espacoService.update(Number(form.idEspaco), { ...payload, idEspaco: Number(form.idEspaco) });
        toast.success("Espaco atualizado com sucesso.");
      } else {
        const created = await espacoService.create(payload);
        createNotification({
          type: "ESPACO_CRIADO",
          institutionId: created.idInstituicao,
          title: payload.idEspacoPai ? "Novo subespaco cadastrado" : "Novo espaco cadastrado",
          description: `${created.nome} foi adicionado${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`,
          entityId: created.idEspaco,
          actorUserId: currentUser?.idUsuario,
        });
        toast.success(payload.idEspacoPai ? "Subespaco criado com sucesso." : "Espaco criado com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o espaco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Espacos</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gerencie a hierarquia entre espacos e as regras de bloqueio entre pai e filhos.</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm({ ...emptyForm, idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? "") }); }} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700">
            <Plus className="h-4 w-4" />Adicionar espaco
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{form.idEspaco ? "Editar espaco" : "Novo espaco"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">A hierarquia suporta multiplos niveis e impede loops ou auto-vinculo.</p>
            </div>
            <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900"><X className="h-4 w-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></label>
              <input value={form.nome} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome do espaco" className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Tipo <span className="text-red-500">*</span></label>
              <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as TipoEspaco }))} className={inputClassName}>{tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}</select>
            </div>
            {showInstitutionSelector ? <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Instituicao <span className="text-red-500">*</span></label><select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value, idEspacoPai: "" }))} className={inputClassName}>{instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}</select></div> : <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Instituicao</label><div className={`${inputClassName} flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300`}><Lock className="h-4 w-4" />{instituicoes[0]?.nomeFantasia ?? "Instituicao atual"}</div></div>}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Espaco pai</label>
              <select value={form.idEspacoPai} onChange={(event) => setForm((current) => ({ ...current, idEspacoPai: event.target.value, permiteSubespacos: event.target.value ? false : current.permiteSubespacos, bloqueiaSubespacos: event.target.value ? false : current.bloqueiaSubespacos }))} className={inputClassName}>
                <option value="">Sem espaco pai (raiz)</option>
                {parentSpaceOptions.map((option) => <option key={option.id} value={option.id}>{`${"— ".repeat(option.level)}${option.space.nome}`}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Capacidade <span className="text-red-500">*</span></label>
              <input value={form.capacidade} maxLength={4} onChange={(event) => setForm((current) => ({ ...current, capacidade: event.target.value.replace(/\D/g, "") }))} placeholder="Capacidade" className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Localizacao</label>
              <input value={form.localizacao} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, localizacao: event.target.value }))} placeholder="Localizacao" className={inputClassName} />
            </div>
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.permiteSubespacos} onChange={(event) => setForm((current) => ({ ...current, permiteSubespacos: event.target.checked, idEspacoPai: event.target.checked ? "" : current.idEspacoPai }))} disabled={Boolean(form.idEspacoPai)} />
                Espaco habilitado para subespacos
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
                Espaco ativo
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.bloqueiaSubespacos} onChange={(event) => setForm((current) => ({ ...current, bloqueiaSubespacos: event.target.checked }))} disabled={Boolean(form.idEspacoPai)} />
                Reserva do pai bloqueia os filhos
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.bloqueadoPorSubespacos} onChange={(event) => setForm((current) => ({ ...current, bloqueadoPorSubespacos: event.target.checked }))} />
                Reservas dos filhos bloqueiam o pai
              </label>
            </div>
            <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
              <div className="font-medium">Politica atual</div>
              <div className="mt-1">{form.bloqueiaSubespacos || form.bloqueadoPorSubespacos ? `${form.bloqueiaSubespacos ? "Pai bloqueia filhos" : "Pai nao bloqueia filhos"} • ${form.bloqueadoPorSubespacos ? "Filhos bloqueiam pai" : "Filhos independentes do pai"}` : "Hierarquia independente entre pai e filhos."}</div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Descricao</label>
              <textarea value={form.descricao} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} placeholder="Descricao do espaco" rows={4} className={`${inputClassName} resize-none`} />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white disabled:opacity-70"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar espacos e subespacos..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500" />
            </div>
          </div>
          <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} className={inputClassName}>
            <option value="TODOS">Todos os tipos</option>
            {tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!loading && filtered.map((space) => {
          const subspacesCount = getSubspacesForSpace(espacos, space.idEspaco).length;
          return (
            <div key={space.idEspaco} className="rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40"><MapPin className="h-5 w-5 text-blue-600 dark:text-blue-300" /></div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">{getEspacoHierarchyLabel(space, espacos)}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{getTipoEspacoLabel(space.tipo)}</p>
                  </div>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{space.capacidade} pessoas</span></div>
                <div className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /><span>Nivel {space.hierarchyLevel ?? 0}</span></div>
                {(space.permiteSubespacos || space.idEspacoPai) && <div className="flex items-center gap-1.5"><Layers3 className="h-4 w-4" /><span>{space.idEspacoPai ? "Subespaco" : `${subspacesCount} subespaco(s)`}</span></div>}
              </div>
              <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">{space.localizacao || "Localizacao nao informada"}</div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-md px-2.5 py-1 font-medium ${space.ativo === false ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300" : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"}`}>{space.ativo === false ? "Inativo" : "Ativo"}</span>
                {space.bloqueiaSubespacos === true && <span className="rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Pai bloqueia filhos</span>}
                {space.bloqueadoPorSubespacos === true && <span className="rounded-md bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Filhos bloqueiam pai</span>}
                {space.bloqueiaSubespacos === false && space.bloqueadoPorSubespacos !== true && <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">Independente</span>}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
                <div className="text-xs text-gray-500 dark:text-slate-400">{subspacesCount > 0 ? `${subspacesCount} filho(s) direto(s)` : "Sem subespacos"}</div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(space)} className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"><Edit2 className="h-4 w-4" /></button>
                  {(platformAdmin || subspacesCount === 0) && <button onClick={() => handleDelete(space.idEspaco)} className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {loading && <div className="text-sm text-gray-500 dark:text-slate-400">Carregando espacos...</div>}
      {!loading && filtered.length === 0 && <div className="text-sm text-gray-500 dark:text-slate-400">Nenhum espaco encontrado.</div>}
    </>
  );
}
