'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Produto, EstoqueItem, Categoria, Fornecedor } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

interface ProdutoListItemProps {
  produto: Produto;
  estoque: EstoqueItem[];
  categoria?: Categoria;
  fornecedor?: Fornecedor;
  onEdit: () => void;
  onDetails: () => void;
  onMove: () => void;
}

const placeholderImage = 'https://firebasestorage.googleapis.com/v0/b/estoque-5bd20.appspot.com/o/produtos%2FNA.jpg?alt=media&token=d90a76f7-f5a6-48d5-b4bd-096b5dd0770e';

export default function ProdutoListItem({ produto, estoque, categoria, fornecedor, onEdit, onDetails, onMove }: ProdutoListItemProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLTableRowElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        if (!actionsRef.current.previousElementSibling?.contains(event.target as Node)) {
            setActionsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionsRef]);


  return (
    <>
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
                <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{produto.nome}</p>
                    <p className="md:hidden text-xs text-gray-500 dark:text-gray-400">{categoria?.nome || 'N/A'}</p>
                </div>
            </div>
        </td>
        <td className="py-3 px-4 hidden md:table-cell">{categoria?.nome || 'N/A'}</td>
        <td className="py-3 px-4 hidden md:table-cell">{fornecedor?.nome || 'N/A'}</td>
        <td className={`py-3 px-4 text-right font-bold ${corEstoque}`}>{totalEstoque} {produto.unidade}</td>
        <td className="py-3 px-4 text-center">
            <div className="hidden md:flex justify-end space-x-2">
                <button onClick={onDetails} className="text-sm font-semibold px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors">Detalhes</button>
                <button onClick={onMove} className="text-sm font-semibold px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition-colors">Movimentar</button>
                <button onClick={onEdit} className="text-sm font-semibold px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/40 transition-colors">Editar</button>
            </div>
            <div className="md:hidden">
                <button onClick={(e) => { e.stopPropagation(); setActionsOpen(!actionsOpen); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <FontAwesomeIcon icon={faCaretDown} className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </td>
      </tr>
      {actionsOpen && (
        <tr className="md:hidden" ref={actionsRef}>
            <td colSpan={3} className="p-3 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-start items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ações:</span>
                    <button onClick={onDetails} className="text-sm font-semibold px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors">Detalhes</button>
                    <button onClick={onMove} className="text-sm font-semibold px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 transition-colors">Movimentar</button>
                    <button onClick={onEdit} className="text-sm font-semibold px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/40 transition-colors">Editar</button>
                </div>
            </td>
        </tr>
      )}
    </>
  );
}