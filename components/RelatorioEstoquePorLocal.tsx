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
        <label htmlFor="relatorio-local-select" className="block text-sm font-medium text-gray-700">Selecione uma Localidade</label>
        <select id="relatorio-local-select" onChange={handleSelectChange} className="mt-1 block w-full md:w-1/3 p-2 border border-gray-300 rounded-lg">
          <option value="">Selecione...</option>
          {Array.from(caches.localidades.entries()).map(([id, local]: [string, Localidade]) => (
            <option key={id} value={id}>{local.nome}</option>
          ))}
        </select>
      </div>
      <div id="relatorio-local-resultado">
        {!localId ? (
          <p className="text-gray-500">Selecione um local para ver os produtos.</p>
        ) : estoqueNoLocal.length === 0 ? (
          <p className="text-gray-500">Nenhum produto encontrado neste local.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left font-medium">Produto</th>
                <th className="py-2 px-3 text-left font-medium">Fabricante</th>
                <th className="py-2 px-3 text-right font-medium">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {estoqueNoLocal.map((item: EstoqueItem) => {
                const p = caches.produtos.get(item.produtoId);
                if (!p) return null;
                const fab = p.fabricanteId ? caches.fabricantes.get(p.fabricanteId) : null;
                return (
                  <tr key={item.id}>
                    <td className="py-2 px-3">{p.nome}</td>
                    <td className="py-2 px-3">{fab?.nome || 'N/A'}</td>
                    <td className="py-2 px-3 text-right">{item.quantidade} {p.unidade || ''}</td>
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