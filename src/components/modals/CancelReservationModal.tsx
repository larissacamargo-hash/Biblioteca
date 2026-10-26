import React from 'react';
import { Reservation, Book } from '../../types/library';
import { BookCover } from '../common/BookCover';
import {
  X,
  XCircle,
  Bookmark,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface CancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  book?: Book | null;
  onConfirm: (reservationId: string) => void;
  isProcessing?: boolean;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  book,
  onConfirm,
  isProcessing = false,
}) => {
  if (!isOpen || !reservation) return null;

  const isImmediate = reservation.tipo === 'retirada_imediata';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#121620] rounded-2xl shadow-2xl border border-rose-500/25 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-res-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cancel-res-title" className="font-display text-sm font-bold text-white leading-tight">
                Cancelar Reserva do Livro
              </h3>
              <p className="text-[11px] text-rose-400 font-medium">
                Confirmação de liberação do exemplar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Book Summary Card */}
          <div className="flex items-start gap-3.5 bg-[#0B0E14] border border-white/[0.08] rounded-xl p-3.5">
            {book ? (
              <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-[#0B0E14]">
                <BookCover book={book} showAgeBadge={false} />
              </div>
            ) : (
              <div className="w-14 h-20 rounded-lg bg-[#181D2A] border border-white/10 flex items-center justify-center shrink-0 text-[#FF5C35]">
                <Bookmark className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                Título Solicitado
              </span>
              <h4 className="font-display font-bold text-white text-sm leading-snug line-clamp-2">
                {reservation.livroTitulo}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  Leitor: <strong className="text-slate-200">{reservation.alunoNome}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                <span>Matrícula {reservation.alunoMatricula}</span>
              </div>
            </div>
          </div>

          {/* Details / Impact Note */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#181D2A] border border-white/[0.08]">
              <div className="flex items-center gap-2">
                {isImmediate ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                )}
                <span className="font-medium text-white">
                  {isImmediate ? 'Exemplar separado no balcão' : 'Na fila de espera'}
                </span>
              </div>
              <span className="font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                Até {reservation.validadeReserva}
              </span>
            </div>

            <div className="p-3.5 bg-[#0B0E14] rounded-xl border border-white/[0.08] text-slate-400 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Tem certeza de que deseja cancelar esta reserva?{' '}
                {isImmediate ? (
                  <strong className="text-slate-200">
                    O exemplar guardado no balcão voltará imediatamente para a estante disponível.
                  </strong>
                ) : (
                  <strong className="text-slate-200">
                    Você deixará a fila prioritária desta obra.
                  </strong>
                )}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
            >
              Manter Reserva
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reservation.id)}
              disabled={isProcessing}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <XCircle className="w-4 h-4" />
              <span>{isProcessing ? 'Cancelando...' : 'Sim, Cancelar Reserva'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
