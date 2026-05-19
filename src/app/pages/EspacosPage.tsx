import { Edit2, Layers3, ListTree, Lock, MapPin, Plus, Save, Search, Trash2, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTipoEspacoLabel } from "../lib/formatters";
import { createNotification } from "../lib/notifications";
import { filterByActiveInstitution } from "../lib/permissions";
import { getEspacoHierarchyLabel, getSpaceHierarchyLevel, getSpacePathIds, getSubspacesForSpace } from "../lib/reservationUtils";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import type { Espaco, Instituicao, TipoEspaco } from "../types/api";

const tipos: TipoEspaco[] = ["SALA", "LABORATORIO", "AUDITORIO", "BIBLIOTECA", "COWORKING", "SALA_REUNIAO", "OUTRO"];

const emptyMainForm = {
  idEspaco: "",
  idInstituicao: "",
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

const emptySubspaceForm = {
  idEspaco: "",
  nome: "",
  descricao: "",
  tipo: "OUTRO" as TipoEspaco,
  capacidade: "",
  localizacao: "",
  ativo: true,
};

const inputClassName = "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export function EspacosPage() {
  const currentUser = getCurrentUser();
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [showForm, setShowForm] = useState(false);
  const [showSubspaceForm, setShowSubspaceForm] = useState(false);
  const [form, setForm] = useState(emptyMainForm);
  const [subspaceForm, setSubspaceForm] = useState(emptySubspaceForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSubspace, setSavingSubspace] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [espacosData, instituicoesData] = await Promise.all([espacoService.list(), instituicaoService.list()]);
      const scopedSpaces = filterByActiveInstitution(espacosData, currentUser, (item) => item.idInstituicao);
      const scopedInstitutions = filterByActiveInstitution(instituicoesData, currentUser, (item) => item.idInstituicao);
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

  const rootSpaces = useMemo(() => espacos.filter((item) => item.idEspacoPai == null), [espacos]);
  const selectedMainSpace = useMemo(() => rootSpaces.find((item) => String(item.idEspaco) === form.idEspaco) ?? null, [rootSpaces, form.idEspaco]);
  const selectedSubspaces = useMemo(() => getSubspacesForSpace(espacos, form.idEspaco).sort((a, b) => a.nome.localeCompare(b.nome)), [espacos, form.idEspaco]);

  const filtered = useMemo(() => {
    return rootSpaces.filter((space) => {
      const hierarchy = getEspacoHierarchyLabel(space, espacos).toLowerCase();
      const childNames = getSubspacesForSpace(espacos, space.idEspaco).map((item) => item.nome.toLowerCase()).join(" ");
      const details = `${space.localizacao ?? ""} ${space.descricao ?? ""} ${childNames}`.toLowerCase();
      const matchesSearch = `${hierarchy} ${details}`.includes(search.toLowerCase());
      const matchesType = tipoFiltro === "TODOS" || space.tipo === tipoFiltro;
      return matchesSearch && matchesType;
    });
  }, [rootSpaces, espacos, search, tipoFiltro]);

  const resetMainForm = () => {
    setForm({ ...emptyMainForm, idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? "") });
    setSubspaceForm(emptySubspaceForm);
    setShowSubspaceForm(false);
    setShowForm(false);
  };

  const resetSubspaceForm = () => {
    setSubspaceForm(emptySubspaceForm);
    setShowSubspaceForm(false);
  };

  const openCreateMainSpace = () => {
    setShowForm(true);
    setShowSubspaceForm(false);
    setSubspaceForm(emptySubspaceForm);
    setForm({ ...emptyMainForm, idInstituicao: String(currentUser?.idInstituicao ?? instituicoes[0]?.idInstituicao ?? "") });
  };

  const handleEdit = (space: Espaco) => {
    setForm({
      idEspaco: String(space.idEspaco ?? ""),
      idInstituicao: String(space.idInstituicao),
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
    resetSubspaceForm();
    setShowForm(true);
  };

  const handleEditSubspace = (space: Espaco) => {
    setSubspaceForm({
      idEspaco: String(space.idEspaco ?? ""),
      nome: space.nome,
      descricao: space.descricao ?? "",
      tipo: space.tipo,
      capacidade: String(space.capacidade),
      localizacao: space.localizacao ?? "",
      ativo: space.ativo !== false,
    });
    setShowSubspaceForm(true);
  };

  const handleDelete = async (idEspaco?: number) => {
    if (!idEspaco || !window.confirm("Deseja confirmar a exclusao deste espaco?")) {
      return;
    }

    if (getSubspacesForSpace(espacos, idEspaco).length > 0) {
      toast.error("Remova primeiro os subespacos internos deste espaco.");
      return;
    }

    try {
      await espacoService.remove(idEspaco);
      toast.success("Espaco removido com sucesso.");
      resetMainForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o espaco.");
    }
  };

  const handleDeleteSubspace = async (idEspaco?: number) => {
    if (!idEspaco || !window.confirm("Deseja confirmar a exclusao deste subespaco?")) {
      return;
    }

    try {
      await espacoService.remove(idEspaco);
      toast.success("Subespaco removido com sucesso.");
      resetSubspaceForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o subespaco.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.capacidade.trim() || !form.idInstituicao) {
      toast.error("Preencha nome, capacidade e instituicao.");
      return;
    }

    try {
      setSaving(true);
      const hierarchyPath = form.idEspaco || "new";
      const payload: Espaco = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        capacidade: Number(form.capacidade),
        localizacao: form.localizacao.trim(),
        idInstituicao: Number(form.idInstituicao),
        idEspacoPai: null,
        permiteSubespacos: form.permiteSubespacos,
        bloqueiaSubespacos: form.bloqueiaSubespacos,
        bloqueadoPorSubespacos: form.bloqueadoPorSubespacos,
        hierarchyLevel: 0,
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
          title: "Novo espaco cadastrado",
          description: `${created.nome} foi adicionado${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`,
          entityId: created.idEspaco,
          actorUserId: currentUser?.idUsuario,
        });
        toast.success("Espaco criado com sucesso. Agora voce pode abrir a edicao e cadastrar os subespacos internos.");
        handleEdit(created);
      }

      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o espaco.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSubspace = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedMainSpace?.idEspaco) {
      toast.error("Salve o espaco principal antes de cadastrar subespacos.");
      return;
    }

    if (selectedMainSpace.permiteSubespacos !== true) {
      toast.error("Ative a opcao de espacos internos no espaco principal antes de cadastrar subespacos.");
      return;
    }

    if (!subspaceForm.nome.trim() || !subspaceForm.capacidade.trim()) {
      toast.error("Preencha nome e capacidade do subespaco.");
      return;
    }

    try {
      setSavingSubspace(true);
      const parentId = selectedMainSpace.idEspaco;
      const payload: Espaco = {
        nome: subspaceForm.nome.trim(),
        descricao: subspaceForm.descricao.trim(),
        tipo: subspaceForm.tipo,
        capacidade: Number(subspaceForm.capacidade),
        localizacao: subspaceForm.localizacao.trim(),
        idInstituicao: selectedMainSpace.idInstituicao,
        idEspacoPai: parentId,
        permiteSubespacos: false,
        bloqueiaSubespacos: false,
        bloqueadoPorSubespacos: false,
        hierarchyLevel: 1,
        hierarchyPath: [...getSpacePathIds(espacos, parentId), subspaceForm.idEspaco || "new"].join("/"),
        ativo: subspaceForm.ativo,
      };

      if (subspaceForm.idEspaco) {
        await espacoService.update(Number(subspaceForm.idEspaco), { ...payload, idEspaco: Number(subspaceForm.idEspaco) });
        toast.success("Subespaco atualizado com sucesso.");
      } else {
        const created = await espacoService.create(payload);
        createNotification({
          type: "ESPACO_CRIADO",
          institutionId: created.idInstituicao,
          title: "Novo subespaco cadastrado",
          description: `${created.nome} foi adicionado a ${selectedMainSpace.nome}${currentUser?.nome ? ` por ${currentUser.nome}` : ""}.`,
          entityId: created.idEspaco,
          actorUserId: currentUser?.idUsuario,
        });
        toast.success("Subespaco criado com sucesso.");
      }

      resetSubspaceForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o subespaco.");
    } finally {
      setSavingSubspace(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Espacos</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Crie o espaco principal primeiro e gerencie os subespacos internos dentro da propria edicao.</p>
          </div>
          <button onClick={openCreateMainSpace} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700">
            <Plus className="h-4 w-4" />Adicionar espaco
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{form.idEspaco ? "Editar espaco principal" : "Novo espaco principal"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Os subespacos passam a ser gerenciados aqui, como partes internas deste espaco.</p>
            </div>
            <button onClick={resetMainForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900"><X className="h-4 w-4" /></button>
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
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Instituicao</label>
              <div className={`${inputClassName} flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300`}><Lock className="h-4 w-4" />{instituicoes[0]?.nomeFantasia ?? "Instituicao atual"}</div>
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
                <input type="checkbox" checked={form.permiteSubespacos} onChange={(event) => setForm((current) => ({ ...current, permiteSubespacos: event.target.checked }))} />
                Habilitar espacos internos
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
                Espaco ativo
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.bloqueiaSubespacos} onChange={(event) => setForm((current) => ({ ...current, bloqueiaSubespacos: event.target.checked }))} />
                Reserva do pai bloqueia os filhos
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input type="checkbox" checked={form.bloqueadoPorSubespacos} onChange={(event) => setForm((current) => ({ ...current, bloqueadoPorSubespacos: event.target.checked }))} />
                Reservas dos filhos bloqueiam o pai
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Descricao</label>
              <textarea value={form.descricao} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} placeholder="Descricao do espaco" rows={4} className={`${inputClassName} resize-none`} />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white disabled:opacity-70"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar espaco"}</button>
              <button type="button" onClick={resetMainForm} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button>
            </div>
          </form>

          {selectedMainSpace && (
            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-slate-800">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Subespacos internos</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Cadastre e mantenha os recursos internos pertencentes a {selectedMainSpace.nome}.</p>
                </div>
                <button type="button" onClick={() => { setShowSubspaceForm(true); setSubspaceForm(emptySubspaceForm); }} disabled={selectedMainSpace.permiteSubespacos !== true} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                  <Plus className="h-4 w-4" />Adicionar subespaco
                </button>
              </div>

              {selectedMainSpace.permiteSubespacos !== true && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">Ative a opcao de espacos internos no espaco principal para liberar o cadastro de subespacos.</div>}

              {showSubspaceForm && (
                <form onSubmit={handleSubmitSubspace} className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{subspaceForm.idEspaco ? "Editar subespaco" : "Novo subespaco"}</h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Este cadastro ja nasce vinculado ao espaco principal atual.</p>
                    </div>
                    <button type="button" onClick={resetSubspaceForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></label>
                      <input value={subspaceForm.nome} maxLength={120} onChange={(event) => setSubspaceForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Ex.: Bancada 1" className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Tipo</label>
                      <select value={subspaceForm.tipo} onChange={(event) => setSubspaceForm((current) => ({ ...current, tipo: event.target.value as TipoEspaco }))} className={inputClassName}>{tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}</select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Capacidade <span className="text-red-500">*</span></label>
                      <input value={subspaceForm.capacidade} maxLength={4} onChange={(event) => setSubspaceForm((current) => ({ ...current, capacidade: event.target.value.replace(/\D/g, "") }))} placeholder="Capacidade" className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Localizacao</label>
                      <input value={subspaceForm.localizacao} maxLength={120} onChange={(event) => setSubspaceForm((current) => ({ ...current, localizacao: event.target.value }))} placeholder="Ex.: Ala sul" className={inputClassName} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Descricao</label>
                      <textarea value={subspaceForm.descricao} maxLength={500} onChange={(event) => setSubspaceForm((current) => ({ ...current, descricao: event.target.value }))} rows={3} placeholder="Detalhes do subespaco" className={`${inputClassName} resize-none`} />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      <input type="checkbox" checked={subspaceForm.ativo} onChange={(event) => setSubspaceForm((current) => ({ ...current, ativo: event.target.checked }))} />
                      Subespaco ativo
                    </label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <button type="submit" disabled={savingSubspace} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white disabled:opacity-70"><Save className="h-4 w-4" />{savingSubspace ? "Salvando..." : subspaceForm.idEspaco ? "Salvar subespaco" : "Criar subespaco"}</button>
                      <button type="button" onClick={resetSubspaceForm} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {selectedSubspaces.map((space) => (
                  <div key={space.idEspaco} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{space.nome}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                        <span>{getTipoEspacoLabel(space.tipo)}</span>
                        <span>Capacidade: {space.capacidade}</span>
                        <span>{space.localizacao || "Localizacao nao informada"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleEditSubspace(space)} className="rounded p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => handleDeleteSubspace(space.idEspaco)} className="rounded p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                {selectedSubspaces.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Nenhum subespaco interno cadastrado ainda.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar espacos e conteudo interno..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500" />
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
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">{space.nome}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{getTipoEspacoLabel(space.tipo)}</p>
                  </div>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{space.capacidade} pessoas</span></div>
                <div className="flex items-center gap-1.5"><ListTree className="h-4 w-4" /><span>{subspacesCount} subespaco(s)</span></div>
                {space.permiteSubespacos && <div className="flex items-center gap-1.5"><Layers3 className="h-4 w-4" /><span>Hierarquia ativa</span></div>}
              </div>
              <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">{space.localizacao || "Localizacao nao informada"}</div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-md px-2.5 py-1 font-medium ${space.ativo === false ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300" : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"}`}>{space.ativo === false ? "Inativo" : "Ativo"}</span>
                {space.bloqueiaSubespacos === true && <span className="rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Pai bloqueia filhos</span>}
                {space.bloqueadoPorSubespacos === true && <span className="rounded-md bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Filhos bloqueiam pai</span>}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
                <div className="text-xs text-gray-500 dark:text-slate-400">{subspacesCount > 0 ? "Gerencie os itens internos na edicao" : "Sem espacos internos"}</div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(space)} className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(space.idEspaco)} className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
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
