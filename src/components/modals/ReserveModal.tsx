import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types/library';
import { X, Bookmark, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export const ReserveModal: React.FC<ReserveModalProps> = ({ isOpen, onClose, book }) => {
  const { currentStudent, reserveBook, reservations, cancelReservation } = useLibrary();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !book) return null;

  const existingReservation = reservations.find(
    (r) => r.livroId === book.id && r.alunoId === currentStudent?.id && r.status === 'ativa'
  );

  const handleConfirm = () => {
    if (!currentStudent) return;
    const res = reserveBook(book.id, currentStudent.id);
    setResult(res);
  };

  const handleCancelExisting = () => {
    if (!existingReservation) return;
    const res = cancelReservation(existingReservation.id);
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-[#FF5C35]" />
            <h3 className="font-display text-base font-bold text-white">Reservar Exemplar</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            <div className="space-y-4 text-center py-2">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
                  result.success
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                }`}
              >
                {result.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h4 className="font-display text-lg font-bold text-white">
                {result.success ? 'Operação Concluída!' : 'Não foi possível concluir'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{result.message}</p>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  onClose();
                }}
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="bg-[#0B0E14] border border-white/[0.08] rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Obra Selecionada
                </div>
                <div className="font-display text-base font-bold text-white">{book.titulo}</div>
                <div className="text-xs text-slate-400">
                  {book.autor} · <span className="font-mono tabular-nums">{book.ano}</span>
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Localização: <span className="text-slate-300">{book.localizacao}</span>
                </div>
              </div>

              {existingReservation ? (
                <div className="space-y-4">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200 space-y-2">
                    <div className="font-semibold flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Você já possui uma reserva ativa para este livro!</span>
                    </div>
                    <p className="text-slate-300 font-mono tabular-nums text-[11px]">
                      Solicitada em <strong className="text-white">{existingReservation.dataReserva}</strong> · Válida até{' '}
                      <strong className="text-white">{existingReservation.validadeReserva}</strong>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Se você já leu a obra ou não precisa mais do exemplar, cancele abaixo para liberar a vaga imediatamente.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelExisting}
                      className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar Minha Reserva</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                    <p>
                      <span className="text-slate-500">Leitor:</span>{' '}
                      <strong className="text-white">{currentStudent?.nome}</strong>{' '}
                      <span className="text-slate-500 font-mono tabular-nums">
                        ({currentStudent?.matricula})
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Após confirmação, seu exemplar ficará guardado no balcão da biblioteca por até{' '}
                      <strong className="text-white">7 dias corridos</strong> para retirada presencial.
                    </p>
                    {book.disponiveis === 0 && (
                      <div className="text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                        Aviso: Todos os exemplares físicos estão emprestados no momento. Sua reserva entrará na fila prioritária de devolução.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
