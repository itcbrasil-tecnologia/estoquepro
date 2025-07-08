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
        <label className="block text-sm font-medium text-gray-700">Selecione um Usuário</label>
        <select onChange={(e) => setUserId(e.target.value)} className="mt-1 block w-full md:w-1/3 p-2 border rounded-lg">
          <option value="">Selecione...</option>
          {Array.from(caches.usuarios.values()).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
      </div>
      <div>
        {!userId ? (
          <p className="text-gray-500">Selecione um usuário para ver suas movimentações.</p>
        ) : historicoDoUsuario.length === 0 ? (
          <p className="text-gray-500">Nenhuma movimentação encontrada para este usuário.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
                <th className="py-2 px-3 text-left font-medium">Data</th>
                <th className="py-2 px-3 text-left font-medium">Produto</th>
                <th className="py-2 px-3 text-left font-medium">Tipo</th>
                <th className="py-2 px-3 text-right font-medium">Qtd</th>
            </tr></thead>
            <tbody className="divide-y">
                {historicoDoUsuario.map(h => {
                    const p = caches.produtos.get(h.produtoId);
                    if (!p) return null;
                    return <tr key={h.id}>
                        <td className="py-2 px-3">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                        <td className="py-2 px-3">{p.nome}</td>
                        <td className="py-2 px-3">{h.tipo}</td>
                        <td className="py-2 px-3 text-right">{h.quantidade}</td>
                    </tr>
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}