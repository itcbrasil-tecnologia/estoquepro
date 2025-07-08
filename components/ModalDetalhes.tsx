'use client';

import React from 'react';
import Modal from './Modal';
import { Produto, CacheData } from '@/types';

interface ModalDetalhesProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: CacheData;
}

export default function ModalDetalhes({ isOpen, onClose, produto, caches }: ModalDetalhesProps) {
  if (!produto) return null;

  const estoqueDoProduto = caches.estoque.filter(e => e.produtoId === produto.id && e.quantidade > 0);
  const fabricante = produto.fabricanteId ? caches.fabricantes.get(produto.fabricanteId) : null;
  const categoria = produto.categoriaId ? caches.categorias.get(produto.categoriaId) : null;
  const fornecedor = produto.fornecedorId ? caches.fornecedores.get(produto.fornecedorId) : null;
  
  let documentos = [];
  try {
    documentos = produto.documentos ? JSON.parse(produto.documentos) : [];
  } catch (e) {
    console.error("Erro ao parsear documentos:", e);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={produto.nome}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <img src={produto.foto_url || 'https://placehold.co/400x400/e2e8f0/cbd5e0?text=N/A'} alt={`Foto de ${produto.nome}`} className="rounded-lg w-full h-auto object-cover shadow-md"/>
        </div>
        <div className="md:col-span-2 space-y-3 text-sm">
          <p><strong>Serial Number:</strong> <span className="font-mono">{produto.serialNumber || 'N/A'}</span></p>
          <p><strong>Descrição:</strong> <span>{produto.descricao || 'N/A'}</span></p>
          <p><strong>Fabricante/Modelo:</strong> <span>{fabricante?.nome || 'N/A'} / {produto.modelo || 'N/A'}</span></p>
          <p><strong>Categoria:</strong> <span>{categoria?.nome || 'N/A'}</span></p>
          <p><strong>Fornecedor:</strong> <span>{fornecedor?.nome || 'N/A'}</span></p>
          <p><strong>Notas:</strong> <span>{produto.notas_internas || 'N/A'}</span></p>
          
          <div className="mt-4">
            <h4 className="font-bold text-md mb-2">Estoque por Localidade</h4>
            <div className="space-y-1 text-sm">
              {estoqueDoProduto.length > 0 ? estoqueDoProduto.map(item => {
                const local = caches.localidades.get(item.localidadeId);
                return (
                  <div key={item.id} className="flex justify-between">
                    <span>{local?.nome || 'Desconhecido'}</span>
                    <span className="font-semibold">{item.quantidade} {produto.unidade}</span>
                  </div>
                )
              }) : <p className="text-gray-500">Sem estoque.</p>}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-bold text-md mb-2">Documentos</h4>
            <div className="flex flex-wrap gap-2">
              {documentos.length > 0 ? documentos.map((doc: {link: string, nome: string}, index: number) => (
                <a href={doc.link} key={index} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-blue-200">{doc.nome}</a>
              )) : <p className="text-gray-500">Nenhum documento.</p>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}