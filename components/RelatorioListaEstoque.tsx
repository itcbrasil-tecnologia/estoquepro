'use client';

import { useState, useMemo } from 'react';
import { CacheData } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioListaEstoque({ caches }: RelatorioProps) {
  const [catFiltro, setCatFiltro] = useState('');
  const [fornFiltro, setFornFiltro] = useState('');
  const [localFiltro, setLocalFiltro] = useState('');
  const [fabFiltro, setFabFiltro] = useState('');
  const [projetoFiltro, setProjetoFiltro] = useState(''); // Estado adicionado

  const produtosFiltrados = useMemo(() => {
    let produtosArray = Array.from(caches.produtos.values());

    if (catFiltro) {
      produtosArray = produtosArray.filter(p => p.categoriaId === catFiltro);
    }
    if (fornFiltro) {
      produtosArray = produtosArray.filter(p => p.fornecedorId === fornFiltro);
    }
    if (fabFiltro) {
      produtosArray = produtosArray.filter(p => p.fabricanteId === fabFiltro);
    }
    
    // Lógica para filtrar por projeto
    if (projetoFiltro) {
        const localidadesDoProjeto = Array.from(caches.localidades.values())
            .filter(l => l.projetoId === projetoFiltro)
            .map(l => l.id);

        const produtosNoProjeto = caches.estoque
            .filter(e => localidadesDoProjeto.includes(e.localidadeId) && e.quantidade > 0)
            .map(e => e.produtoId);
        
        const produtosNoProjetoSet = new Set(produtosNoProjeto);
        produtosArray = produtosArray.filter(p => produtosNoProjetoSet.has(p.id));
    }

    if (localFiltro) {
        const produtosNoLocal = caches.estoque
            .filter(e => e.localidadeId === localFiltro && e.quantidade > 0)
            .map(e => e.produtoId);
        
        const produtosNoLocalSet = new Set(produtosNoLocal);
        produtosArray = produtosArray.filter(p => produtosNoLocalSet.has(p.id));
    }

    return produtosArray;
  }, [caches, catFiltro, fornFiltro, localFiltro, fabFiltro, projetoFiltro]);

  const handleExport = () => {
    const dataToExport = produtosFiltrados.map(p => {
        const totalEstoque = caches.estoque.filter(e => e.produtoId === p.id).reduce((sum, e) => sum + e.quantidade, 0);
        return {
            Produto: p.nome,
            Categoria: caches.categorias.get(p.categoriaId ?? '')?.nome || 'N/A',
            Fornecedor: caches.fornecedores.get(p.fornecedorId ?? '')?.nome || 'N/A',
            Fabricante: caches.fabricantes.get(p.fabricanteId ?? '')?.nome || 'N/A',
            'Estoque Total': totalEstoque,
            Unidade: p.unidade,
        };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_estoque_geral.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={handleExport} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 flex items-center">
            <FontAwesomeIcon icon={faFileCsv} className="mr-2" /> Exportar para CSV
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <select onChange={(e) => setProjetoFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos os Projetos</option>
            {Array.from(caches.projetos.values()).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select onChange={(e) => setLocalFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todas as Localidades</option>{Array.from(caches.localidades.values()).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
        <select onChange={(e) => setCatFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todas as Categorias</option>{Array.from(caches.categorias.values()).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select onChange={(e) => setFabFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todos os Fabricantes</option>{Array.from(caches.fabricantes.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select onChange={(e) => setFornFiltro(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"><option value="">Todos os Fornecedores</option>{Array.from(caches.fornecedores.values()).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
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