import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Header } from './components/Header';
import { LoginPage } from './components/auth/LoginPage';
import { LibrarianDashboard } from './components/librarian/LibrarianDashboard';
import { BookCatalog } from './components/librarian/BookCatalog';
import { LoansManager } from './components/librarian/LoansManager';
import { OverduePanel } from './components/librarian/OverduePanel';
import { ShipmentsManager } from './components/librarian/ShipmentsManager';
import { StudentsRegistry } from './components/librarian/StudentsRegistry';
import { ReservationsManager } from './components/librarian/ReservationsManager';
import { StudentPortal } from './components/student/StudentPortal';
import { NewLoanModal } from './components/modals/NewLoanModal';
import { NewBookModal } from './components/modals/NewBookModal';
import { NewStudentModal } from './components/modals/NewStudentModal';
import { NewInterlibraryModal } from './components/modals/NewInterlibraryModal';
import {
  RotateCcw,
  BookOpen,
  Clock,
  AlertTriangle,
  Truck,
  Users,
  LayoutDashboard,
  Bookmark,
  GraduationCap,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    isAdminUser,
    authReady,
    isLoadingDb,
    mode,
    setMode,
    currentStudent,
    students,
    setCurrentStudent,
    resetDatabase,
    totalAtrasados,
    totalChegandoEmBreve,
    totalReservasAtivas,
  } = useLibrary();

  const [currentTab, setCurrentTab] = useState<string>('visao-geral');

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedBookForLoan, setSelectedBookForLoan] = useState<string | undefined>();
  const [selectedStudentForLoan, setSelectedStudentForLoan] = useState<string | undefined>();

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isInterlibraryModalOpen, setIsInterlibraryModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-7 h-7 text-[#FF5C35] animate-spin" />
        <p className="text-xs font-medium text-slate-400">
          Conectando à plataforma Bibliotech...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (isLoadingDb && students.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-7 h-7 text-[#FF5C35] animate-spin" />
        <p className="text-xs font-medium text-slate-400">
          Sincronizando acervo e reservas em tempo real...
        </p>
      </div>
    );
  }

  const handleOpenLoanWithBook = (bookId: string) => {
    setSelectedBookForLoan(bookId);
    setSelectedStudentForLoan(undefined);
    setIsLoanModalOpen(true);
  };

  const handleOpenLoanWithStudent = (studentId: string) => {
    setSelectedBookForLoan(undefined);
    setSelectedStudentForLoan(studentId);
    setIsLoanModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Header currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Workspace Toolbar (Non-sticky, holds role switch for admin, reader identity & full librarian sub-routes) */}
        <div className="border-b border-white/[0.06] bg-[#0E121B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Left: Context identity or secondary Librarian tabs */}
            {mode === 'librarian' && isAdminUser ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                <button
                  type="button"
                  onClick={() => setCurrentTab('visao-geral')}
                  className={`lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'visao-geral'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Geral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('acervo')}
                  className={`lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'acervo'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Acervo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('emprestimos')}
                  className={`lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'emprestimos'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Empréstimos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('reservas')}
                  className={`lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'reservas'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Reservas ({totalReservasAtivas})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('atrasos')}
                  className={`lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'atrasos'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pendências ({totalAtrasados})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('remessas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'remessas'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Chegadas & Remessas ({totalChegandoEmBreve})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('alunos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    currentTab === 'alunos'
                      ? 'bg-[#FF5C35] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Leitores Cadastrados</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Bibliotech Lounge</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-medium">{currentStudent?.nome}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline font-mono text-slate-500">
                  #{currentStudent?.matricula}
                </span>
              </div>
            )}

            {/* Right: Admin reader simulator & quick mode toggle */}
            {isAdminUser && (
              <div className="flex items-center gap-2.5 ml-auto">
                {mode === 'student' && students.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#141925] border border-white/10 rounded-lg px-2.5 py-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#FF6B47] shrink-0" />
                    <select
                      value={currentStudent?.id || ''}
                      onChange={(e) => {
                        const st = students.find((s) => s.id === e.target.value);
                        if (st) setCurrentStudent(st);
                      }}
                      className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
                      title="Simular visão de leitor"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id} className="bg-[#121620] text-slate-100">
                          {st.nome} ({st.matricula})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMode(mode === 'librarian' ? 'student' : 'librarian')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-[#141925] hover:bg-[#1B2232] text-slate-200 transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Alternar visão rápida"
                >
                  {mode === 'librarian' ? (
                    <>
                      <GraduationCap className="w-3.5 h-3.5 text-[#FF6B47]" />
                      <span>Ver como Leitor</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ver como Bibliotecária</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {mode === 'student' || !isAdminUser ? (
            <StudentPortal />
          ) : (
            <>
              {currentTab === 'visao-geral' && (
                <LibrarianDashboard
                  onNavigateTab={setCurrentTab}
                  onOpenNewLoan={() => {
                    setSelectedBookForLoan(undefined);
                    setSelectedStudentForLoan(undefined);
                    setIsLoanModalOpen(true);
                  }}
                  onOpenNewBook={() => setIsBookModalOpen(true)}
                  onOpenInterlibrary={() => setIsInterlibraryModalOpen(true)}
                  onOpenNewStudent={() => setIsStudentModalOpen(true)}
                />
              )}

              {currentTab === 'acervo' && (
                <BookCatalog
                  onOpenNewBook={() => setIsBookModalOpen(true)}
                  onOpenLoanForBook={handleOpenLoanWithBook}
                />
              )}

              {currentTab === 'emprestimos' && (
                <LoansManager
                  onOpenNewLoan={() => {
                    setSelectedBookForLoan(undefined);
                    setSelectedStudentForLoan(undefined);
                    setIsLoanModalOpen(true);
                  }}
                />
              )}

              {currentTab === 'reservas' && <ReservationsManager />}

              {currentTab === 'atrasos' && <OverduePanel />}

              {currentTab === 'remessas' && (
                <ShipmentsManager
                  onOpenInterlibraryModal={() => setIsInterlibraryModalOpen(true)}
                />
              )}

              {currentTab === 'alunos' && (
                <StudentsRegistry
                  onOpenNewStudent={() => setIsStudentModalOpen(true)}
                  onOpenLoanForStudent={handleOpenLoanWithStudent}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Clean Editorial Footer */}
      <footer className="mt-16 border-t border-white/[0.08] bg-[#090B10] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-slate-200">Bibliotech</span>
            <span aria-hidden="true">·</span>
            <span>Espaço Cultural & Acervo Jovem Contemporâneo</span>
          </div>

          {isAdminUser && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Restaurar banco de dados original no Cloud Firestore"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Dados de Exemplo</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Reset Database Confirmation Modal */}
      {isResetModalOpen && isAdminUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121620] rounded-2xl border border-white/10 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">
                Restaurar dados originais na nuvem?
              </h3>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Esta ação redefine os livros, reservas, leitores de demonstração e empréstimos iniciais diretamente no banco de dados Cloud Firestore.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  void resetDatabase();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedBookForLoan(undefined);
          setSelectedStudentForLoan(undefined);
        }}
        preselectedBookId={selectedBookForLoan}
        preselectedStudentId={selectedStudentForLoan}
      />

      <NewBookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
      />

      <NewStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />

      <NewInterlibraryModal
        isOpen={isInterlibraryModalOpen}
        onClose={() => setIsInterlibraryModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainContent />
    </LibraryProvider>
  );
}
