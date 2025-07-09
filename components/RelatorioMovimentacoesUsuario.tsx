'use client';

import { useState } from 'react';
import { CacheData } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioMovimentacoesUsuario({ caches }: RelatorioProps) {
  const [userId, setUserId] = useState('');

  const historicoDoUsuario = userId ? caches.historico.filter(h => h.usuario === userId).sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0)) : [];

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione um Usuário</label>
        <select onChange={(e) => setUserId(e.target.value)} className="mt-1 block w-full md:w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
          <option value="">Selecione...</option>
          {Array.from(caches.usuarios.values()).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
      </div>
      <div>
        {!userId ? (
          <p className="text-gray-500 dark:text-gray-400">Selecione um usuário para ver suas movimentações.</p>
        ) : historicoDoUsuario.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma movimentação encontrada para este usuário.</p>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-800 text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase"><tr>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Qtd</th>
            </tr></thead>
            <tbody className="divide-y dark:divide-gray-700">
                {historicoDoUsuario.map(h => {
                    const p = caches.produtos.get(h.produtoId);
                    if (!p) return null;
                    return <tr key={h.id}>
                        <td className="py-3 px-4">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                        <td className="py-3 px-4">{p.nome}</td>
                        <td className="py-3 px-4">{h.tipo}</td>
                        <td className="py-3 px-4 text-right">{h.quantidade}</td>
                    </tr>
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}