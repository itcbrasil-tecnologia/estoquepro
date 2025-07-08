'use client';

import { useState } from 'react';
import { CacheData } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioListaFabricante({ caches }: RelatorioProps) {
  const [fabFiltro, setFabFiltro] = useState('');
  const [catFiltro, setCatFiltro] = useState('');

  let produtosFiltrados = Array.from(caches.produtos.values());
  if (fabFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.fabricanteId === fabFiltro);
  if (catFiltro) produtosFiltrados = produtosFiltrados.filter(p => p.categoriaId === catFiltro);
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select onChange={(e) => setFabFiltro(e.target.value)} className="p-2 border rounded-lg"><option value="">Todos os Fabricantes</option>{Array.from(caches.fabricantes.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <select onChange={(e) => setCatFiltro(e.target.value)} className="p-2 border rounded-lg"><option value="">Todas as Categorias</option>{Array.from(caches.categorias.values()).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      </div>
      <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100"><tr>
              <th className="py-2 px-3 text-left font-medium">Produto</th>
              <th className="py-2 px-3 text-left font-medium">Fabricante</th>
              <th className="py-2 px-3 text-left font-medium">Categoria</th>
              <th className="py-2 px-3 text-right font-medium">Estoque Total</th>
          </tr></thead>
          <tbody className="divide-y">
              {produtosFiltrados.map(p => {
                  const totalEstoque = caches.estoque.filter(e => e.produtoId === p.id).reduce((sum, e) => sum + e.quantidade, 0);
                  return <tr key={p.id}>
                      <td className="py-2 px-3">{p.nome}</td>
                      <td className="py-2 px-3">{caches.fabricantes.get(p.fabricanteId ?? '')?.nome || 'N/A'}</td>
                      <td className="py-2 px-3">{caches.categorias.get(p.categoriaId ?? '')?.nome || 'N/A'}</td>
                      <td className="py-2 px-3 text-right">{totalEstoque} {p.unidade}</td>
                  </tr>
              })}
          </tbody>
      </table>
    </div>
  );
}