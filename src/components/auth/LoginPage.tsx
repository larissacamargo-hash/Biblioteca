import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { INITIAL_BOOKS } from '../../data/mockData';
import {
  BookOpen,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, books, isAuthenticating } = useLibrary();

  const [activeTab, setActiveTab] = useState<'aluno' | 'bibliotecaria'>('aluno');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  const catalogCount = books.length > 0 ? books.length : INITIAL_BOOKS.length;

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    const portal = activeTab === 'aluno' ? 'student' : 'librarian';
    const res = await signInWithGoogle(portal);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 items-stretch rounded-2xl overflow-hidden border border-white/[0.08] bg-[#121620]">
        {/* Left Editorial Visual Showcase */}
        <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[640px] flex flex-col justify-between p-8 sm:p-12 overflow-hidden bg-[#0E121B]">
          {!heroImgError ? (
            <img
              src="/src/assets/images/editorial_books_showcase_1793013071050.jpg"
              alt="Coleção contemporânea de livros jovens, fantasia e mangás"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B2E] via-[#121620] to-[#0B0E14] flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-white/10" />
            </div>
          )}

          {/* Measured Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/75 to-[#0B0E14]/35 pointer-events-none" />

          {/* Top Wordmark */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              Bibliotech
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Espaço Cultural & Lounge Jovem
            </span>
          </div>

          {/* Bottom Editorial Headline & Unboxed Metadata */}
          <div className="relative z-10 space-y-4 max-w-xl pt-16">
            <p className="text-xs font-medium text-[#FF7A59]">
              Acervo Literário & Cultura Jovem
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-white leading-[1.12]">
              Sua próxima leitura favorita já está esperando na estante.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Explore mangás, fantasia, suspense, romances e clássicos com sinopses completas, disponibilidade em tempo real na nuvem e reserva rápida para retirar no balcão.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
              <span>{catalogCount} títulos no catálogo</span>
              <span aria-hidden="true">·</span>
              <span>Mangás & HQs</span>
              <span aria-hidden="true">·</span>
              <span>Fantasia</span>
              <span aria-hidden="true">·</span>
              <span>Reserva em 1 clique</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#121620]">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                Entrar na plataforma
              </h2>
              <p className="text-xs text-slate-400">
                Conecte sua conta Google para sincronizar leituras, reservas e acervo em tempo real.
              </p>
            </div>

            {/* Dual Portal Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-[#0B0E14] rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('aluno');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  activeTab === 'aluno'
                    ? 'bg-[#1C2232] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#FF6B47]" />
                <span>Portal do Leitor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('bibliotecaria');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  activeTab === 'bibliotecaria'
                    ? 'bg-[#1C2232] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Bibliotecária(o)</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: LEITOR GOOGLE LOGIN */}
            {activeTab === 'aluno' ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-white/[0.08] space-y-2.5">
                  <div className="text-xs font-semibold text-white">
                    Carteirinha Digital Automática
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ao entrar com Google, seu perfil de leitor é criado ou sincronizado automaticamente no banco de dados com acesso imediato às reservas do catálogo.
                  </p>
                  <div className="pt-1 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Reserve mangás, romances e fantasia em 1 clique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cancele reservas e acompanhe prazos em tempo real</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={handleGoogleAuth}
                  className="w-full py-3.5 px-4 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] disabled:opacity-60 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando com Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                        />
                      </svg>
                      <span>Entrar com Google no Catálogo</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* TAB 2: BIBLIOTECÁRIA GOOGLE LOGIN */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-white/[0.08] space-y-2.5">
                  <div className="text-xs font-semibold text-white">
                    Painel de Gestão & Acervo Cloud
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Acesso exclusivo para a conta administradora da biblioteca. Gerencie novos títulos, retiradas de reservas no balcão, devoluções, atrasos e remessas.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={handleGoogleAuth}
                  className="w-full py-3.5 px-4 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] disabled:opacity-60 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando credencial...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Acessar Gestão com Google</span>
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-500 leading-relaxed">
                  Todos os empréstimos, exemplares disponíveis e reservas são gravados de forma segura e persistente no banco de dados em nuvem.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
