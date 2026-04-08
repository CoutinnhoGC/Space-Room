import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, MapPin, Users, Edit2, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { getTipoEspacoLabel } from "../lib/formatters";
import { createNotification } from "../lib/notifications";
import { getCurrentUser } from "../lib/session";
import { espacoService } from "../services/espacoService";
import { instituicaoService } from "../services/instituicaoService";
import type { Espaco, Instituicao, TipoEspaco } from "../types/api";

const tipos: TipoEspaco[] = ["SALA", "LABORATORIO", "AUDITORIO", "BIBLIOTECA", "COWORKING", "SALA_REUNIAO", "OUTRO"];
const emptyForm = {
  idEspaco: "",
  nome: "",
  descricao: "",
  tipo: "SALA" as TipoEspaco,
  capacidade: "",
  localizacao: "",
  idInstituicao: "",
  ativo: true,
};

export function EspacosPage() {
  const currentUser = getCurrentUser();
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
      setEspacos(espacosData);
      setInstituicoes(instituicoesData);
      setForm((current) => ({ ...current, idInstituicao: current.idInstituicao || String(instituicoesData[0]?.idInstituicao ?? "") }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar espacos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return espacos.filter((space) => {
      const text = `${space.nome} ${space.localizacao ?? ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = tipoFiltro === "TODOS" || space.tipo === tipoFiltro;
      return matchesSearch && matchesType;
    });
  }, [espacos, search, tipoFiltro]);

  const resetForm = () => {
    setForm({ ...emptyForm, idInstituicao: String(instituicoes[0]?.idInstituicao ?? "") });
    setShowForm(false);
  };

  const handleEdit = (space: Espaco) => {
    setForm({
      idEspaco: String(space.idEspaco ?? ""),
      nome: space.nome,
      descricao: space.descricao ?? "",
      tipo: space.tipo,
      capacidade: String(space.capacidade),
      localizacao: space.localizacao ?? "",
      idInstituicao: String(space.idInstituicao),
      ativo: space.ativo !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (idEspaco?: number) => {
    if (!idEspaco) {
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

    try {
      setSaving(true);
      const payload: Espaco = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        capacidade: Number(form.capacidade),
        localizacao: form.localizacao.trim(),
        idInstituicao: Number(form.idInstituicao),
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
        toast.success("Espaco criado com sucesso.");
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Espacos</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie todos os espacos cadastrados</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm({ ...emptyForm, idInstituicao: String(instituicoes[0]?.idInstituicao ?? "") }); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Adicionar Espaco
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{form.idEspaco ? "Editar espaco" : "Novo espaco"}</h2>
            <button onClick={resetForm} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome do espaco" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as TipoEspaco }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}
            </select>
            <input value={form.capacidade} onChange={(event) => setForm((current) => ({ ...current, capacidade: event.target.value }))} placeholder="Capacidade" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <input value={form.localizacao} onChange={(event) => setForm((current) => ({ ...current, localizacao: event.target.value }))} placeholder="Localizacao" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <select value={form.idInstituicao} onChange={(event) => setForm((current) => ({ ...current, idInstituicao: event.target.value }))} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {instituicoes.map((instituicao) => <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>{instituicao.nomeFantasia}</option>)}
            </select>
            <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))} />
              Espaco ativo
            </label>
            <textarea value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} placeholder="Descricao" rows={4} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg md:col-span-2" />
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-70"><Save className="w-4 h-4" />{saving ? "Salvando..." : "Salvar"}</button>
              <button type="button" onClick={resetForm} className="px-5 py-3 border border-gray-200 rounded-lg text-gray-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Buscar espacos..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="TODOS">Todos os tipos</option>
            {tipos.map((tipo) => <option key={tipo} value={tipo}>{getTipoEspacoLabel(tipo)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filtered.map((space) => (
          <div key={space.idEspaco} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{space.nome}</h3>
                  <p className="text-xs text-gray-500">{getTipoEspacoLabel(space.tipo)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600"><div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{space.capacidade} pessoas</span></div></div>
            <div className="text-xs text-gray-500 mb-3">{space.localizacao || "Localizacao nao informada"}</div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${space.ativo === false ? "bg-gray-50 text-gray-700" : "bg-green-50 text-green-700"}`}>{space.ativo === false ? "Inativo" : "Ativo"}</span>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(space)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(space.idEspaco)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="text-sm text-gray-500">Carregando espacos...</div>}
      {!loading && filtered.length === 0 && <div className="text-sm text-gray-500">Nenhum espaco encontrado.</div>}
    </>
  );
}
