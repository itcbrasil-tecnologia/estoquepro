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

  let produtosFiltrados = Array.from(caches.produtos.values());
  if (catFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.categoriaId === catFiltro);
  if (fornFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.fornecedorId === fornFiltro);
  if (localFiltro) {
    const produtosNoLocal = caches.estoque.filter(e => e.localidadeId === localFiltro && e.quantidade > 0).map(e => e.produtoId);
    produtosFiltrados = produtosFiltrados.filter(p => produtosNoLocal.includes(p.id));
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select onChange={(e) => setCatFiltro(e.target.value)} className="p-2 border rounded-lg"><option value="">Todas as Categorias</option>{Array.from(caches.categorias.values()).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select onChange={(e) => setFornFiltro(e.target.value)} className="p-2 border rounded-lg"><option value="">Todos os Fornecedores</option>{Array.from(caches.fornecedores.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select onChange={(e) => setLocalFiltro(e.target.value)} className="p-2 border rounded-lg"><option value="">Todas as Localidades</option>{Array.from(caches.localidades.values()).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
      </div>
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-100"><tr>
            <th className="py-2 px-3 text-left font-medium">Produto</th>
            <th className="py-2 px-3 text-left font-medium">Categoria</th>
            <th className="py-2 px-3 text-left font-medium">Fornecedor</th>
            <th className="py-2 px-3 text-right font-medium">Estoque Total</th>
        </tr></thead>
        <tbody className="divide-y">
            {produtosFiltrados.map(p => {
                const totalEstoque = caches.estoque.filter(e => e.produtoId === p.id).reduce((sum, e) => sum + e.quantidade, 0);
                return <tr key={p.id}>
                    <td className="py-2 px-3">{p.nome}</td>
                    <td className="py-2 px-3">{caches.categorias.get(p.categoriaId ?? '')?.nome || 'N/A'}</td>
                    <td className="py-2 px-3">{caches.fornecedores.get(p.fornecedorId ?? '')?.nome || 'N/A'}</td>
                    <td className="py-2 px-3 text-right">{totalEstoque} {p.unidade}</td>
                </tr>
            })}
        </tbody>
      </table>
    </div>
  );
}