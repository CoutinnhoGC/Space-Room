import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, MapPin, Users, Edit2, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getTipoInstituicaoLabel } from "../lib/formatters";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import { usuarioService } from "../services/usuarioService";
import type { Espaco, Instituicao, TipoInstituicao, Usuario } from "../types/api";

const tipos: TipoInstituicao[] = ["ESCOLA", "FACULDADE", "UNIVERSIDADE", "SENAI", "EMPRESA", "COWORKING", "OUTRO"];
const emptyForm = {
  idInstituicao: "",
  nomeFantasia: "",
  endereco: "",
  cidade: "",
  estado: "",
  email: "",
  telefone: "",
  responsavel: "",
  tipo: "UNIVERSIDADE" as TipoInstituicao,
  ativo: true,
};

export function InstituicoesPage() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [instituicoesData, usuariosData, espacosData] = await Promise.all([
        instituicaoService.list(),
        usuarioService.list(),
        espacoService.list(),
      ]);
      setInstituicoes(instituicoesData);
      setUsuarios(usuariosData);
      setEspacos(espacosData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar instituicoes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return instituicoes.filter((item) => `${item.nomeFantasia} ${item.cidade ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  }, [instituicoes, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (instituicao: Instituicao) => {
    setForm({
      idInstituicao: String(instituicao.idInstituicao ?? ""),
      nomeFantasia: instituicao.nomeFantasia,
      endereco: instituicao.endereco ?? "",
      cidade: instituicao.cidade ?? "",
      estado: instituicao.estado ?? "",
      email: instituicao.email ?? "",
      telefone: instituicao.telefone ?? "",
      responsavel: instituicao.responsavel ?? "",
      tipo: instituicao.tipo,
      ativo: instituicao.ativo !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (idInstituicao?: number) => {
    if (!idInstituicao) {
      return;
    }

    try {
      await instituicaoService.remove(idInstituicao);
      toast.success("Instituicao removida com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a instituicao.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.nomeFantasia.trim()) {
      toast.error("Nome da instituicao e obrigatorio.");
      return;
    }

    try {
      setSaving(true);
      const payload: Instituicao = {
        nomeFantasia: form.nomeFantasia.trim(),
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        responsavel: form.responsavel.trim(),
        tipo: form.tipo,
        ativo: form.ativo,
        vitrineHabilitada: false,
      };

      if (form.idInstituicao) {
        await instituicaoService.update(Number(form.idInstituicao), { ...payload, idInstituicao: Number(form.idInstituicao) });
        toast.success("Instituicao atualizada com sucesso.");
      } else {
        await instituicaoService.create(payload);
        toast.success("Instituicao criada com sucesso.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a instituicao.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Instituicoes</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie as instituicoes cadastradas</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm(emptyForm); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Nova Instituicao
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{form.idInstituicao ? "Editar instituicao" : "Nova instituicao"}</h2>
            <button onClick={resetForm} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.nomeFantasia} onChange={(event) => setForm((current) => ({ ...current, nomeFantasia: event.target.value }))} placeholder="Nome fantasia" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as TipoInstituicao }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoInstituicaoLabel(tipo)}</option>)}
            </select>
            <input value={form.endereco} onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))} placeholder="Endereco" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg md:col-span-2" />
            <input value={form.cidade} onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))} placeholder="Cidade" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.estado} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))} placeholder="Estado" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.telefone} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))} placeholder="Telefone" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.responsavel} onChange={(event) => setForm((current) => ({ ...current, responsavel: event.target.value }))} placeholder="Responsavel" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
              Instituicao ativa
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-70"><Save className="w-4 h-4" />{saving ? "Salvando..." : "Salvar"}</button>
              <button type="button" onClick={resetForm} className="px-5 py-3 border border-gray-200 rounded-lg text-gray-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar instituicoes..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filtered.map((institution) => {
          const totalSpaces = espacos.filter((item) => item.idInstituicao === institution.idInstituicao).length;
          const totalUsers = usuarios.filter((item) => item.idInstituicao === institution.idInstituicao).length;
          return (
            <div key={institution.idInstituicao} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{institution.nomeFantasia}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{institution.cidade ?? "Cidade nao informada"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3"><MapPin className="w-4 h-4 text-gray-400" /><span className="truncate">{institution.endereco || "Endereco nao informado"}</span></div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3"><div className="text-2xl font-semibold text-blue-700">{totalSpaces}</div><div className="text-xs text-blue-600 mt-1">Espacos</div></div>
                <div className="bg-purple-50 rounded-lg p-3"><div className="text-2xl font-semibold text-purple-700">{totalUsers}</div><div className="text-xs text-purple-600 mt-1">Usuarios</div></div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleEdit(institution)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><Edit2 className="w-4 h-4" />Gerenciar</button>
                <button onClick={() => handleDelete(institution.idInstituicao)} className="px-3 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {loading && <div className="text-sm text-gray-500">Carregando instituicoes...</div>}
      {!loading && filtered.length === 0 && <div className="text-sm text-gray-500">Nenhuma instituicao encontrada.</div>}
    </>
  );
}
