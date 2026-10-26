import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { X, Truck } from 'lucide-react';

interface NewInterlibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewInterlibraryModal: React.FC<NewInterlibraryModalProps> = ({ isOpen, onClose }) => {
  const { createInterlibraryRequest } = useLibrary();

  const [tipo, setTipo] = useState<'interbibliotecas' | 'nova_aquisicao'>('interbibliotecas');
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [origemUnidade, setOrigemUnidade] = useState('Biblioteca Central - Rede Parceira');
  const [quantidade, setQuantidade] = useState(2);
  const [previsaoChegada, setPrevisaoChegada] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [solicitante, setSolicitante] = useState('Bibliotecário Responsável');
  const [observacao, setObservacao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !autor) return;

    createInterlibraryRequest({
      tipo,
      titulo,
      autor,
      origemUnidade,
      quantidade: Number(quantidade),
      previsaoChegada,
      solicitante,
      observacao,
    });

    onClose();
  };

  const inputClasses =
    'w-full text-sm border border-white/10 rounded-xl px-3.5 py-2.5 bg-[#0B0E14] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-[#FF5C35]" />
            <h3 className="font-display text-base font-bold text-white">
              {tipo === 'interbibliotecas' ? 'Pedir Livros de Outra Biblioteca' : 'Solicitar Nova Aquisição'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Tipo de Requisição
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTipo('interbibliotecas');
                  setOrigemUnidade('Biblioteca Central - Rede Parceira');
                }}
                className={`p-3 text-xs rounded-xl border text-left transition-colors cursor-pointer ${
                  tipo === 'interbibliotecas'
                    ? 'border-[#FF5C35] bg-[#181D2A] text-white'
                    : 'border-white/10 bg-[#0B0E14] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Empréstimo Interbibliotecas</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Transferir de outra unidade ou rede
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('nova_aquisicao');
                  setOrigemUnidade('Editora / Distribuidora Nacional');
                }}
                className={`p-3 text-xs rounded-xl border text-left transition-colors cursor-pointer ${
                  tipo === 'nova_aquisicao'
                    ? 'border-[#FF5C35] bg-[#181D2A] text-white'
                    : 'border-white/10 bg-[#0B0E14] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Nova Compra / Aquisição</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Solicitar compra de distribuidora
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Título do Livro Solicitado *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Duna, Jujutsu Kaisen Vol. 0 ou Quarta Asa"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Autor(a) *
              </label>
              <input
                type="text"
                required
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Frank Herbert"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Origem (Unidade / Fornecedor)
            </label>
            <input
              type="text"
              value={origemUnidade}
              onChange={(e) => setOrigemUnidade(e.target.value)}
              placeholder="Ex: Biblioteca Parque Cultural, Editora Intrínseca..."
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Previsão de Chegada
              </label>
              <input
                type="date"
                required
                value={previsaoChegada}
                onChange={(e) => setPrevisaoChegada(e.target.value)}
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Solicitante / Setor
              </label>
              <input
                type="text"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                placeholder="Ex: Curadoria Jovem ou Leitor"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observações / Justificativa
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Alta procura entre os leitores do clube de leitura..."
              className={inputClasses}
            />
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
              Emitir Pedido de Transferência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
