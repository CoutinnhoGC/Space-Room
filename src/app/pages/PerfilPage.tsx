import { useEffect, useState } from "react";
import { Building, Calendar, Mail, User } from "lucide-react";
import { formatDate } from "../lib/formatters";
import { getCurrentUser } from "../lib/session";
import { instituicaoService } from "../services/instituicaoService";
import type { Instituicao } from "../types/api";

export function PerfilPage() {
  const currentUser = getCurrentUser();
  const [instituicao, setInstituicao] = useState<Instituicao | null>(null);

  useEffect(() => {
    if (!currentUser?.idInstituicao) {
      setInstituicao(null);
      return;
    }

    instituicaoService.getById(currentUser.idInstituicao).then(setInstituicao).catch(() => setInstituicao(null));
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-slate-500" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-slate-300">Usuário não encontrado</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-medium text-white">
            {currentUser.nome.split(" ").map((part) => part[0]).join("").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{currentUser.nome}</h1>
            <p className="text-gray-600 dark:text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Nome</p>
                <p className="font-medium dark:text-slate-100">{currentUser.nome}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">E-mail</p>
                <p className="font-medium dark:text-slate-100">{currentUser.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Instituição</p>
                <p className="font-medium dark:text-slate-100">{instituicao?.nomeFantasia ?? "Não informada"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Último login</p>
                <p className="font-medium dark:text-slate-100">{currentUser.ultimoLoginEm ? formatDate(currentUser.ultimoLoginEm) : "Nunca"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${currentUser.ativo ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${currentUser.ativo ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
              {currentUser.ativo ? "Conta ativa" : "Conta inativa"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">Informações do sistema</h3>
        <p className="text-sm text-blue-700 dark:text-blue-200">Para alterar seus dados, utilize o fluxo administrativo da plataforma.</p>
      </div>
    </div>
  );
}
