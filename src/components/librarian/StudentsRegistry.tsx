import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types/library';
import {
  Search,
  UserPlus,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  X,
  History,
  Bookmark,
  BookCheck,
} from 'lucide-react';

interface StudentsRegistryProps {
  onOpenNewStudent: () => void;
  onOpenLoanForStudent: (studentId: string) => void;
}

export const StudentsRegistry: React.FC<StudentsRegistryProps> = ({
  onOpenNewStudent,
  onOpenLoanForStudent,
}) => {
  const { students, loans, reservations, fulfillReservation } = useLibrary();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reservationNotice, setReservationNotice] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const filteredStudents = students.filter(
    (s) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.matricula.toLowerCase().includes(search.toLowerCase()) ||
      s.curso.toLowerCase().includes(search.toLowerCase())
  );

  const studentLoans = selectedStudent
    ? loans.filter((l) => l.alunoId === selectedStudent.id)
    : [];

  const studentReservations = selectedStudent
    ? reservations.filter((r) => r.alunoId === selectedStudent.id && r.status === 'ativa')
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Cadastro de Leitores & Membros
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total de <strong className="text-white font-mono tabular-nums">{students.length}</strong> leitores cadastrados no sistema da biblioteca.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewStudent}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Leitor</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar leitor por nome, matrícula ou perfil..."
          className="w-full text-sm pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors"
        />
      </div>

      {/* Students Table */}
      <div className="bg-[#121620] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E121B] border-b border-white/[0.08] text-slate-400 font-medium">
              <tr>
                <th className="px-5 py-3.5">Leitor</th>
                <th className="px-5 py-3.5">Curso / Perfil</th>
                <th className="px-5 py-3.5">Contato</th>
                <th className="px-5 py-3.5">Empréstimos Ativos</th>
                <th className="px-5 py-3.5">Histórico Total</th>
                <th className="px-5 py-3.5">Status da Conta</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {filteredStudents.map((st) => {
                const isBlocked = st.statusConta === 'bloqueado_atraso';

                return (
                  <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{st.nome}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        Matrícula {st.matricula}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">
                      {st.curso}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      <div>{st.email}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">{st.telefone}</div>
                    </td>
                    <td className="px-5 py-4 font-mono tabular-nums">
                      <span className={st.livrosAtivos > 0 ? 'text-[#FF5C35] font-semibold' : 'text-slate-500'}>
                        {st.livrosAtivos} de {st.limiteEmprestimos} livros
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono tabular-nums text-slate-400">
                      {st.totalHistoricoEmprestimos} leituras
                    </td>
                    <td className="px-5 py-4">
                      {isBlocked ? (
                        <span className="text-rose-400 font-medium inline-flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Bloqueado (Atraso)</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium inline-flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Regular</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReservationNotice(null);
                            setSelectedStudent(st);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#181D2A] hover:bg-[#232A3C] border border-white/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Ver Histórico
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenLoanForStudent(st.id)}
                          disabled={isBlocked || st.livrosAtivos >= st.limiteEmprestimos}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            isBlocked || st.livrosAtivos >= st.limiteEmprestimos
                              ? 'bg-white/[0.04] text-slate-600 border border-white/[0.06] cursor-not-allowed'
                              : 'bg-[#FF5C35] text-white hover:bg-[#FF714E] cursor-pointer'
                          }`}
                        >
                          Emprestar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details / History Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#FF5C35]" />
                <h3 className="font-display text-base font-bold text-white">
                  Prontuário do Leitor: {selectedStudent.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
                aria-label="Fechar prontuário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0E14] p-4 rounded-xl border border-white/[0.08]">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Matrícula</div>
                  <div className="text-xs font-mono tabular-nums font-semibold text-white mt-0.5">
                    {selectedStudent.matricula}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Perfil</div>
                  <div className="text-xs font-semibold text-white mt-0.5 truncate">
                    {selectedStudent.curso}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Status</div>
                  <div
                    className={`text-xs font-semibold mt-0.5 ${
                      selectedStudent.statusConta === 'bloqueado_atraso'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedStudent.statusConta === 'bloqueado_atraso' ? 'Bloqueado' : 'Regular'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Livros em mãos</div>
                  <div className="text-xs font-mono tabular-nums font-semibold text-white mt-0.5">
                    {selectedStudent.livrosAtivos} / {selectedStudent.limiteEmprestimos}
                  </div>
                </div>
              </div>

              {/* Feedback Notice (no native alert) */}
              {reservationNotice && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
                    reservationNotice.tone === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}
                >
                  {reservationNotice.tone === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{reservationNotice.text}</span>
                </div>
              )}

              {/* Active Reservations for this student */}
              {studentReservations.length > 0 && (
                <div className="space-y-3 bg-[#181D2A] border border-[#FF5C35]/25 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#FF5C35]" />
                    <span>Reservas Ativas Deste Leitor ({studentReservations.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {studentReservations.map((res) => (
                      <div
                        key={res.id}
                        className="bg-[#0B0E14] p-3.5 rounded-xl border border-white/[0.08] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{res.livroTitulo}</div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                            Reservado em {res.dataReserva} · Validade até {res.validadeReserva}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const result = fulfillReservation(res.id, 14);
                            if (result.success) {
                              setReservationNotice({
                                tone: 'success',
                                text: `Exemplar entregue com sucesso a ${selectedStudent.nome}!`,
                              });
                              setTimeout(() => setReservationNotice(null), 3500);
                            } else {
                              setReservationNotice({
                                tone: 'error',
                                text: result.message,
                              });
                              setTimeout(() => setReservationNotice(null), 4500);
                            }
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <BookCheck className="w-3.5 h-3.5" />
                          <span>Entregar Livro</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Histórico de Empréstimos ({studentLoans.length})</span>
                </h4>

                {studentLoans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center bg-[#0B0E14] rounded-xl border border-white/[0.06]">
                    Nenhum empréstimo registrado até o momento.
                  </p>
                ) : (
                  <div className="bg-[#0B0E14] border border-white/[0.08] rounded-xl divide-y divide-white/[0.06] overflow-hidden text-xs">
                    {studentLoans.map((l) => (
                      <div key={l.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{l.livroTitulo}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            Retirada: {l.dataEmprestimo} · Prazo: {l.dataPrevistaDevolucao}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-medium ${
                              l.status === 'devolvido'
                                ? 'text-emerald-400'
                                : l.status === 'atrasado'
                                ? 'text-rose-400 font-semibold'
                                : 'text-amber-400'
                            }`}
                          >
                            {l.status === 'devolvido'
                              ? 'Devolvido'
                              : l.status === 'atrasado'
                              ? 'Em Atraso'
                              : 'Em Andamento'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 px-6 bg-[#0E121B] border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Fechar Prontuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
