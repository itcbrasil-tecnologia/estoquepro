'use client';

import React from 'react';
import { Produto, EstoqueItem, Fabricante } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

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
  const cor = totalEstoque <= 0 ? 'text-red-500' : 'text-green-600';

  return (
    <div className="card-item bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:-translate-y-1">
      <div className="flex items-start p-4">
        <img src={produto.foto_url || 'https://placehold.co/100x100/e2e8f0/cbd5e0?text=N/A'} alt={`Foto de ${produto.nome}`} className="w-24 h-24 object-cover rounded-md mr-4" />
        <div className="flex-grow">
          <h3 className="font-bold text-lg">{produto.nome}</h3>
          <p className="text-sm text-gray-500">{fabricante?.nome || ''} {produto.modelo || ''}</p>
          <p className="text-xs text-gray-400 font-mono">{produto.serialNumber || ''}</p>
          <div className={`mt-2 text-xl font-bold ${cor}`}>
            {totalEstoque} <span className="text-sm font-medium text-gray-500">{produto.unidade}</span>
          </div>
          <p className="text-xs text-gray-400">em {locaisComEstoque} locais</p>
        </div>
      </div>
      <div className="bg-gray-50 p-3 flex justify-end space-x-3">
        <button onClick={onDetails} className="text-sm text-blue-600 font-semibold">Detalhes</button>
        <button onClick={onMove} className="text-sm text-green-600 font-semibold">Movimentar</button>
        {userRole === 'master' && (
          <button onClick={onEdit} className="text-sm text-yellow-600 font-semibold">Editar</button>
        )}
      </div>
    </div>
  );
}