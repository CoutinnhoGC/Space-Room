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
export type NotificationType = "RESERVA_CRIADA" | "RESERVA_ATUALIZADA" | "ESPACO_CRIADO";

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
  ultimoLoginEm?: string | null;
  ativo?: boolean | null;
  podeReservar?: boolean | null;
  adminPlataforma?: boolean | null;
  podeGerenciarUsuarios?: boolean | null;
  podeGerenciarEspacos?: boolean | null;
  podeAprovarReservas?: boolean | null;
  podeGerenciarComunicados?: boolean | null;
  podeVisualizarAuditoria?: boolean | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  usuario: Usuario;
}

export interface Espaco {
  idEspaco?: number;
  idInstituicao: number;
  idEspacoPai?: number | null;
  nome: string;
  descricao?: string | null;
  tipo: TipoEspaco;
  localizacao?: string | null;
  capacidade: number;
  recursosFixos?: string | null;
  imagemUrl?: string | null;
  codigoUnidade?: string | null;
  permiteSubespacos?: boolean | null;
  exigeAprovacao?: boolean | null;
  idResponsavelEspaco?: number | null;
  bloqueiaSubespacos?: boolean | null;
  bloqueadoPorSubespacos?: boolean | null;
  hierarchyPath?: string | null;
  hierarchyLevel?: number | null;
  ativo?: boolean | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Reserva {
  idReserva?: number;
  idInstituicao: number;
  idUsuario: number;
  idEspaco: number;
  idSubespaco?: number | null;
  titulo: string;
  finalidade?: string | null;
  dataInicio: string;
  dataFim: string;
  status?: StatusReserva | null;
  observacao?: string | null;
  observacaoAprovacao?: string | null;
  aprovadaPorUsuarioId?: number | null;
  aprovadaEm?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ApiProblem {
  title?: string;
  detail?: string;
  status?: number;
}

export interface PasswordRecoveryResponse {
  message: string;
  deliveryMode: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  institutionId: number;
  title: string;
  description: string;
  entityId?: number;
  actorUserId?: number;
  createdAt: string;
  readByUserIds?: number[];
}

export interface NotificationPreferences {
  novasReservas: boolean;
  alteracoesReserva: boolean;
  novosEspacos: boolean;
}

export interface MuralMessage {
  id: string;
  institutionId: number;
  message: string;
  authorName: string;
  createdAt: string;
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
