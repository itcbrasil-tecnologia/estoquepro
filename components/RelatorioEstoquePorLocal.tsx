'use client';

import { useState } from 'react';
import { CacheData, EstoqueItem, Localidade, Produto, Fabricante } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioEstoquePorLocal({ caches }: RelatorioProps) {
  const [localId, setLocalId] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalId(e.target.value);
    e.target.classList.toggle('filter-active', !!e.target.value);
  };

  const estoqueNoLocal = localId ? caches.estoque.filter((item) => item.localidadeId === localId && item.quantidade > 0) : [];

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="relatorio-local-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione uma Localidade</label>
        <select id="relatorio-local-select" onChange={handleSelectChange} className="mt-1 block w-full md:w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
          <option value="">Selecione...</option>
          {Array.from(caches.localidades.entries()).map(([id, local]: [string, Localidade]) => (
            <option key={id} value={id}>{local.nome}</option>
          ))}
        </select>
      </div>
      <div id="relatorio-local-resultado">
        {!localId ? (
          <p className="text-gray-500 dark:text-gray-400">Selecione um local para ver os produtos.</p>
        ) : estoqueNoLocal.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado neste local.</p>
        ) : (
          <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
              <tr>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Fabricante</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {estoqueNoLocal.map((item: EstoqueItem) => {
                const p = caches.produtos.get(item.produtoId);
                if (!p) return null;
                const fab = p.fabricanteId ? caches.fabricantes.get(p.fabricanteId) : null;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-3 px-4">{p.nome}</td>
                    <td className="py-3 px-4">{fab?.nome || 'N/A'}</td>
                    <td className="py-3 px-4 text-right">{item.quantidade} {p.unidade || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}