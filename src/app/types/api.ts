export type TipoInstituicao =
  | "ESCOLA"
  | "FACULDADE"
  | "UNIVERSIDADE"
  | "SENAI"
  | "EMPRESA"
  | "COWORKING"
  | "OUTRO";

export type TipoEspaco =
  | "SALA"
  | "LABORATORIO"
  | "AUDITORIO"
  | "BIBLIOTECA"
  | "COWORKING"
  | "SALA_REUNIAO"
  | "OUTRO";

export type StatusReserva = "PENDENTE" | "CONFIRMADA" | "CANCELADA" | "CONCLUIDA";

export interface Cargo {
  idCargo: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean | null;
}

export interface Instituicao {
  idInstituicao?: number;
  idPlano?: number | null;
  nomeFantasia: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  responsavel?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  tipo: TipoInstituicao;
  vitrineHabilitada?: boolean | null;
  ativo?: boolean | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Usuario {
  idUsuario?: number;
  idInstituicao: number;
  idCargo: number;
  nome: string;
  email: string;
  senhaHash?: string | null;
  primeiroAcesso?: boolean | null;
  tokenDefinicaoSenha?: string | null;
  tokenExpiracao?: string | null;
  ultimoLoginEm?: string | null;
  ativo?: boolean | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Espaco {
  idEspaco?: number;
  idInstituicao: number;
  nome: string;
  descricao?: string | null;
  tipo: TipoEspaco;
  localizacao?: string | null;
  capacidade: number;
  recursosFixos?: string | null;
  imagemUrl?: string | null;
  ativo?: boolean | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Reserva {
  idReserva?: number;
  idInstituicao: number;
  idUsuario: number;
  idEspaco: number;
  titulo: string;
  finalidade?: string | null;
  dataInicio: string;
  dataFim: string;
  status?: StatusReserva | null;
  observacao?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ApiProblem {
  title?: string;
  detail?: string;
  status?: number;
}

export interface DashboardMetrics {
  totalReservasHoje: number;
  espacosOcupadosAgora: number;
  reservasPendentes: number;
  taxaOcupacao: number;
  espacosDisponiveis: number;
  usuariosAtivos: number;
  totalEspacos: number;
  totalInstituicoes: number;
}
