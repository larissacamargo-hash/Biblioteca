import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookCategory } from '../../types/library';
import { BookDetailModal } from '../modals/BookDetailModal';
import { BookCover } from '../common/BookCover';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Eye,
  Bookmark
} from 'lucide-react';

interface BookCatalogProps {
  onOpenNewBook: () => void;
  onOpenLoanForBook: (bookId: string) => void;
}

export const BookCatalog: React.FC<BookCatalogProps> = ({ onOpenNewBook, onOpenLoanForBook }) => {
  const { books, totalExemplaresFisicos, totalDisponiveis, reservations } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  const categories: (BookCategory | 'todos')[] = [
    'todos',
    'Mangás e HQs',
    'Fantasia e Aventura',
    'Romance',
    'Suspense e Mistério',
    'Literatura Clássica',
    'Literatura Infantil',
    'Ciências e Didáticos',
  ];

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.titulo.toLowerCase().includes(search.toLowerCase()) ||
      b.autor.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || b.categoria === selectedCategory;

    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'disponivel' && b.disponiveis > 0) ||
      (statusFilter === 'esgotado' && b.disponiveis === 0 && b.status !== 'em_transito') ||
      (statusFilter === 'em_transito' && b.status === 'em_transito');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Acervo Completo
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            <strong className="text-white">{books.length}</strong> títulos · {totalExemplaresFisicos} exemplares físicos · <span className="text-emerald-400 font-semibold">{totalDisponiveis} disponíveis</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewBook}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#FF5C35] hover:bg-[#FF714E] rounded-xl transition-colors duration-150 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Livro</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, autor ou ISBN..."
            className="w-full text-sm pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-[#121620] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-white/10 rounded-xl px-4 py-2.5 bg-[#121620] text-slate-200 focus:outline-none focus:border-[#FF5C35] cursor-pointer"
        >
          <option value="todos">Todos os Status</option>
          <option value="disponivel">Somente Disponíveis</option>
          <option value="esgotado">Emprestados / Sem estoque</option>
          <option value="em_transito">Em Trânsito / Chegando</option>
        </select>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-[#0B0E14] font-semibold'
                : 'bg-[#121620] text-slate-400 border border-white/[0.08] hover:text-white hover:border-white/20'
            }`}
          >
            {cat === 'todos' ? 'Todos os Gêneros' : cat}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 bg-[#121620] rounded-2xl border border-white/[0.08] p-8">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-white">Nenhum livro encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">
            Tente refinar sua busca ou limpe os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isAvailable = book.disponiveis > 0;
            const isTransit = book.status === 'em_transito';
            const activeResForBook = reservations.filter((r) => r.livroId === book.id && r.status === 'ativa');

            return (
              <article
                key={book.id}
                className="bg-[#121620] rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col justify-between hover:border-white/20 hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div>
                  <div 
                    onClick={() => setSelectedBookForDetail(book)}
                    className="relative cursor-pointer overflow-hidden"
                    title="Ver sinopse e detalhes"
                  >
                    <BookCover book={book} />

                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white text-xs font-semibold gap-2 z-20">
                      <Eye className="w-4 h-4 text-[#FF6B47]" />
                      <span>Ver Ficha Completa</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-300 font-medium">{book.categoria}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{book.ano}</span>
                      <span aria-hidden="true">·</span>
                      {isTransit ? (
                        <span className="text-sky-400 font-medium">Em Trânsito</span>
                      ) : isAvailable ? (
                        <span className="text-emerald-400 font-mono tabular-nums font-medium">{book.disponiveis} disp.</span>
                      ) : (
                        <span className="text-rose-400 font-medium">Esgotado</span>
                      )}
                    </div>

                    <h3 
                      onClick={() => setSelectedBookForDetail(book)}
                      className="font-display font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-[#FF7A59] transition-colors cursor-pointer"
                    >
                      {book.titulo}
                    </h3>

                    <p className="text-xs text-slate-400 font-medium">
                      {book.autor}
                    </p>

                    <div className="pt-2.5 border-t border-white/[0.06] text-[11px] text-slate-500 space-y-1">
                      <div className="truncate text-slate-400">{book.localizacao}</div>
                      <div className="font-mono tabular-nums">ISBN {book.isbn}</div>
                    </div>

                    {activeResForBook.length > 0 && (
                      <div className="pt-1 text-xs text-[#FF7A59] flex items-center justify-between gap-2">
                        <span className="font-medium flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 shrink-0" />
                          <span>{activeResForBook.length} reserva(s)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                          {activeResForBook[0]?.alunoNome}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookForDetail(book)}
                    className="w-full py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-[#181D2A] hover:bg-[#202738] rounded-xl border border-white/[0.08] transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#FF6B47]" />
                    <span>Conhecer a História</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLoanForBook(book.id)}
                    disabled={!isAvailable}
                    className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isAvailable
                        ? 'bg-[#FF5C35] text-white hover:bg-[#FF714E] cursor-pointer'
                        : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span>{isAvailable ? 'Registrar Empréstimo' : 'Indisponível no momento'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <BookDetailModal
        isOpen={selectedBookForDetail !== null}
        onClose={() => setSelectedBookForDetail(null)}
        book={selectedBookForDetail}
        onLoanClick={(bookId) => onOpenLoanForBook(bookId)}
      />
    </div>
  );
};
