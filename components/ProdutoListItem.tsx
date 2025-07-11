'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Produto, EstoqueItem, Categoria, Fornecedor } from '@/types';

interface ProdutoListItemProps {
  produto: Produto;
  estoque: EstoqueItem[];
  categoria?: Categoria;
  fornecedor?: Fornecedor;
  onEdit: () => void;
  onDetails: () => void;
  onMove: () => void;
}

const placeholderImage = 'https://firebasestorage.googleapis.com/v0/b/estoque-5bd20.firebasestorage.app/o/produtos%2FNA.jpg?alt=media&token=d90a76f7-f5a6-48d5-b4bd-096b5dd0770e';

export default function ProdutoListItem({ produto, estoque, categoria, fornecedor, onEdit, onDetails, onMove }: ProdutoListItemProps) {
  const { userRole } = useAuth();

  const totalEstoque = estoque.filter(e => e.produtoId === produto.id).reduce((sum, e) => sum + e.quantidade, 0);
  
  let corEstoque = 'text-green-500';
  if (produto.estoqueMinimo && totalEstoque < produto.estoqueMinimo) {
    corEstoque = 'text-yellow-500';
  }
  if (produto.estoqueMinimo && totalEstoque <= produto.estoqueMinimo / 2) {
    corEstoque = 'text-red-500';
  }
  if (totalEstoque <= 0) {
      corEstoque = 'text-red-500';
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-600">
        <td className="py-3 px-4">
            <div className="flex items-center space-x-3">
                <Image 
                  src={produto.foto_url || placeholderImage} 
                  alt={`Foto de ${produto.nome}`} 
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded-md" 
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">{produto.nome}</span>
            </div>
        </td>
        <td className="py-3 px-4">{categoria?.nome || 'N/A'}</td>
        <td className="py-3 px-4">{fornecedor?.nome || 'N/A'}</td>
        <td className={`py-3 px-4 text-right font-bold ${corEstoque}`}>{totalEstoque} {produto.unidade}</td>
        <td className="py-3 px-4 text-right">
            <div className="flex justify-end space-x-3">
                <button onClick={onDetails} className="text-sm font-semibold px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors">Detalhes</button>
                <button onClick={onMove} className="text-sm font-semibold px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition-colors">Movimentar</button>
                <button onClick={onEdit} className="text-sm font-semibold px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/80 transition-colors">Editar</button>
            </div>
        </td>
    </tr>
  );
}