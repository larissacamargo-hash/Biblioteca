import React, { useState } from 'react';
import { Book } from '../../types/library';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Feather, 
  Smile, 
  Flame, 
  Search 
} from 'lucide-react';

interface BookCoverProps {
  book: Book;
  className?: string;
  showAgeBadge?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({ book, className = '', showAgeBadge = true }) => {
  const [imageError, setImageError] = useState(false);

  if (book.capaUrl && !imageError) {
    return (
      <div className={`relative aspect-3/4 bg-[#121620] overflow-hidden ${className}`}>
        <img
          src={book.capaUrl}
          alt={`Capa do livro ${book.titulo}`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
        {showAgeBadge && book.indicacaoFaixaEtaria && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="text-[11px] font-mono font-medium text-white/90 drop-shadow-sm">
              {book.indicacaoFaixaEtaria}
            </span>
          </div>
        )}
      </div>
    );
  }

  const getCoverTheme = () => {
    switch (book.categoria) {
      case 'Literatura Clássica':
        return {
          accent: 'text-amber-300',
          border: 'border-amber-400/25',
          icon: <Feather className="w-7 h-7 text-amber-300/80 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#231B12] via-[#151210] to-[#0B0E14]',
        };
      case 'Fantasia e Aventura':
        return {
          accent: 'text-indigo-300',
          border: 'border-indigo-400/25',
          icon: <Sparkles className="w-7 h-7 text-indigo-300/80 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#171630] via-[#111322] to-[#0B0E14]',
        };
      case 'Literatura Infantil':
        return {
          accent: 'text-orange-300',
          border: 'border-orange-400/25',
          icon: <Smile className="w-7 h-7 text-orange-300/85 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#2B1B12] via-[#191310] to-[#0B0E14]',
        };
      case 'Romance':
        return {
          accent: 'text-rose-300',
          border: 'border-rose-400/25',
          icon: <Heart className="w-7 h-7 text-rose-300/80 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#2B131D] via-[#181118] to-[#0B0E14]',
        };
      case 'Suspense e Mistério':
        return {
          accent: 'text-slate-300',
          border: 'border-slate-400/25',
          icon: <Search className="w-7 h-7 text-slate-300/80 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#1B202C] via-[#121620] to-[#0B0E14]',
        };
      case 'Mangás e HQs':
        return {
          accent: 'text-[#FF6B47]',
          border: 'border-[#FF5C35]/30',
          icon: <Flame className="w-7 h-7 text-[#FF6B47] stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#2D1410] via-[#171216] to-[#0B0E14]',
        };
      default:
        return {
          accent: 'text-sky-300',
          border: 'border-sky-400/25',
          icon: <BookOpen className="w-7 h-7 text-sky-300/80 stroke-[1.5]" />,
          surface: 'bg-gradient-to-br from-[#14202E] via-[#111722] to-[#0B0E14]',
        };
    }
  };

  const theme = getCoverTheme();

  return (
    <div className={`relative aspect-3/4 overflow-hidden ${theme.surface} p-5 flex flex-col justify-between text-white select-none ${className}`}>
      <div className={`absolute inset-3 border ${theme.border} rounded-lg pointer-events-none`} />
      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 pt-1 space-y-1">
        <div className={`text-[11px] font-medium ${theme.accent} truncate`}>
          {book.categoria}
        </div>
        <p className="text-xs text-slate-400 truncate">
          {book.autor}
        </p>
      </div>

      <div className="relative z-10 my-auto space-y-3 py-2">
        <div className="opacity-85">
          {theme.icon}
        </div>
        <h3 className="font-display font-bold text-base leading-snug line-clamp-3 text-white tracking-tight">
          {book.titulo}
        </h3>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
        <span>{book.ano}</span>
        {showAgeBadge && book.indicacaoFaixaEtaria && (
          <span className="text-slate-300">{book.indicacaoFaixaEtaria}</span>
        )}
      </div>
    </div>
  );
};
