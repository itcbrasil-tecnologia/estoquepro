'use client';

import { CacheData } from '@/types';
import Paginacao from './Paginacao';
import { useState } from 'react';

interface TabelaProps {
  caches: CacheData;
}

const ITENS_POR_PAGINA = 5;

export default function TabelaMovimentacoesRecentes({ caches }: TabelaProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const historicoOrdenado = [...caches.historico]
    .sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));
    
  const totalPages = Math.ceil(historicoOrdenado.length / ITENS_POR_PAGINA);
  const startIndex = (currentPage - 1) * ITENS_POR_PAGINA;
  const endIndex = startIndex + ITENS_POR_PAGINA;
  const historicoPaginado = historicoOrdenado.slice(startIndex, endIndex);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
                    <tr>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Qtd</th>
                        <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Usuário</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {historicoPaginado.map(h => {
                        const produto = caches.produtos.get(h.produtoId);
                        if (!produto) return null;
                        const tipoCor = {'ENTRADA': 'text-green-500', 'SAIDA': 'text-red-500', 'TRANSFERENCIA': 'text-blue-500'}[h.tipo] || 'text-gray-400';
                        const usuario = caches.usuarios.get(h.usuario)?.username || 'Desconhecido';
                        return (
                            <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="py-3 px-4 whitespace-nowrap">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                                <td className="py-3 px-4 font-medium">{produto.nome}</td>
                                <td className={`py-3 px-4 font-bold ${tipoCor}`}>{h.tipo}</td>
                                <td className="py-3 px-4 text-right">{h.quantidade}</td>
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