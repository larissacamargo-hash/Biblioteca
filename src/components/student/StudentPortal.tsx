import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookCategory, Reservation } from '../../types/library';
import { ReserveModal } from '../modals/ReserveModal';
import { BookDetailModal } from '../modals/BookDetailModal';
import { CancelReservationModal } from '../modals/CancelReservationModal';
import { BookCover } from '../common/BookCover';
import { 
  Search, 
  Bookmark, 
  CheckCircle, 
  Clock, 
  Truck, 
  BookOpen, 
  XCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { 
    books, 
    currentStudent, 
    reservations, 
    loans,
    cancelReservation
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'catalogo' | 'minha_conta'>('catalogo');
  const [reservationsSubTab, setReservationsSubTab] = useState<'ativas' | 'canceladas'>('ativas');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [availabilityFilter, setAvailabilityFilter] = useState<'todos' | 'disponiveis' | 'chegando'>('todos');
  const [heroImgError, setHeroImgError] = useState(false);
  
  // Modals state
  const [selectedBookForReservation, setSelectedBookForReservation] = useState<Book | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<{ reservation: Reservation; book?: Book } | null>(null);
  
  // Feedback banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Student specific data
  const myReservations = reservations.filter(
    (r) => r.alunoId === currentStudent?.id && r.status === 'ativa'
  );
  const myCancelledReservations = reservations.filter(
    (r) => r.alunoId === currentStudent?.id && r.status === 'cancelada'
  );
  const myActiveLoans = loans.filter(
    (l) => l.alunoId === currentStudent?.id && (l.status === 'ativo' || l.status === 'atrasado')
  );
  const myHistoryLoans = loans.filter(
    (l) => l.alunoId === currentStudent?.id && l.status === 'devolvido'
  );

  const categories: (BookCategory | 'todos')[] = [
    'todos',
    'Mangás e HQs',
    'Fantasia e Aventura',
    'Romance',
    'Suspense e Mistério',
    'Literatura Clássica',
    'Literatura Infantil',
    'Ciências e Didáticos',
  ];

  // Filtering books for student view
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.titulo.toLowerCase().includes(search.toLowerCase()) ||
      b.autor.toLowerCase().includes(search.toLowerCase()) ||
      b.categoria.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'todos' || b.categoria === categoryFilter;

    const matchesAvailability =
      availabilityFilter === 'todos' ||
      (availabilityFilter === 'disponiveis' && b.disponiveis > 0) ||
      (availabilityFilter === 'chegando' && b.status === 'em_transito');

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleOpenReserve = (book: Book) => {
    setSelectedBookForReservation(book);
    setIsReserveModalOpen(true);
  };

  const handleRequestCancelByBook = (book: Book) => {
    const targetRes = reservations.find(
      (r) => r.livroId === book.id && r.alunoId === currentStudent?.id && r.status === 'ativa'
    );
    if (targetRes) {
      setReservationToCancel({ reservation: targetRes, book });
    }
  };

  const handleRequestCancelByReservation = (res: Reservation) => {
    const relatedBook = books.find((b) => b.id === res.livroId);
    setReservationToCancel({ reservation: res, book: relatedBook });
  };

  const handleConfirmCancelReservation = (reservationId: string) => {
    const result = cancelReservation(reservationId);
    setReservationToCancel(null);
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  return (
    <div className="space-y-10">
      {/* Feedback Notification Banner */}
      {feedback && (
        <div 
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-opacity duration-150 ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-100' 
              : 'bg-rose-950/60 border-rose-500/30 text-rose-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editorial Split Hero Lounge */}
      <section className="grid grid-cols-1 lg:grid-cols-12 items-stretch rounded-2xl overflow-hidden border border-white/[0.08] bg-[#121620]">
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-[#FF7A59] font-medium">Espaço do Leitor</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Matrícula {currentStudent?.matricula}</span>
              <span aria-hidden="true">·</span>
              <span>{currentStudent?.curso}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
              E aí, {currentStudent?.nome.split(' ')[0]}! O que vamos ler essa semana?
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Toque em qualquer capa para ler a sinopse completa e curiosidades da obra, ou reserve direto pelo celular e passe no balcão só para buscar.
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
              <span><strong className="text-white">{myActiveLoans.length}</strong> livro(s) em mãos</span>
              <span aria-hidden="true">·</span>
              <span><strong className="text-[#FF7A59]">{myReservations.length}</strong> reserva(s) ativa(s)</span>
              <span aria-hidden="true">·</span>
              <span><strong className="text-emerald-400">{books.filter(b => b.disponiveis > 0).length}</strong> obras disponíveis hoje</span>
            </div>

            {/* Primary View Switcher */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#0B0E14] rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('catalogo')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'catalogo'
                    ? 'bg-[#FF5C35] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('minha_conta')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'minha_conta'
                    ? 'bg-[#FF5C35] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Minhas Reservas & Mochila ({myActiveLoans.length + myReservations.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Architectural Lounge Media */}
        <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-[#0E121B]">
          {!heroImgError ? (
            <img
              src="/src/assets/images/modern_youth_library_lounge_1793013070284.jpg"
              alt="Lounge contemporâneo de leitura jovem"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1C2033] to-[#0B0E14] flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#121620] via-[#121620]/25 to-transparent pointer-events-none" />
        </div>
      </section>

      {activeTab === 'catalogo' && (
        <section className="space-y-6">
          {/* Search & Availability Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar título, autor, mangá, fantasia, romance..."
                className="w-full text-sm pl-11 pr-4 py-3 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors"
              />
            </div>

            {/* Availability Segmented Controls */}
            <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
              <button
                type="button"
                onClick={() => setAvailabilityFilter('todos')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  availabilityFilter === 'todos'
                    ? 'bg-[#1E2536] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({books.length})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('disponiveis')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  availabilityFilter === 'disponiveis'
                    ? 'bg-[#1E2536] text-emerald-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Disponíveis ({books.filter(b => b.disponiveis > 0).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('chegando')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  availabilityFilter === 'chegando'
                    ? 'bg-[#1E2536] text-sky-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Chegando ({books.filter(b => b.status === 'em_transito').length})</span>
              </button>
            </div>
          </div>

          {/* Genre Filter Buttons (Clean Typography, Zero Decorative Emoji) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === c
                    ? 'bg-white text-[#0B0E14] font-semibold'
                    : 'bg-[#121620] text-slate-400 border border-white/[0.08] hover:text-white hover:border-white/20'
                }`}
              >
                {c === 'todos' ? 'Todos os Gêneros' : c}
              </button>
            ))}
          </div>

          {/* Book Showcase Grid */}
          {filteredBooks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-white/[0.08] bg-[#121620] p-8 space-y-2">
              <BookOpen className="w-9 h-9 text-slate-600 mx-auto" />
              <h3 className="font-display text-base font-bold text-white">Nenhuma obra encontrada</h3>
              <p className="text-xs text-slate-400">Experimente buscar outro termo ou limpar o filtro de gênero.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const isAvailable = book.disponiveis > 0;
                const isTransit = book.status === 'em_transito';
                const activeReservation = myReservations.find((r) => r.livroId === book.id);
                const alreadyReserved = Boolean(activeReservation);

                return (
                  <article
                    key={book.id}
                    className="bg-[#121620] rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col justify-between hover:border-white/20 hover:-translate-y-0.5 transition-all duration-150 group"
                  >
                    <div>
                      {/* Poster Cover */}
                      <div 
                        onClick={() => setSelectedBookForDetail(book)}
                        className="relative cursor-pointer overflow-hidden"
                        title="Ver sinopse completa e detalhes"
                      >
                        <BookCover book={book} />

                        {/* Hover Quick View Scrim */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white text-xs font-semibold gap-2 z-20">
                          <Eye className="w-4 h-4 text-[#FF6B47]" />
                          <span>Ler Sinopse & Detalhes</span>
                        </div>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="p-4 space-y-2">
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-300 font-medium">{book.categoria}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{book.ano}</span>
                          <span aria-hidden="true">·</span>
                          {isTransit ? (
                            <span className="text-sky-400 font-medium">Chegando</span>
                          ) : isAvailable ? (
                            <span className="text-emerald-400 font-mono tabular-nums font-medium">{book.disponiveis} disp.</span>
                          ) : (
                            <span className="text-rose-400 font-medium">Emprestado</span>
                          )}
                        </div>

                        <h3 
                          onClick={() => setSelectedBookForDetail(book)}
                          className="font-display font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-[#FF7A59] transition-colors duration-150 cursor-pointer"
                        >
                          {book.titulo}
                        </h3>

                        <p className="text-xs text-slate-400 font-medium">
                          {book.autor}
                        </p>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {book.descricao}
                        </p>

                        <div className="pt-2.5 border-t border-white/[0.06] text-[11px] text-slate-400 truncate">
                          {isTransit ? (
                            <span className="text-sky-300">
                              Previsão: <strong className="font-mono tabular-nums">{book.dataPrevistaChegada || 'Em breve'}</strong>
                            </span>
                          ) : (
                            <span>
                              Estante: <strong className="text-slate-300 font-medium">{book.localizacao}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 pt-0 space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBookForDetail(book)}
                        className="w-full py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-[#181D2A] hover:bg-[#202738] rounded-xl border border-white/[0.08] transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#FF6B47]" />
                        <span>Conhecer a História</span>
                      </button>

                      {alreadyReserved ? (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 truncate">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Reserva Ativa</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRequestCancelByBook(book)}
                            className="py-1.5 px-3 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 rounded-lg border border-rose-500/30 transition-colors duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            title="Cancelar minha reserva deste título"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReserve(book)}
                          className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 bg-[#FF5C35] text-white hover:bg-[#FF714E] cursor-pointer whitespace-nowrap"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'Reservar Exemplar' : isTransit ? 'Reservar Lançamento' : 'Entrar na Fila'}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab: My Account, Active Loans & Reservations */}
      {activeTab === 'minha_conta' && (
        <div className="space-y-10">
          {/* Section 1: Active Loans */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/[0.08] pb-3">
              <h2 className="font-display text-xl font-bold text-white">
                Meus Livros em Mãos ({myActiveLoans.length})
              </h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                Limite simultâneo: {currentStudent?.limiteEmprestimos} obras
              </span>
            </div>

            {myActiveLoans.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#121620] p-8 text-center">
                <p className="text-sm text-slate-400">
                  Você não possui nenhum livro retirado no momento. Escolha uma obra no catálogo para reservar.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#121620] divide-y divide-white/[0.06] overflow-hidden">
                {myActiveLoans.map((loan) => (
                  <div key={loan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-white text-base">{loan.livroTitulo}</h4>
                      <div className="text-xs text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-2">
                        <span>ISBN {loan.livroIsbn}</span>
                        <span aria-hidden="true">·</span>
                        <span>Retirado em {loan.dataEmprestimo}</span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-xs text-slate-500">Devolver até</div>
                      <div
                        className={`text-sm font-bold font-mono tabular-nums ${
                          loan.status === 'atrasado' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {loan.dataPrevistaDevolucao}
                        {loan.status === 'atrasado' && ' · Vencido'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Reservations (Active & Cancelled History) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <h2 className="font-display text-xl font-bold text-white">
                Minhas Reservas
              </h2>

              <div className="inline-flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setReservationsSubTab('ativas')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    reservationsSubTab === 'ativas'
                      ? 'bg-[#1E2536] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#FF6B47]" />
                  <span>Ativas ({myReservations.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReservationsSubTab('canceladas')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    reservationsSubTab === 'canceladas'
                      ? 'bg-[#1E2536] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Canceladas ({myCancelledReservations.length})</span>
                </button>
              </div>
            </div>

            {reservationsSubTab === 'ativas' && (
              <>
                {myReservations.length === 0 ? (
                  <div className="text-center py-10 bg-[#121620] rounded-2xl border border-white/[0.08] p-6 space-y-1.5">
                    <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                    <p className="text-sm text-slate-300 font-medium">
                      Nenhuma reserva ativa no momento.
                    </p>
                    <p className="text-xs text-slate-500">
                      Navegue pelo catálogo para separar seu próximo livro no balcão.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {myReservations.map((res) => (
                      <div key={res.id} className="p-5 rounded-2xl border border-white/[0.08] bg-[#121620] flex flex-col justify-between gap-4 hover:border-white/20 transition-colors">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className={res.tipo === 'fila_espera' ? 'text-sky-400 font-medium' : 'text-emerald-400 font-medium'}>
                              {res.tipo === 'fila_espera' ? 'Fila de espera prioritária' : 'Separado no balcão'}
                            </span>
                            <span className="font-mono tabular-nums text-slate-300">
                              Até {res.validadeReserva}
                            </span>
                          </div>
                          
                          <h4 className="font-display font-bold text-white text-lg leading-snug">
                            {res.livroTitulo}
                          </h4>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            {res.tipo === 'fila_espera'
                              ? 'Você está na fila prioritária. Assim que o exemplar retornar, ele ficará separado para você.'
                              : `Exemplar reservado no balcão! Apresente seu nome (${res.alunoNome}) ou matrícula (${res.alunoMatricula}) para retirar.`}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                            Solicitada em {res.dataReserva}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRequestCancelByReservation(res)}
                            className="px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 rounded-xl border border-rose-500/30 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                            title="Cancelar esta reserva"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelar Reserva</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {reservationsSubTab === 'canceladas' && (
              <>
                {myCancelledReservations.length === 0 ? (
                  <div className="text-center py-8 bg-[#121620] rounded-2xl border border-white/[0.08] p-6">
                    <p className="text-xs text-slate-500">
                      Você ainda não possui reservas canceladas no histórico.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#121620] divide-y divide-white/[0.06] overflow-hidden">
                    {myCancelledReservations.map((res) => {
                      const book = books.find((b) => b.id === res.livroId);

                      return (
                        <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <h4 className="font-display font-semibold text-slate-400 line-through">
                                {res.livroTitulo}
                              </h4>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                              <span className="text-xs text-rose-400 font-medium">Cancelada</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono tabular-nums">
                              Solicitada em {res.dataReserva} · Exemplar liberado ao acervo
                            </div>
                          </div>

                          {book && (
                            <button
                              type="button"
                              onClick={() => handleOpenReserve(book)}
                              className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-[#181D2A] hover:bg-[#22293A] rounded-xl border border-white/10 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-[#FF6B47]" />
                              <span>Reservar Novamente</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Section 3: Past Reading History */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white border-b border-white/[0.08] pb-3">
              Livros Já Lidos ({myHistoryLoans.length})
            </h2>
            {myHistoryLoans.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#121620] p-8 text-center">
                <p className="text-xs text-slate-500">
                  Nenhum histórico anterior registrado.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#121620] divide-y divide-white/[0.06] overflow-hidden text-xs">
                {myHistoryLoans.map((l) => (
                  <div key={l.id} className="p-4 px-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-display font-semibold text-slate-200 text-sm">{l.livroTitulo}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        Retirado em {l.dataEmprestimo}
                      </div>
                    </div>
                    <div className="text-emerald-400 font-mono tabular-nums font-medium shrink-0">
                      Devolvido em {l.dataDevolucao}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Book Story & Detail Modal */}
      <BookDetailModal
        isOpen={selectedBookForDetail !== null}
        onClose={() => setSelectedBookForDetail(null)}
        book={selectedBookForDetail}
        onReserveClick={(b) => handleOpenReserve(b)}
        onCancelReservationClick={(b) => handleRequestCancelByBook(b)}
      />

      {/* Reservation Confirmation Modal */}
      <ReserveModal
        isOpen={isReserveModalOpen}
        onClose={() => {
          setIsReserveModalOpen(false);
          setSelectedBookForReservation(null);
        }}
        book={selectedBookForReservation}
      />

      {/* Cancel Reservation Modal */}
      <CancelReservationModal
        isOpen={reservationToCancel !== null}
        onClose={() => setReservationToCancel(null)}
        reservation={reservationToCancel?.reservation || null}
        book={reservationToCancel?.book}
        onConfirm={handleConfirmCancelReservation}
      />
    </div>
  );
};
