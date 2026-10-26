import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado na comunicação com o banco de dados.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Bibliotech ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && typeof parsed.error === 'string') {
          if (parsed.error.includes('Quota exceeded')) {
            friendlyMsg =
              'O limite diário gratuito de leituras/gravações do banco de dados foi atingido e será renovado amanhã.';
          } else {
            friendlyMsg = `Permissão ou validação recusada pelo banco de dados (${parsed.operationType} em ${parsed.path || 'coleção'}).`;
          }
        }
      } catch {
        // Plain text message
      }

      return (
        <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#121620] border border-rose-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Atenção na Sincronização
                </h2>
                <p className="text-xs text-slate-400">Banco de Dados Cloud Firestore</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0B0E14] p-3.5 rounded-xl border border-white/[0.08]">
              {friendlyMsg}
            </p>

            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recarregar Aplicativo</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
