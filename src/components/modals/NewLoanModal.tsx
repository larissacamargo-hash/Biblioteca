import React, { useState, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { X, BookCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string;
  preselectedStudentId?: string;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  preselectedBookId,
  preselectedStudentId,
}) => {
  const { books, students, createLoan } = useLibrary();

  const [bookId, setBookId] = useState(preselectedBookId || '');
  const [studentId, setStudentId] = useState(preselectedStudentId || '');
  const [loanPeriodDays, setLoanPeriodDays] = useState(14);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBookId(preselectedBookId || '');
      setStudentId(preselectedStudentId || '');
      setFeedback(null);
    }
  }, [isOpen, preselectedBookId, preselectedStudentId]);

  if (!isOpen) return null;

  const availableBooks = books.filter((b) => b.disponiveis > 0);
  const eligibleStudents = students;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!bookId) {
      setFeedback({ type: 'error', message: 'Selecione o livro a ser emprestado.' });
      return;
    }
    if (!studentId) {
      setFeedback({ type: 'error', message: 'Selecione o leitor que está retirando o exemplar.' });
      return;
    }

    const res = createLoan(bookId, studentId, loanPeriodDays);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    } else {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1200);
    }
  };

  const selectedBook = books.find((b) => b.id === bookId);
  const selectedStudent = students.find((s) => s.id === studentId);

  const selectClasses =
    'w-full text-sm border border-white/10 rounded-xl px-3.5 py-2.5 bg-[#0B0E14] text-white focus:outline-none focus:border-[#FF5C35] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-2.5">
            <BookCheck className="w-5 h-5 text-[#FF5C35]" />
            <h3 className="font-display text-base font-bold text-white">
              Registrar Novo Empréstimo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 border ${
                feedback.type === 'error'
                  ? 'bg-rose-950/50 text-rose-200 border-rose-500/30'
                  : 'bg-emerald-950/50 text-emerald-200 border-emerald-500/30'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Livro Disponível no Acervo
            </label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className={selectClasses}
              required
            >
              <option value="">Selecione um exemplar...</option>
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.titulo} — {b.disponiveis} disp. ({b.localizacao})
                </option>
              ))}
            </select>
            {selectedBook && (
              <div className="mt-1.5 text-xs text-slate-400 flex flex-wrap items-center gap-2">
                <span>Autor: <strong className="text-slate-200">{selectedBook.autor}</strong></span>
                <span className="text-slate-600">·</span>
                <span className="font-mono tabular-nums text-slate-500">ISBN {selectedBook.isbn}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Leitor Solicitante
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={selectClasses}
              required
            >
              <option value="">Selecione o leitor cadastrado...</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id} disabled={s.statusConta === 'bloqueado_atraso'}>
                  {s.nome} — Matrícula {s.matricula} ({s.curso}){' '}
                  {s.statusConta === 'bloqueado_atraso'
                    ? '[BLOQUEADO: ATRASO]'
                    : `[${s.livrosAtivos}/${s.limiteEmprestimos} ativos]`}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <div className="mt-1.5 text-xs text-slate-400 flex flex-wrap items-center gap-2">
                <span>Perfil: <strong className="text-slate-200">{selectedStudent.curso}</strong></span>
                <span className="text-slate-600">·</span>
                <span>{selectedStudent.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Prazo para Devolução
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 21, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setLoanPeriodDays(d)}
                  className={`py-2.5 text-xs font-mono tabular-nums font-medium rounded-xl border transition-colors cursor-pointer ${
                    loanPeriodDays === d
                      ? 'bg-[#181D2A] text-white border-[#FF5C35] font-semibold'
                      : 'bg-[#0B0E14] text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Prazo regular da biblioteca: 14 dias corridos com renovação sujeita à fila de reserva.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              Confirmar Retirada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
