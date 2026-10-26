import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  Truck,
  Calendar,
  CheckCircle,
  Building2,
  Clock,
  Package,
  X,
} from 'lucide-react';

interface ShipmentsManagerProps {
  onOpenInterlibraryModal: () => void;
}

export const ShipmentsManager: React.FC<ShipmentsManagerProps> = ({ onOpenInterlibraryModal }) => {
  const { requests, updateRequestStatus } = useLibrary();
  const [filter, setFilter] = useState<'todos' | 'em_transito' | 'entregue'>('todos');
  const [toast, setToast] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'todos') return true;
    if (filter === 'em_transito') return r.status === 'em_transito' || r.status === 'solicitado';
    return r.status === 'entregue';
  });

  const handleDeliver = (reqId: string, titulo: string, qtd: number) => {
    updateRequestStatus(reqId, 'entregue');
    setToast(`Remessa de "${titulo}" (${qtd} exemplares) integrada com sucesso ao acervo disponível!`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-4 bg-[#181D2A] border border-emerald-500/30 text-slate-100 text-xs rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Chegada de Livros Novos & Pedidos Interbibliotecas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Previsão de entrega de remessas e solicitação de livros de outras unidades ou editoras.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenInterlibraryModal}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>Pedir Livros de Outro Lugar</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/[0.08] w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('todos')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums ${
            filter === 'todos' ? 'bg-[#1E2536] text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todas as Remessas ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('em_transito')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums ${
            filter === 'em_transito' ? 'bg-[#1E2536] text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Aguardando Chegada ({requests.filter((r) => r.status !== 'entregue').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('entregue')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums ${
            filter === 'entregue' ? 'bg-[#1E2536] text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Já Recebidas ({requests.filter((r) => r.status === 'entregue').length})
        </button>
      </div>

      {/* Shipments Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.map((req) => {
          const isDelivered = req.status === 'entregue';
          const isInTransit = req.status === 'em_transito';

          return (
            <div
              key={req.id}
              className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between ${
                isDelivered
                  ? 'bg-[#0E121B] border-white/[0.05]'
                  : 'bg-[#121620] border-white/[0.08] hover:border-white/15'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-medium">
                    {req.tipo === 'interbibliotecas' ? 'Empréstimo Interbibliotecas' : 'Aquisição Nova'}
                  </span>
                  {isDelivered ? (
                    <span className="text-emerald-400 font-medium inline-flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Recebido no Acervo</span>
                    </span>
                  ) : isInTransit ? (
                    <span className="text-sky-400 font-medium inline-flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Em Trânsito</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Solicitado à Origem</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-white leading-snug">{req.titulo}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{req.autor}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Origem: <strong className="text-slate-200">{req.origemUnidade}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Remessa: <strong className="text-slate-200">{req.quantidade} exemplares</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5C35] shrink-0" />
                    <span>
                      Previsão de Chegada: <strong className="text-white">{req.previsaoChegada}</strong>
                    </span>
                  </div>
                </div>

                {req.observacao && (
                  <p className="text-xs text-slate-400 italic bg-[#0B0E14] border border-white/[0.06] px-3 py-2 rounded-lg">
                    {req.observacao}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.06] mt-4 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 font-mono truncate">
                  Solicitante: {req.solicitante}
                </span>

                {!isDelivered ? (
                  <button
                    type="button"
                    onClick={() => handleDeliver(req.id, req.titulo, req.quantidade)}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirmar Entrada</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                    Exemplares disponíveis
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
