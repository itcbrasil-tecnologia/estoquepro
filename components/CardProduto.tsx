'use client';

import React from 'react';
import Image from 'next/image'; // Importa o componente Image
import { useAuth } from '@/contexts/AuthContext';
import { Produto, EstoqueItem, Fabricante } from '@/types';

interface CardProdutoProps {
  produto: Produto;
  estoque: EstoqueItem[];
  fabricantes: Map<string, Fabricante>;
  onEdit: () => void;
  onDetails: () => void;
  onMove: () => void;
}

export default function CardProduto({ produto, estoque, fabricantes, onEdit, onDetails, onMove }: CardProdutoProps) {
  const { userRole } = useAuth();

  const totalEstoque = estoque.filter(e => e.produtoId === produto.id).reduce((sum, e) => sum + e.quantidade, 0);
  const locaisComEstoque = estoque.filter(e => e.produtoId === produto.id && e.quantidade > 0).length;
  const fabricante = produto.fabricanteId ? fabricantes.get(produto.fabricanteId) : null;
  const cor = totalEstoque <= 0 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="card-item bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:-translate-y-1">
      <div className="flex items-start p-4">
        <Image 
          src={produto.foto_url || 'https://placehold.co/100x100/e2e8f0/cbd5e0?text=N/A'} 
          alt={`Foto de ${produto.nome}`} 
          width={96}
          height={96}
          className="w-24 h-24 object-cover rounded-md mr-4" 
        />
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{produto.nome}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{fabricante?.nome || ''} {produto.modelo || ''}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{produto.serialNumber || ''}</p>
          <div className={`mt-2 text-xl font-bold ${cor}`}>
            {totalEstoque} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{produto.unidade}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">em {locaisComEstoque} locais</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-end space-x-3">
        <button onClick={onDetails} className="text-sm font-semibold px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors">Detalhes</button>
        <button onClick={onMove} className="text-sm font-semibold px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition-colors">Movimentar</button>
        {userRole === 'master' && (
          <button onClick={onEdit} className="text-sm font-semibold px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/80 transition-colors">Editar</button>
        )}
      </div>
    </div>
  );
}