'use client';

import { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Erro capturado pelo Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar o painel</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Ocorreu uma oscilação temporária ao processar os filtros ou carregar as informações. Clique abaixo para restabelecer a conexão.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <RotateCcw size={16} />
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition cursor-pointer"
        >
          Recarregar início
        </button>
      </div>
    </div>
  );
}
