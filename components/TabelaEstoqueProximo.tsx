'use client';

import { Produto, EstoqueItem } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface TabelaProps {
  produtos: Produto[];
  estoque: EstoqueItem[];
  onDetailsClick: (produto: Produto) => void;
}

export default function TabelaEstoqueProximo({ produtos, estoque, onDetailsClick }: TabelaProps) {
  if (produtos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Nenhum item próximo do estoque mínimo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
        <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
          <tr>
            <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
            <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-center">Estoque Atual</th>
            <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-center">Estoque Mínimo</th>
            <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {produtos.map(produto => {
            const totalEstoque = estoque
                .filter(e => e.produtoId === produto.id)
                .reduce((sum, e) => sum + e.quantidade, 0);

            return (
              <tr key={produto.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="py-3 px-4 font-medium">{produto.nome}</td>
                <td className="py-3 px-4 text-center font-bold text-yellow-500">{totalEstoque}</td>
                <td className="py-3 px-4 text-center">{produto.estoqueMinimo}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => onDetailsClick(produto)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span className="ml-2">Detalhes</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}