import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Truck, 
  UserPlus, 
  Plus, 
  ArrowRight,
  BookCheck,
  Send,
  Bookmark,
  Inbox
} from 'lucide-react';
import { BookCover } from '../common/BookCover';

interface LibrarianDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewLoan: () => void;
  onOpenNewBook: () => void;
  onOpenInterlibrary: () => void;
  onOpenNewStudent: () => void;
}

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({
  onNavigateTab,
  onOpenNewLoan,
  onOpenNewBook,
  onOpenInterlibrary,
  onOpenNewStudent,
}) => {
  const { 
    totalLivrosAcervo, 
    totalExemplaresFisicos, 
    totalDisponiveis, 
    totalEmprestados, 
    totalAtrasados, 
    totalChegandoEmBreve,
    totalReservasAtivas,
    books,
    loans,
    reservations,
    requests,
    returnBook,
    sendOverdueNotice,
    fulfillReservation,
    cancelReservation
  } = useLibrary();

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const recentLoans = loans.slice(0, 5);
  const overdueLoans = loans.filter((l) => l.status === 'atrasado');
  const activeReservations = reservations.filter((r) => r.status === 'ativa');

  const handleDeliverReservedBook = (resId: string, livroTitulo: string, alunoNome: string) => {
    const res = fulfillReservation(resId, 14);
    if (res.success) {
      setToastMessage(`Exemplar de "${livroTitulo}" entregue a ${alunoNome}! Empréstimo registrado com sucesso.`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(`Atenção: ${res.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleCancelReservedBook = (resId: string) => {
    const res = cancelReservation(resId);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-10">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-white/[0.08]">
        <div>
          <p className="text-xs font-medium text-[#FF7A59] mb-1">Gestão Integrada</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Painel da Biblioteca
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Controle em tempo real de inventário, circulação de exemplares, fila de reservas e remessas entre unidades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewLoan}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookCheck className="w-4 h-4" />
            <span>Novo Empréstimo</span>
          </button>
          <button
            type="button"
            onClick={onOpenInterlibrary}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#121620] hover:bg-[#1B2130] border border-white/10 rounded-xl transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Pedir de Outro Lugar</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewBook}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#121620] hover:bg-[#1B2130] border border-white/10 rounded-xl transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Novo Livro</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewStudent}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#121620] hover:bg-[#1B2130] border border-white/10 rounded-xl transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-400" />
            <span>Cadastrar Leitor</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-100 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('acervo')}
          className="p-4 text-left bg-[#121620] rounded-2xl border border-white/[0.08] hover:border-white/20 transition-colors duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Títulos</span>
            <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white font-mono tabular-nums">
            {totalLivrosAcervo}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            {totalExemplaresFisicos} exemplares
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('acervo')}
          className="p-4 text-left bg-[#121620] rounded-2xl border border-white/[0.08] hover:border-white/20 transition-colors duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Disponíveis</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {totalDisponiveis}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Prontos p/ retirada
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('emprestimos')}
          className="p-4 text-left bg-[#121620] rounded-2xl border border-white/[0.08] hover:border-white/20 transition-colors duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Empréstimos</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white font-mono tabular-nums">
            {totalEmprestados}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Em circulação
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reservas')}
          className={`p-4 text-left rounded-2xl border transition-colors duration-150 cursor-pointer group ${
            totalReservasAtivas > 0
              ? 'bg-[#1A1514] border-[#FF5C35]/40 hover:border-[#FF5C35]'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[#FF7A59] text-xs font-medium">
            <span>Reservas</span>
            <Bookmark className="w-4 h-4 text-[#FF6B47]" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white font-mono tabular-nums">
            {totalReservasAtivas}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {totalReservasAtivas > 0 ? 'Aguardando balcão' : 'Sem reservas'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('atrasos')}
          className={`p-4 text-left rounded-2xl border transition-colors duration-150 cursor-pointer group ${
            totalAtrasados > 0
              ? 'bg-rose-950/25 border-rose-500/30 hover:border-rose-400/60'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Em Atraso</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {totalAtrasados}
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80">
            {totalAtrasados > 0 ? 'Exige cobrança' : 'Tudo em dia'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('remessas')}
          className="p-4 text-left bg-[#121620] rounded-2xl border border-white/[0.08] hover:border-white/20 transition-colors duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Chegando</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white font-mono tabular-nums">
            {totalChegandoEmBreve}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            {requests.filter(r => r.status !== 'entregue').length} remessa(s)
          </div>
        </button>
      </div>

      {/* Section: Fila de Reservas Aguardando no Balcão */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#FF6B47]" />
            <h2 className="font-display text-lg font-bold text-white">
              Fila de Reservas no Balcão ({activeReservations.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('reservas')}
            className="text-xs font-semibold text-[#FF7A59] hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Ver fila completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeReservations.length === 0 ? (
          <div className="text-center py-10 bg-[#121620] rounded-2xl border border-white/[0.08] p-6">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">Nenhuma reserva pendente no momento</p>
            <p className="text-xs text-slate-500 mt-1">Os pedidos feitos no Portal do Aluno aparecem instantaneamente aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeReservations.slice(0, 6).map((res) => {
              const book = books.find((b) => b.id === res.livroId);
              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-white/[0.08] bg-[#121620] hover:border-white/20 transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-[#0B0E14]">
                      {book && <BookCover book={book} showAgeBadge={false} />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className={`text-[11px] font-medium block ${res.tipo === 'fila_espera' ? 'text-sky-400' : 'text-emerald-400'}`}>
                        {res.tipo === 'fila_espera' ? 'Fila de Espera' : 'Separado no Balcão'}
                      </span>
                      <h4 className="font-display text-sm font-bold text-white leading-snug line-clamp-1">
                        {res.livroTitulo}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-1">
                        {res.alunoNome}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                        {res.alunoMatricula} · {res.alunoCurso || 'Ensino Médio'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Até {res.validadeReserva}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelReservedBook(res.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 border border-rose-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeliverReservedBook(res.id, res.livroTitulo, res.alunoNome)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <BookCheck className="w-3.5 h-3.5" />
                        <span>Entregar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Grid: Overdue Alerts & Recent Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Overdue Items */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Atrasos Críticos</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('atrasos')}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#121620] rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
            {overdueLoans.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Tudo em dia!</p>
                <p className="text-xs text-slate-500 mt-0.5">Nenhum exemplar atrasado no momento.</p>
              </div>
            ) : (
              overdueLoans.map((loan) => (
                <div key={loan.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-display text-sm font-bold text-white">
                        {loan.livroTitulo}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {loan.alunoNome} · <span className="font-mono tabular-nums">{loan.alunoMatricula}</span>
                      </p>
                      <div className="text-xs text-rose-400 font-mono tabular-nums flex items-center gap-1.5 pt-1">
                        <span>Venceu {loan.dataPrevistaDevolucao}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold">{loan.diasAtraso || 1}d atraso</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => returnBook(loan.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/70 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Devolver
                      </button>
                      <button
                        type="button"
                        onClick={() => sendOverdueNotice(loan.id)}
                        disabled={loan.notificacaoEnviada}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                          loan.notificacaoEnviada
                            ? 'bg-white/[0.04] text-slate-500 border-white/10'
                            : 'bg-rose-950/50 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{loan.notificacaoEnviada ? 'Notificado' : 'Cobrar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Recent Loans */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Últimas Retiradas</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('emprestimos')}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Histórico completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#121620] rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E121B] border-b border-white/[0.08] text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3.5">Obra</th>
                    <th className="px-4 py-3.5">Leitor</th>
                    <th className="px-4 py-3.5">Retirada</th>
                    <th className="px-4 py-3.5">Devolução</th>
                    <th className="px-4 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{loan.livroTitulo}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {loan.livroIsbn}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200">{loan.alunoNome}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {loan.alunoMatricula}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-400">
                        {loan.dataEmprestimo}
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums">
                        <span
                          className={
                            loan.status === 'atrasado'
                              ? 'text-rose-400 font-semibold'
                              : loan.status === 'devolvido'
                              ? 'text-slate-500 line-through'
                              : 'text-slate-300'
                          }
                        >
                          {loan.dataPrevistaDevolucao}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {loan.status !== 'devolvido' ? (
                          <button
                            type="button"
                            onClick={() => returnBook(loan.id)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#181D2A] hover:bg-[#232A3C] border border-white/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Devolver
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">
                            Devolvido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Incoming Shipments Strip */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-sky-400" />
            <h3 className="font-display text-lg font-bold text-white">
              Chegadas & Pedidos Interbibliotecas
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('remessas')}
            className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Gerenciar remessas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {requests.slice(0, 3).map((req) => (
            <div key={req.id} className="p-4 rounded-2xl border border-white/[0.08] bg-[#121620] space-y-2">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>{req.tipo === 'interbibliotecas' ? 'Interbibliotecas' : 'Nova Aquisição'}</span>
                <span className="font-mono tabular-nums text-sky-400 font-medium">
                  {req.previsaoChegada}
                </span>
              </div>
              <div className="font-display text-base font-bold text-white">{req.titulo}</div>
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                {req.quantidade} exemplares · <span className="font-sans">{req.origemUnidade}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
