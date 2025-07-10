'use client';

import { useState } from 'react';
import { CacheData } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioListaEstoque({ caches }: RelatorioProps) {
  const [catFiltro, setCatFiltro] = useState('');
  const [fornFiltro, setFornFiltro] = useState('');
  const [localFiltro, setLocalFiltro] = useState('');
  const [fabFiltro, setFabFiltro] = useState('');

  let produtosFiltrados = Array.from(caches.produtos.values());
  if (catFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.categoriaId === catFiltro);
  if (fornFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.fornecedorId === fornFiltro);
  if (fabFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.fabricanteId === fabFiltro);
  if (localFiltro) {
    const produtosNoLocal = caches.estoque.filter(e => e.localidadeId === localFiltro && e.quantidade > 0).map(e => e.produtoId);
    produtosFiltrados = produtosFiltrados.filter(p => produtosNoLocal.includes(p.id));
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <select onChange={(e) => setCatFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todas as Categorias</option>{Array.from(caches.categorias.values()).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select onChange={(e) => setFornFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todos os Fornecedores</option>{Array.from(caches.fornecedores.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select onChange={(e) => setFabFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todos os Fabricantes</option>{Array.from(caches.fabricantes.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select onChange={(e) => setLocalFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todas as Localidades</option>{Array.from(caches.localidades.values()).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase"><tr>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Categoria</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Fornecedor</th>
                <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Estoque Total</th>
            </tr></thead>
            <tbody className="divide-y dark:divide-gray-700">
                {produtosFiltrados.map(p => {
                    const totalEstoque = caches.estoque.filter(e => e.produtoId === p.id).reduce((sum, e) => sum + e.quantidade, 0);
                    return <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="py-3 px-4">{p.nome}</td>
                        <td className="py-3 px-4">{caches.categorias.get(p.categoriaId ?? '')?.nome || 'N/A'}</td>
                        <td className="py-3 px-4">{caches.fornecedores.get(p.fornecedorId ?? '')?.nome || 'N/A'}</td>
                        <td className="py-3 px-4 text-right">{totalEstoque} {p.unidade}</td>
                    </tr>
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
}