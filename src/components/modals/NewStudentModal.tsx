import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { X, UserPlus } from 'lucide-react';

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewStudentModal: React.FC<NewStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent } = useLibrary();

  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState('Clube Jovem Leitor');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limiteEmprestimos, setLimiteEmprestimos] = useState(4);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !matricula) return;

    addStudent({
      nome,
      matricula,
      curso,
      email: email || `${matricula}@bibliotech.org.br`,
      telefone: telefone || '(11) 90000-0000',
      limiteEmprestimos: Number(limiteEmprestimos),
      statusConta: 'regular',
    });

    onClose();
  };

  const inputClasses =
    'w-full text-sm border border-white/10 rounded-xl px-3.5 py-2.5 bg-[#0B0E14] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5C35] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121620] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#FF5C35]" />
            <h3 className="font-display text-base font-bold text-white">
              Novo Cadastro de Leitor
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nome Completo do Leitor *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Amanda Albuquerque"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Código / Matrícula *
              </label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 20260911"
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Limite Empréstimos
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={limiteEmprestimos}
                onChange={(e) => setLimiteEmprestimos(Number(e.target.value))}
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Perfil / Área de Interesse *
            </label>
            <input
              type="text"
              required
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              placeholder="Ex: Clube Jovem Leitor, Design Digital..."
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: amanda@email.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className={`${inputClasses} font-mono tabular-nums`}
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
              Efetivar Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
