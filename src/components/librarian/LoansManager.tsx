import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Clock, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Send,
  BookCheck
} from 'lucide-react';

interface LoansManagerProps {
  onOpenNewLoan: () => void;
}

export const LoansManager: React.FC<LoansManagerProps> = ({ onOpenNewLoan }) => {
  const { loans, returnBook, sendOverdueNotice } = useLibrary();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'atrasado' | 'devolvido'>('todos');

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.livroTitulo.toLowerCase().includes(search.toLowerCase()) ||
      loan.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
      loan.alunoMatricula.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Circulação & Empréstimos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro de retiradas recentes, prazos previstos e confirmações de devolução.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewLoan}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors duration-150 flex items-center gap-2 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <BookCheck className="w-4 h-4" />
          <span>Registrar Empréstimo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por leitor, matrícula ou título do livro..."
            className="w-full text-sm pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
          {(['todos', 'ativo', 'atrasado', 'devolvido'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-[#1E2536] text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'todos' ? 'Todos' : st === 'ativo' ? 'Em Andamento' : st === 'atrasado' ? 'Em Atraso' : 'Devolvidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-[#121620] rounded-2xl border border-white/[0.08] overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-14 p-6">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Nenhum registro encontrado</p>
            <p className="text-xs text-slate-500 mt-1">Não há empréstimos com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E121B] border-b border-white/[0.08] text-slate-400 font-medium">
                <tr>
                  <th className="px-5 py-3.5">Livro / Obra</th>
                  <th className="px-5 py-3.5">Leitor & Matrícula</th>
                  <th className="px-5 py-3.5">Retirada</th>
                  <th className="px-5 py-3.5">Prazo Previsto</th>
                  <th className="px-5 py-3.5">Situação</th>
                  <th className="px-5 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {filteredLoans.map((loan) => {
                  const isOverdue = loan.status === 'atrasado';
                  const isReturned = loan.status === 'devolvido';

                  return (
                    <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{loan.livroTitulo}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          ISBN {loan.livroIsbn}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{loan.alunoNome}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {loan.alunoMatricula} · {loan.alunoEmail}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums text-slate-400">
                        {loan.dataEmprestimo}
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : isReturned ? 'text-slate-500' : 'text-slate-200'}>
                          {loan.dataPrevistaDevolucao}
                        </span>
                        {isOverdue && (
                          <div className="text-[11px] text-rose-400 font-medium">
                            +{loan.diasAtraso || 1} dias de atraso
                          </div>
                        )}
                        {isReturned && loan.dataDevolucao && (
                          <div className="text-[11px] text-emerald-400">
                            Entregue em {loan.dataDevolucao}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isReturned ? (
                          <span className="text-emerald-400 font-medium inline-flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Devolvido</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="text-rose-400 font-medium inline-flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Em Atraso</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Em Aberto</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isReturned ? (
                          <div className="flex items-center justify-end gap-2">
                            {isOverdue && (
                              <button
                                type="button"
                                onClick={() => sendOverdueNotice(loan.id)}
                                disabled={loan.notificacaoEnviada}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                  loan.notificacaoEnviada
                                    ? 'bg-white/[0.04] text-slate-500 border-white/10'
                                    : 'bg-rose-950/50 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
                                }`}
                              >
                                <Send className="w-3 h-3" />
                                <span>{loan.notificacaoEnviada ? 'Notificado' : 'Cobrar'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => returnBook(loan.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#181D2A] hover:bg-[#232A3C] border border-white/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Registrar Devolução
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Concluído</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
