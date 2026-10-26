export type BookCategory =
  | 'Mangás e HQs'
  | 'Fantasia e Aventura'
  | 'Romance'
  | 'Suspense e Mistério'
  | 'Literatura Clássica'
  | 'Literatura Infantil'
  | 'Ciências e Didáticos';

export type BookStatus = 'disponivel' | 'emprestado' | 'reservado' | 'em_transito';

export interface Book {
  id: string;
  isbn: string;
  titulo: string;
  autor: string;
  categoria: BookCategory;
  ano: number;
  edicao: string;
  localizacao: string;
  totalExemplares: number;
  disponiveis: number;
  status: BookStatus;
  indicacaoFaixaEtaria?: string;
  capaUrl?: string;
  descricao: string;
  sinopseDetalhada?: string;
  curiosidades?: string;
  dataPrevistaChegada?: string;
}

export interface Student {
  id: string;
  nome: string;
  matricula: string;
  curso: string;
  email: string;
  telefone: string;
  livrosAtivos: number;
  limiteEmprestimos: number;
  statusConta: 'regular' | 'bloqueado_atraso';
  dataCadastro: string;
  totalHistoricoEmprestimos: number;
}

export interface Loan {
  id: string;
  livroId: string;
  livroTitulo: string;
  livroIsbn: string;
  alunoId: string;
  alunoNome: string;
  alunoMatricula: string;
  alunoEmail: string;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao?: string;
  status: 'ativo' | 'atrasado' | 'devolvido';
  diasAtraso?: number;
  notificacaoEnviada?: boolean;
  observacoes?: string;
}

export interface Reservation {
  id: string;
  livroId: string;
  livroTitulo: string;
  livroIsbn?: string;
  livroCapaUrl?: string;
  alunoId: string;
  alunoNome: string;
  alunoMatricula: string;
  alunoCurso?: string;
  dataReserva: string;
  validadeReserva: string;
  status: 'ativa' | 'retirada' | 'cancelada';
  tipo: 'retirada_imediata' | 'fila_espera';
  avisadoPronto?: boolean;
}

export interface InterlibraryRequest {
  id: string;
  tipo: 'interbibliotecas' | 'nova_aquisicao';
  titulo: string;
  autor: string;
  origemUnidade: string;
  quantidade: number;
  dataSolicitacao: string;
  previsaoChegada: string;
  status: 'solicitado' | 'em_transito' | 'entregue';
  solicitante: string;
  observacao?: string;
}

export type AuthUser =
  | {
      role: 'student';
      student: Student;
    }
  | {
      role: 'librarian';
      name: string;
      cargo: string;
      email: string;
    }
  | null;
