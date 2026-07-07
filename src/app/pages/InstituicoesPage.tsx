import { Building2, Edit2, MapPin, Plus, Save, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getTipoInstituicaoLabel } from "../lib/formatters";
import { canManageInstitutions, filterByInstitution, isPlatformAdmin } from "../lib/permissions";
import { getCurrentUser } from "../lib/session";
import { instituicaoService } from "../services/instituicaoService";
import type { Instituicao, InstituicaoResumo, TipoInstituicao } from "../types/api";

const tipos: TipoInstituicao[] = ["INSTITUICAO_ENSINO", "EMPRESA", "ORGAO_PUBLICO", "CENTRO_PESQUISA", "OUTRO"];
const legacyEducationTypes: TipoInstituicao[] = ["ESCOLA", "FACULDADE", "UNIVERSIDADE", "SENAI"];
const emptyForm = { idInstituicao: "", nomeFantasia: "", endereco: "", cidade: "", estado: "", email: "", telefone: "", responsavel: "", tipo: "INSTITUICAO_ENSINO" as TipoInstituicao, ativo: true };
const fieldClassName = "space-y-2";
const inputClassName = "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClassName = "block text-sm font-medium text-gray-700 dark:text-slate-300";

function normalizeInstitutionType(tipo: TipoInstituicao): TipoInstituicao {
  return legacyEducationTypes.includes(tipo) ? "INSTITUICAO_ENSINO" : tipo;
}

