'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Produto, EstoqueItem, Fabricante, UnidadeEstoqueItem } from '@/types';

interface CardProdutoProps {
  produto: Produto;
  estoque: EstoqueItem[];
  unidadesEstoque: UnidadeEstoqueItem[];
  fabricantes: Map<string, Fabricante>;
  onEdit: () => void;
  onDetails: () => void;
  onMove: () => void;
}

const placeholderImage = 'https://firebasestorage.googleapis.com/v0/b/estoque-5bd20.appspot.com/o/produtos%2FNA.jpg?alt=media&token=d90a76f7-f5a6-48d5-b4bd-096b5dd0770e';

export default function CardProduto({ produto, estoque, unidadesEstoque, fabricantes, onEdit, onDetails, onMove }: CardProdutoProps) {
  const { userRole } = useAuth();

  const totalEstoque =
    produto.tipoControle === 'Serial Number'
      ? (unidadesEstoque || []).filter(u => u.produtoId === produto.id && u.status === 'Em Estoque').length
      : (estoque || []).filter(e => e.produtoId === produto.id).reduce((sum, e) => sum + e.quantidade, 0);

  const locaisComEstoque =
    produto.tipoControle === 'Serial Number'
      ? new Set((unidadesEstoque || []).filter(u => u.produtoId === produto.id && u.status === 'Em Estoque').map(u => u.localidadeId)).size
      : (estoque || []).filter(e => e.produtoId === produto.id && e.quantidade > 0).length;

  const fabricante = produto.fabricanteId ? fabricantes.get(produto.fabricanteId) : null;

  let corEstoque = 'text-green-500';
  if (totalEstoque <= 0) {
    corEstoque = 'text-red-500';
  } else if (produto.estoqueMinimo && totalEstoque <= produto.estoqueMinimo / 2) {
    corEstoque = 'text-red-500';
  } else if (produto.estoqueMinimo && totalEstoque < produto.estoqueMinimo) {
    corEstoque = 'text-yellow-500';
  }

  return (
    <div className="card-item bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:-translate-y-1 flex flex-col">
      <div className="flex items-start p-4 flex-grow">
        <Image
          src={produto.foto_url || placeholderImage}
          alt={`Foto de ${produto.nome}`}
          width={96}
          height={96}
          className="w-24 h-24 object-cover rounded-md mr-4"
        />
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{produto.nome}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{fabricante?.nome || ''} {produto.modelo || ''}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{produto.serialNumber || ''}</p>
          <div className={`mt-2 text-xl font-bold ${corEstoque}`}>
            {totalEstoque} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{produto.unidade}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">em {locaisComEstoque} locais</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-end gap-3 mt-auto">
        <button onClick={onDetails} className="btn-action btn-action-details">Detalhes</button>
        <button onClick={onMove} className="btn-action btn-action-move">Movimentar</button>
        <button onClick={onEdit} className="btn-action btn-action-edit">Editar</button>
      </div>
    </div>
  );
}