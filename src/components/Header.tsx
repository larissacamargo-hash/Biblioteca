import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { 
    mode, 
    totalReservasAtivas,
    totalAtrasados,
    logout 
  } = useLibrary();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onSelectTab) onSelectTab('visao-geral');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-[#FF6B47] transition-colors duration-150"
          >
            Bibliotech
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-400">
            {mode === 'librarian' ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('visao-geral')}
                  className={`py-1 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'visao-geral'
                      ? 'text-white font-semibold border-b-2 border-[#FF5C35]'
                      : 'hover:text-white'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('acervo')}
                  className={`py-1 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'acervo'
                      ? 'text-white font-semibold border-b-2 border-[#FF5C35]'
                      : 'hover:text-white'
                  }`}
                >
                  Acervo
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('emprestimos')}
                  className={`py-1 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'emprestimos'
                      ? 'text-white font-semibold border-b-2 border-[#FF5C35]'
                      : 'hover:text-white'
                  }`}
                >
                  Empréstimos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('reservas')}
                  className={`py-1 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'reservas'
                      ? 'text-white font-semibold border-b-2 border-[#FF5C35]'
                      : 'hover:text-white'
                  }`}
                >
                  Reservas{totalReservasAtivas > 0 ? ` (${totalReservasAtivas})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('atrasos')}
                  className={`py-1 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'atrasos'
                      ? 'text-rose-400 font-semibold border-b-2 border-rose-500'
                      : 'hover:text-white'
                  }`}
                >
                  Pendências{totalAtrasados > 0 ? ` (${totalAtrasados})` : ''}
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-400 whitespace-nowrap shrink-0">
                Catálogo Digital & Espaço de Leitura Jovem
              </span>
            )}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#181D2A] text-slate-200 hover:bg-[#22293A] hover:text-white border border-white/10 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF5C35]"
              title="Sair para a página de acesso"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
