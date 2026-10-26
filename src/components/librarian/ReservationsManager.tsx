import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Reservation } from '../../types/library';
import { BookCover } from '../common/BookCover';
import { CancelReservationModal } from '../modals/CancelReservationModal';
import { 
  Bookmark, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Send, 
  BookCheck, 
  Inbox
} from 'lucide-react';

export const ReservationsManager: React.FC = () => {
  const { 
    reservations, 
    books, 
    students, 
    fulfillReservation, 
    cancelReservation, 
    notifyReservationReady 
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativa' | 'retirada' | 'cancelada'>('ativa');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'retirada_imediata' | 'fila_espera'>('todos');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);

  const activeReservations = reservations.filter((r) => r.status === 'ativa');
  const readyAtDesk = activeReservations.filter((r) => r.tipo === 'retirada_imediata');
  const waitingList = activeReservations.filter((r) => r.tipo === 'fila_espera');
  const fulfilledCount = reservations.filter((r) => r.status === 'retirada').length;

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.livroTitulo.toLowerCase().includes(search.toLowerCase()) ||
      res.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
      res.alunoMatricula.toLowerCase().includes(search.toLowerCase()) ||
      (res.alunoCurso && res.alunoCurso.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || res.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || res.tipo === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const handleFulfill = (res: Reservation) => {
    const result = fulfillReservation(res.id, 14);
    if (result.success) {
      setActionFeedback(`Sucesso! Exemplar de "${res.livroTitulo}" entregue a ${res.alunoNome}. Empréstimo registrado.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      setActionFeedback(`Aviso: ${result.message}`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleCancelClick = (res: Reservation) => {
    setReservationToCancel(res);
  };

  const handleConfirmCancelReservation = (reservationId: string) => {
    const result = cancelReservation(reservationId);
    setReservationToCancel(null);
    setActionFeedback(result.message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleNotify = (res: Reservation) => {
    notifyReservationReady(res.id);
    setActionFeedback(`Notificação enviada para ${res.alunoNome} (${res.alunoMatricula}) avisando que o livro está pronto no balcão!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const getDaysRemaining = (validadeStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validade = new Date(validadeStr);
    validade.setHours(0, 0, 0, 0);
    const diffTime = validade.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <p className="text-xs font-medium text-[#FF7A59] mb-1">Balcão de Atendimento</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Fila de Reservas dos Leitores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe pedidos feitos pelo Portal do Aluno, separe exemplares e efetive o empréstimo na entrega.
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs text-slate-400 block">Reservas Ativas</span>
          <span className="text-2xl font-bold text-[#FF6B47] font-mono tabular-nums">
            {activeReservations.length}
          </span>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-100 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Interactive Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => { setStatusFilter('ativa'); setTipoFilter('todos'); }}
          className={`p-4 text-left rounded-2xl border transition-colors cursor-pointer ${
            statusFilter === 'ativa' && tipoFilter === 'todos'
              ? 'bg-[#1A1514] border-[#FF5C35]'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Reservas Ativas</span>
            <Bookmark className="w-4 h-4 text-[#FF6B47]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {activeReservations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Aguardando atendimento
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ativa'); setTipoFilter('retirada_imediata'); }}
          className={`p-4 text-left rounded-2xl border transition-colors cursor-pointer ${
            statusFilter === 'ativa' && tipoFilter === 'retirada_imediata'
              ? 'bg-emerald-950/30 border-emerald-500/60'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Prontos no Balcão</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {readyAtDesk.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Separados para retirada
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ativa'); setTipoFilter('fila_espera'); }}
          className={`p-4 text-left rounded-2xl border transition-colors cursor-pointer ${
            statusFilter === 'ativa' && tipoFilter === 'fila_espera'
              ? 'bg-sky-950/30 border-sky-500/60'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
            <span>Fila de Espera</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-400 font-mono tabular-nums">
            {waitingList.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Aguardando devolução
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('retirada'); setTipoFilter('todos'); }}
          className={`p-4 text-left rounded-2xl border transition-colors cursor-pointer ${
            statusFilter === 'retirada'
              ? 'bg-[#1C2232] border-white/30'
              : 'bg-[#121620] border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concluídas</span>
            <BookCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {fulfilledCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Entregues com sucesso
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por leitor, matrícula, turma ou título do livro..."
            className="w-full text-sm pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativa' | 'retirada' | 'cancelada')}
          className="text-xs border border-white/10 rounded-xl px-4 py-2.5 bg-[#121620] text-slate-200 focus:outline-none focus:border-[#FF5C35] cursor-pointer"
        >
          <option value="todos">Todos os Status</option>
          <option value="ativa">Somente Ativas</option>
          <option value="retirada">Retiradas (Concluídas)</option>
          <option value="cancelada">Canceladas</option>
        </select>

        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as 'todos' | 'retirada_imediata' | 'fila_espera')}
          className="text-xs border border-white/10 rounded-xl px-4 py-2.5 bg-[#121620] text-slate-200 focus:outline-none focus:border-[#FF5C35] cursor-pointer"
        >
          <option value="todos">Todos os Tipos</option>
          <option value="retirada_imediata">Prontos no Balcão</option>
          <option value="fila_espera">Fila de Espera</option>
        </select>
      </div>

      {/* Reservation List */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-[#121620] rounded-2xl border border-white/[0.08] p-8">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-white">Nenhuma reserva encontrada</h3>
          <p className="text-xs text-slate-400 mt-1">
            Quando os leitores reservarem exemplares pelo Portal, os pedidos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => {
            const book = books.find((b) => b.id === res.livroId);
            const student = students.find((s) => s.id === res.alunoId);
            const daysRemaining = getDaysRemaining(res.validadeReserva);
            const isExpired = daysRemaining < 0;

            return (
              <div
                key={res.id}
                className="bg-[#121620] rounded-2xl border border-white/[0.08] hover:border-white/20 p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-22 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-[#0B0E14]">
                    {book ? (
                      <BookCover book={book} showAgeBadge={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        Livro
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <h3 className="font-display text-base font-bold text-white">
                        {res.livroTitulo}
                      </h3>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      {res.status === 'ativa' && (
                        res.tipo === 'fila_espera' ? (
                          <span className="text-sky-400 font-medium">Fila de Espera</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Pronto no Balcão</span>
                        )
                      )}
                      {res.status === 'retirada' && (
                        <span className="text-slate-400 font-medium">Entregue ao Leitor</span>
                      )}
                      {res.status === 'cancelada' && (
                        <span className="text-rose-400 font-medium">Cancelada</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span>{book?.autor || 'Acervo'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{book?.localizacao || 'Balcão'}</span>
                    </div>

                    <div className="pt-1 text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-white">{res.alunoNome}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono tabular-nums text-slate-400">Matrícula {res.alunoMatricula}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">{res.alunoCurso || student?.curso || 'Ensino Médio'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums pt-1">
                      <span>Reservado em {res.dataReserva}</span>
                      <span aria-hidden="true">·</span>
                      <span>Validade {res.validadeReserva}</span>
                      {res.status === 'ativa' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                            {isExpired ? 'Prazo expirado' : `${daysRemaining}d restantes`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Librarian Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 border-t border-white/[0.06] lg:border-t-0 pt-3 lg:pt-0">
                  {res.status === 'ativa' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleFulfill(res)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <BookCheck className="w-4 h-4" />
                        <span>Efetivar Entrega</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNotify(res)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#181D2A] hover:bg-[#22293A] border border-white/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-400" />
                        <span>Avisar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelClick(res)}
                        className="px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}

                  {res.status === 'retirada' && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Empréstimo Ativo</span>
                    </span>
                  )}

                  {res.status === 'cancelada' && (
                    <span className="text-xs text-slate-500">
                      Reserva encerrada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CancelReservationModal
        isOpen={reservationToCancel !== null}
        onClose={() => setReservationToCancel(null)}
        reservation={reservationToCancel}
        book={books.find((b) => b.id === reservationToCancel?.livroId)}
        onConfirm={handleConfirmCancelReservation}
      />
    </div>
  );
};
