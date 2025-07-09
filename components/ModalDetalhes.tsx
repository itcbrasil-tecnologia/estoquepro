'use client';

import React from 'react';
import Modal from './Modal';
import { Produto, CacheData, HistoricoItem } from '@/types';

interface ModalDetalhesProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: CacheData;
}

export default function ModalDetalhes({ isOpen, onClose, produto, caches }: ModalDetalhesProps) {
  if (!produto) return null;

  const estoqueDoProduto = caches.estoque.filter(e => e.produtoId === produto.id && e.quantidade > 0);
  const historicoDoProduto = caches.historico
    .filter(h => h.produtoId === produto.id)
    .sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));

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
        <div className="md:col-span-2 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p><strong>Serial Number:</strong> <span className="font-mono text-gray-800 dark:text-gray-100">{produto.serialNumber || 'N/A'}</span></p>
          <p><strong>Descrição:</strong> <span className="text-gray-800 dark:text-gray-100">{produto.descricao || 'N/A'}</span></p>
          <p><strong>Fabricante/Modelo:</strong> <span className="text-gray-800 dark:text-gray-100">{fabricante?.nome || 'N/A'} / {produto.modelo || 'N/A'}</span></p>
          <p><strong>Categoria:</strong> <span className="text-gray-800 dark:text-gray-100">{categoria?.nome || 'N/A'}</span></p>
          <p><strong>Fornecedor:</strong> <span className="text-gray-800 dark:text-gray-100">{fornecedor?.nome || 'N/A'}</span></p>
          <p><strong>Notas:</strong> <span className="text-gray-800 dark:text-gray-100">{produto.notas_internas || 'N/A'}</span></p>
          
          <div className="mt-4">
            <h4 className="font-bold text-md mb-2 text-gray-800 dark:text-white">Estoque por Localidade</h4>
            <div className="space-y-1 text-sm">
              {estoqueDoProduto.length > 0 ? estoqueDoProduto.map(item => {
                const local = caches.localidades.get(item.localidadeId);
                return (
                  <div key={item.id} className="flex justify-between text-gray-800 dark:text-gray-200">
                    <span>{local?.nome || 'Desconhecido'}</span>
                    <span className="font-semibold">{item.quantidade} {produto.unidade}</span>
                  </div>
                )
              }) : <p className="text-gray-500 dark:text-gray-400">Sem estoque.</p>}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-bold text-md mb-2 text-gray-800 dark:text-white">Documentos</h4>
            <div className="flex flex-wrap gap-2">
              {documentos.length > 0 ? documentos.map((doc: {link: string, nome: string}, index: number) => (
                <a href={doc.link} key={index} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-blue-200">{doc.nome}</a>
              )) : <p className="text-gray-500 dark:text-gray-400">Nenhum documento.</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Histórico de Movimentação</h3>
        <div className="overflow-x-auto">
          {historicoDoProduto.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 p-4">Nenhum histórico de movimentação para este produto.</p>
          ) : (
            <table className="min-w-full bg-white dark:bg-gray-800 text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Qtd</th>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Origem</th>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Destino</th>
                  <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {historicoDoProduto.map(h => {
                    const tipoCor = {'ENTRADA': 'text-green-500', 'SAIDA': 'text-red-500', 'TRANSFERENCIA': 'text-blue-500'}[h.tipo] || 'text-gray-400';
                    const origem = h.localidadeOrigemId ? caches.localidades.get(h.localidadeOrigemId)?.nome : 'EXTERNO';
                    const destino = h.localidadeDestinoId ? caches.localidades.get(h.localidadeDestinoId)?.nome : 'EXTERNO';
                    const usuario = caches.usuarios.get(h.usuario)?.username || 'Desconhecido';
                    return (
                        <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="py-3 px-4">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
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
          )}
        </div>
      </div>
    </Modal>
  );
}