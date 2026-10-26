import React from 'react';
import { Book } from '../../types/library';
import { useLibrary } from '../../context/LibraryContext';
import { BookCover } from '../common/BookCover';
import {
  X,
  BookOpen,
  Bookmark,
  MapPin,
  Barcode,
  CheckCircle,
  Clock,
  Truck,
  Sparkles,
  XCircle,
} from 'lucide-react';

interface BookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onReserveClick?: (book: Book) => void;
  onCancelReservationClick?: (book: Book) => void;
  onLoanClick?: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  isOpen,
  onClose,
  book,
  onReserveClick,
  onCancelReservationClick,
  onLoanClick,
}) => {
  const { mode, reservations, currentStudent } = useLibrary();

  if (!isOpen || !book) return null;

  const isAvailable = book.disponiveis > 0;
  const isTransit = book.status === 'em_transito';
  const isAlreadyReserved = reservations.some(
    (r) => r.livroId === book.id && r.alunoId === currentStudent?.id && r.status === 'ativa'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#FF5C35]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Ficha & Sinopse da Obra
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Fechar detalhes do livro"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Top Split: Cover + Title + Primary details */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Book Cover Photo */}
            <div className="w-40 sm:w-48 mx-auto sm:mx-0 shrink-0">
              <div className="relative aspect-3/4 rounded-xl overflow-hidden shadow-xl border border-white/10 bg-[#0B0E14]">
                <BookCover book={book} />
              </div>
            </div>

            {/* Title & Info */}
            <div className="flex-1 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-[#FF5C35]">{book.categoria}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono tabular-nums text-slate-300">{book.ano}</span>
                <span className="text-slate-600">·</span>
                <span>{book.edicao}</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {book.titulo}
              </h2>

              <p className="text-sm text-slate-400">
                Autoria: <span className="text-white font-semibold">{book.autor}</span>
              </p>

              {/* Clean availability line */}
              <div className="pt-1">
                {isTransit ? (
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-400">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>Em Trânsito · Previsão: {book.dataPrevistaChegada || 'Em breve'}</span>
                  </div>
                ) : isAvailable ? (
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="font-mono tabular-nums">
                      {book.disponiveis} de {book.totalExemplares} exemplares disponíveis agora
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-400">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-mono tabular-nums">
                      Todos os {book.totalExemplares} exemplares emprestados no momento
                    </span>
                  </div>
                )}
              </div>

              {/* Location and ISBN metadata */}
              <div className="pt-3 border-t border-white/[0.08] text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Localização no Acervo: <strong className="text-slate-200">{book.localizacao}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-slate-500">
                  <Barcode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>ISBN {book.isbn}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Story Section */}
          <div className="bg-[#0B0E14] rounded-xl p-5 border border-white/[0.08] space-y-2.5">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF5C35]" />
              <span>Sinopse & Universo da Obra</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {book.sinopseDetalhada || book.descricao}
            </p>
          </div>

          {/* Curiosities / Why Read */}
          {book.curiosidades && (
            <div className="bg-[#181D2A] rounded-xl p-4 border border-[#FF5C35]/25 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-[#FF5C35]" />
                <span>Por Que Vale a Pena Ler?</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {book.curiosidades}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-[#0E121B] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
          >
            Voltar
          </button>

          <div className="flex items-center gap-2.5">
            {mode === 'student' ? (
              isAlreadyReserved ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-medium text-emerald-400 inline-flex items-center gap-1.5 mr-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Reserva Ativa</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onCancelReservationClick) onCancelReservationClick(book);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Cancelar Reserva</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onReserveClick) onReserveClick(book);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{isAvailable ? 'Reservar para Retirada no Balcão' : 'Entrar na Fila de Reserva'}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLoanClick) onLoanClick(book.id);
                }}
                disabled={!isAvailable}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isAvailable
                    ? 'bg-[#FF5C35] text-white hover:bg-[#FF714E] cursor-pointer'
                    : 'bg-white/[0.04] text-slate-600 border border-white/[0.06] cursor-not-allowed'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isAvailable ? 'Registrar Empréstimo Deste Livro' : 'Sem Exemplares Disponíveis'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
