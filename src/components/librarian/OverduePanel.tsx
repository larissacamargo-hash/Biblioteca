import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  AlertTriangle,
  Send,
  CheckCircle,
  Mail,
  Search,
  X,
} from 'lucide-react';

export const OverduePanel: React.FC = () => {
  const { loans, returnBook, sendOverdueNotice } = useLibrary();
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const overdueLoans = loans.filter((l) => l.status === 'atrasado');

  const filteredOverdues = overdueLoans.filter(
    (l) =>
      l.livroTitulo.toLowerCase().includes(search.toLowerCase()) ||
      l.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
      l.alunoMatricula.toLowerCase().includes(search.toLowerCase())
  );

  const handleNotify = (loanId: string, alunoNome: string) => {
    sendOverdueNotice(loanId);
    setToastNotice(`Notificação de atraso enviada por e-mail com sucesso para ${alunoNome}!`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleReturn = (loanId: string) => {
    const res = returnBook(loanId);
    if (res.success) {
      setToastNotice(res.message);
      setTimeout(() => setToastNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {toastNotice && (
        <div className="p-4 bg-[#181D2A] border border-emerald-500/30 text-slate-100 text-xs rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Painel de Inadimplência & Devoluções em Atraso
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Acompanhamento detalhado de quem não devolveu livros no prazo estipulado, com envio de avisos e registro de baixa.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#121620] rounded-2xl border border-rose-500/30">
          <div className="text-xs font-medium text-rose-300">
            Livros Não Devolvidos
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
            {overdueLoans.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Exemplares fora do prazo
          </div>
        </div>

        <div className="p-5 bg-[#121620] rounded-2xl border border-white/[0.08]">
          <div className="text-xs font-medium text-slate-400">
            Leitores Notificados
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-white font-mono tabular-nums">
            {overdueLoans.filter((l) => l.notificacaoEnviada).length} / {overdueLoans.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Avisos de cobrança disparados
          </div>
        </div>

        <div className="p-5 bg-[#121620] rounded-2xl border border-white/[0.08]">
          <div className="text-xs font-medium text-slate-400">
            Status de Bloqueio
          </div>
          <div className="mt-2 text-base font-bold text-rose-400">
            Contas Suspensas
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Impedidos de fazer novos empréstimos
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar leitor inadimplente ou título..."
          className="w-full text-sm pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors"
        />
      </div>

      {/* Overdue Cards */}
      {filteredOverdues.length === 0 ? (
        <div className="bg-[#121620] rounded-2xl border border-white/[0.08] p-14 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-white">
            Nenhum empréstimo em atraso!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Todos os livros emprestados estão dentro do prazo estipulado de devolução.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOverdues.map((loan) => (
            <div
              key={loan.id}
              className="bg-[#121620] rounded-2xl border border-rose-500/25 p-5 hover:border-rose-500/40 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-rose-400 font-mono tabular-nums">
                      +{loan.diasAtraso || 1} dias de atraso
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      Venceu em <strong className="text-slate-200">{loan.dataPrevistaDevolucao}</strong>
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white leading-snug">
                    {loan.livroTitulo}
                  </h3>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      Leitor: <strong className="text-slate-200">{loan.alunoNome}</strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      Matrícula {loan.alunoMatricula}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {loan.alunoEmail}
                    </span>
                  </div>

                  {loan.observacoes && (
                    <p className="text-xs text-slate-400 italic bg-[#0B0E14] border border-white/[0.06] px-3 py-2 rounded-lg">
                      Notas: {loan.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNotify(loan.id, loan.alunoNome)}
                    disabled={loan.notificacaoEnviada}
                    className={`px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      loan.notificacaoEnviada
                        ? 'bg-white/[0.04] text-slate-500 border-white/10 cursor-not-allowed'
                        : 'bg-rose-950/50 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loan.notificacaoEnviada ? 'Aviso Enviado' : 'Enviar Notificação'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReturn(loan.id)}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Registrar Devolução
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
