import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookCategory } from '../../types/library';
import { X, BookPlus } from 'lucide-react';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({ isOpen, onClose }) => {
  const { addBook } = useLibrary();

  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [categoria, setCategoria] = useState<BookCategory>('Fantasia e Aventura');
  const [indicacaoFaixaEtaria, setIndicacaoFaixaEtaria] = useState('12+ anos');
  const [ano] = useState(2025);
  const [edicao, setEdicao] = useState('1ª Edição');
  const [localizacao, setLocalizacao] = useState('Estante Juvenil F-01');
  const [totalExemplares, setTotalExemplares] = useState(4);
  const [descricao, setDescricao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !autor) return;

    addBook({
      titulo,
      autor,
      isbn: isbn || `978-85${Math.floor(10000000 + Math.random() * 90000000)}`,
      categoria,
      ano: Number(ano),
      edicao,
      localizacao,
      totalExemplares: Number(totalExemplares),
      disponiveis: Number(totalExemplares),
      status: 'disponivel',
      indicacaoFaixaEtaria,
      descricao: descricao || 'Novo título catalogado no acervo da biblioteca.',
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
            <BookPlus className="w-5 h-5 text-[#FF5C35]" />
            <h3 className="font-display text-base font-bold text-white">
              Cadastrar Novo Livro no Acervo
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Título da Obra *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Corte de Asas e Ruína"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Autor(a) *
              </label>
              <input
                type="text"
                required
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Sarah J. Maas"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                ISBN (Opcional)
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Ex: 978-8535914849"
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Gênero / Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as BookCategory)}
                className={inputClasses}
              >
                <option value="Literatura Clássica">Literatura Clássica</option>
                <option value="Fantasia e Aventura">Fantasia e Aventura</option>
                <option value="Literatura Infantil">Literatura Infantil</option>
                <option value="Romance">Romance</option>
                <option value="Suspense e Mistério">Suspense e Mistério</option>
                <option value="Mangás e HQs">Mangás e HQs</option>
                <option value="Ciências e Didáticos">Ciências e Didáticos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Faixa Etária
              </label>
              <select
                value={indicacaoFaixaEtaria}
                onChange={(e) => setIndicacaoFaixaEtaria(e.target.value)}
                className={inputClasses}
              >
                <option value="Livre">Livre para todos</option>
                <option value="10+ anos">10+ anos</option>
                <option value="12+ anos">12+ anos</option>
                <option value="14+ anos">14+ anos</option>
                <option value="16+ anos">16+ anos (Jovem Adulto)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalExemplares}
                onChange={(e) => setTotalExemplares(Number(e.target.value))}
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Localização Física (Estante)
              </label>
              <input
                type="text"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Estante Juvenil F-02 / Prateleira 1"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Edição / Ano
              </label>
              <input
                type="text"
                value={edicao}
                onChange={(e) => setEdicao(e.target.value)}
                placeholder="Ex: 1ª Edição Especial"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Sinopse do Livro
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve resumo da história para consulta dos leitores..."
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
              Salvar no Acervo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
