'use client';

import { useState } from 'react';
import { CacheData } from '@/types';
import Paginacao from './Paginacao';

interface RelatorioProps {
  caches: CacheData;
}

const ITENS_POR_PAGINA = 15;

export default function RelatorioMovimentacoes({ caches }: RelatorioProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');

  let historicoFiltrado = [...caches.historico];

  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    historicoFiltrado = historicoFiltrado.filter(h => {
        const dataMov = h.data.toDate();
        return dataMov >= inicio && dataMov <= fim;
    });
  }
  if (tipoFiltro) {
    historicoFiltrado = historicoFiltrado.filter(h => h.tipo === tipoFiltro);
  }
  if (usuarioFiltro) {
    historicoFiltrado = historicoFiltrado.filter(h => h.usuario === usuarioFiltro);
  }

  const historicoOrdenado = historicoFiltrado.sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));

  const totalPages = Math.ceil(historicoOrdenado.length / ITENS_POR_PAGINA);
  const startIndex = (currentPage - 1) * ITENS_POR_PAGINA;
  const endIndex = startIndex + ITENS_POR_PAGINA;
  const historicoPaginado = historicoOrdenado.slice(startIndex, endIndex);

  return (
    <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                <input type="date" onChange={e => setDataInicio(e.target.value)} className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                <input type="date" onChange={e => setDataFim(e.target.value)} className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select onChange={e => setTipoFiltro(e.target.value)} className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Todos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuário</label>
                <select onChange={e => setUsuarioFiltro(e.target.value)} className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Todos</option>
                    {Array.from(caches.usuarios.values()).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
                    <tr>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Qtd</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Origem</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Destino</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Usuário</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                    {historicoPaginado.map(h => {
                        const produto = caches.produtos.get(h.produtoId);
                        if (!produto) return null;
                        const tipoCor = {'ENTRADA': 'text-green-500', 'SAIDA': 'text-red-500', 'TRANSFERENCIA': 'text-blue-500'}[h.tipo] || 'text-gray-400';
                        const origem = h.localidadeOrigemId ? caches.localidades.get(h.localidadeOrigemId)?.nome : 'EXTERNO';
                        const destino = h.localidadeDestinoId ? caches.localidades.get(h.localidadeDestinoId)?.nome : 'EXTERNO';
                        const usuario = caches.usuarios.get(h.usuario)?.username || 'Desconhecido';
                        return (
                            <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="py-3 px-4">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                                <td className="py-3 px-4">{produto.nome}</td>
                                <td className={`py-3 px-4 font-bold ${tipoCor}`}>{h.tipo}</td>
                                <td className="py-3 px-4 text-right">{h.quantidade}</td>
                                <td className="py-3 px-4">{origem}</td>
                                <td className="py-3 px-4">{destino}</td>
                                <td className="py-3 px-4">{usuario}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <Paginacao 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />
    </div>
  );
}