export function InstituicoesPage() {
  const currentUser = getCurrentUser();
  const [instituicoes, setInstituicoes] = useState<InstituicaoResumo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canCreateInstitution = canManageInstitutions(currentUser);
  const platformAdmin = isPlatformAdmin(currentUser);

  const loadData = async () => {
    try {
      setLoading(true);
      const instituicoesData = await instituicaoService.summary();
      setInstituicoes(instituicoesData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar instituições.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const visibleInstitutions = useMemo(() => filterByInstitution(instituicoes, currentUser, (item) => item.idInstituicao), [instituicoes, currentUser]);
  const filtered = useMemo(() => visibleInstitutions.filter((item) => `${item.nomeFantasia} ${item.cidade ?? ""}`.toLowerCase().includes(search.toLowerCase())), [visibleInstitutions, search]);

  const resetForm = () => { setForm(emptyForm); setShowForm(false); };
  const handleEdit = (instituicao: Instituicao) => { setForm({ idInstituicao: String(instituicao.idInstituicao ?? ""), nomeFantasia: instituicao.nomeFantasia, endereco: instituicao.endereco ?? "", cidade: instituicao.cidade ?? "", estado: instituicao.estado ?? "", email: instituicao.email ?? "", telefone: instituicao.telefone ?? "", responsavel: instituicao.responsavel ?? "", tipo: normalizeInstitutionType(instituicao.tipo), ativo: instituicao.ativo !== false }); setShowForm(true); };

  const handleDelete = async (idInstituicao?: number) => {
    if (!idInstituicao || !window.confirm("Deseja confirmar a exclusão desta instituição?")) {
      return;
    }

    try {
      await instituicaoService.remove(idInstituicao);
      toast.success("Instituição removida com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a instituição.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.nomeFantasia.trim()) {
      toast.error("Nome da instituição é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      const payload: Instituicao = { nomeFantasia: form.nomeFantasia.trim(), endereco: form.endereco.trim(), cidade: form.cidade.trim(), estado: form.estado.trim(), email: form.email.trim(), telefone: form.telefone.trim(), responsavel: form.responsavel.trim(), tipo: form.tipo, ativo: form.ativo, vitrineHabilitada: false };
      if (form.idInstituicao) {
        await instituicaoService.update(Number(form.idInstituicao), { ...payload, idInstituicao: Number(form.idInstituicao) });
        toast.success("Instituição atualizada com sucesso.");
      } else {
        await instituicaoService.create(payload);
        toast.success("Instituição criada com sucesso.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a instituição.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Instituições</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{platformAdmin ? "Gerencie todas as instituições cadastradas." : "Visualize e mantenha apenas a sua instituição."}</p>
          </div>
          {canCreateInstitution && <button onClick={() => { setShowForm(true); setForm(emptyForm); }} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700"><Plus className="h-4 w-4" />Nova instituição</button>}
        </div>
      </div>

      {!platformAdmin && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">O cadastro de novas instituições fica restrito aos criadores da plataforma. Seu acesso permanece limitado à sua instituição atual.</div>}

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{form.idInstituicao ? "Editar instituição" : "Nova instituição"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Mantenha os dados cadastrais padronizados para relatórios, usuários e reservas.</p>
            </div>
            <button onClick={resetForm} type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className={`${fieldClassName} lg:col-span-7`}>
                <label className={labelClassName}>Nome fantasia <span className="text-red-500">*</span></label>
                <input value={form.nomeFantasia} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, nomeFantasia: event.target.value }))} placeholder="Nome fantasia" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-5`}>
                <label className={labelClassName}>Tipo <span className="text-red-500">*</span></label>
                <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as TipoInstituicao }))} className={inputClassName}>{tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoInstituicaoLabel(tipo)}</option>)}</select>
              </div>
              <div className={`${fieldClassName} lg:col-span-12`}>
                <label className={labelClassName}>Endereço</label>
                <input value={form.endereco} maxLength={160} onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))} placeholder="Rua, número, bairro" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-6`}>
                <label className={labelClassName}>Cidade</label>
                <input value={form.cidade} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))} placeholder="Cidade" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-2`}>
                <label className={labelClassName}>Estado</label>
                <input value={form.estado} maxLength={2} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value.toUpperCase() }))} placeholder="UF" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-4`}>
                <label className={labelClassName}>Telefone</label>
                <input value={form.telefone} maxLength={20} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))} placeholder="(00) 00000-0000" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-6`}>
                <label className={labelClassName}>E-mail</label>
                <input value={form.email} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="contato@instituicao.com" className={inputClassName} />
              </div>
              <div className={`${fieldClassName} lg:col-span-6`}>
                <label className={labelClassName}>Responsável</label>
                <input value={form.responsavel} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, responsavel: event.target.value }))} placeholder="Nome do responsável" className={inputClassName} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5 dark:border-slate-800">
              <label className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />Instituição ativa</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Cancelar</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-70"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" /><input value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar instituições..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!loading && filtered.map((institution) => {
          const totalSpaces = institution.totalEspacos ?? 0;
          const totalUsers = institution.totalUsuarios ?? 0;
          return (
            <div key={institution.idInstituicao} className="rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600"><Building2 className="h-6 w-6 text-white" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{institution.nomeFantasia}</h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{institution.cidade ?? "Cidade não informada"}</p>
                  </div>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300"><MapPin className="h-4 w-4 text-gray-400 dark:text-slate-500" /><span className="truncate">{institution.endereco || "Endereço não informado"}</span></div>
              <div className="mb-4 grid grid-cols-2 gap-4"><div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"><div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{totalSpaces}</div><div className="mt-1 text-xs text-blue-600 dark:text-blue-300">Espaços</div></div><div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30"><div className="text-2xl font-semibold text-purple-700 dark:text-purple-300">{totalUsers}</div><div className="mt-1 text-xs text-purple-600 dark:text-purple-300">Usuários</div></div></div>
              <div className="flex gap-2"><button onClick={() => handleEdit(institution)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Edit2 className="h-4 w-4" />Gerenciar</button>{platformAdmin && <button onClick={() => handleDelete(institution.idInstituicao)} className="rounded-lg border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>}</div>
            </div>
          );
        })}
      </div>
      {loading && <div className="text-sm text-gray-500 dark:text-slate-400">Carregando instituições...</div>}
      {!loading && filtered.length === 0 && <div className="text-sm text-gray-500 dark:text-slate-400">Nenhuma instituição encontrada.</div>}
    </>
  );
}
