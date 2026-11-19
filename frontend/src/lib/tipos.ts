export type Perfil = "ALUNO" | "MOTORISTA" | "ADMIN";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export type TipoVeiculo = "ONIBUS" | "VAN";

export interface Veiculo {
  id: number;
  nome: string;
  placa: string;
  tipo: TipoVeiculo;
  capacidade: number;
}

export interface Parada {
  id: number;
  ordem: number;
  nome: string;
  descricao: string | null;
  latitude: number;
  longitude: number;
  minutosDesdeSaida: number;
}

export interface HorarioLinha {
  id: number;
  horaSaida: string;
  localSaida: string | null;
  veiculo: Veiculo | null;
}

export interface Linha {
  id: number;
  nome: string;
  origem: string;
  destino: string;
  paradas: Parada[];
  horarios: HorarioLinha[];
}

export type StatusViagem = "AGENDADA" | "EM_ANDAMENTO" | "PAUSADA" | "ENCERRADA";

export interface Viagem {
  id: number;
  linhaId: number;
  linha: string;
  origem: string;
  destino: string;
  horaSaida: string;
  localSaida: string | null;
  data: string;
  status: StatusViagem;
  veiculo: Veiculo | null;
  motorista: string | null;
  latitude: number | null;
  longitude: number | null;
  velocidadeKmh: number | null;
  posicaoAtualizadaEm: string | null;
  lotacao: number;
  capacidade: number;
  naFila: number;
  atrasoMinutos: number;
  motivoAtraso: string | null;
  minutosParaSaida: number | null;
  saidaLiberadaEm: string | null;
}

export type StatusFila = "AGUARDANDO" | "CHAMADO" | "EMBARCADO" | "SAIU" | "EXPIRADO";

export interface FilaStatus {
  entradaId: number;
  status: StatusFila;
  posicao: number | null;
  alunosAFrente: number;
  totalNaFila: number;
  paradaId: number;
  parada: string;
  minutosAteVeiculo: number | null;
  cabeNoVeiculo: boolean;
  prazoEmbarque: string | null;
  viagem: Viagem;
}

export interface EntradaFila {
  id: number;
  nome: string;
  iniciais: string;
  parada: string;
  status: StatusFila;
  entrouEm: string;
  embarcadoEm: string | null;
}

export type TipoNotificacao =
  | "VIAGEM_INICIADA"
  | "CHEGANDO"
  | "ATRASO"
  | "VIAGEM_ENCERRADA"
  | "SUA_VEZ"
  | "EMBARQUE_CONFIRMADO"
  | "FILA_EXPIRADA";

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  criadaEm: string;
  geral: boolean;
}

export interface ResumoAdmin {
  veiculosAtivos: number;
  viagensHoje: number;
  viagensEmAndamento: number;
  solicitacoesHoje: number;
  embarquesHoje: number;
}

// ----- gestão (painel da administração)

export interface VeiculoAdmin extends Veiculo {
  ativo: boolean;
}

export interface HorarioAdmin extends HorarioLinha {
  ativo: boolean;
}

export interface LinhaAdmin {
  id: number;
  nome: string;
  origem: string;
  destino: string;
  paradas: Parada[];
  horarios: HorarioAdmin[];
}

export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface DemandaHorario {
  horarioId: number;
  linha: string;
  horaSaida: string;
  viagensNoPeriodo: number;
  mediaSolicitacoes: number;
  mediaEmbarques: number;
  taxaComparecimento: number;
  veiculoEscalado: string;
  capacidadeEscalada: number;
  ocupacaoMedia: number;
  indicacao: string;
}
