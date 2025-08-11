'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Modal from './Modal';
import { Produto, CacheData, Localidade, UnidadeEstoqueItem, HistoricoItem, Projeto } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface ModalDetalhesProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: CacheData;
}

const placeholderImage = 'https://firebasestorage.googleapis.com/v0/b/estoque-5bd20.appspot.com/o/produtos%2FNA.jpg?alt=media&token=d90a76f7-f5a6-48d5-b4bd-096b5dd0770e';

export default function ModalDetalhes({ isOpen, onClose, produto, caches }: ModalDetalhesProps) {
  const [isStockAccordionOpen, setIsStockAccordionOpen] = useState(false);

  if (!produto) return null;

  const estoqueDoProduto = caches.estoque.filter(e => e.produtoId === produto.id && e.quantidade > 0);
  const unidadesDoProduto = (caches.unidadesEstoque || []).filter(u => u.produtoId === produto.id && u.status === 'Em Estoque');
  
  const unidadesPorLocal = unidadesDoProduto.reduce((acc, unidade) => {
    const local = caches.localidades.get(unidade.localidadeId);
    const projeto = local?.projetoId ? caches.projetos.get(local.projetoId) : null;
    const localNome = local?.nome || 'Desconhecido';
    if (!acc[localNome]) {
      acc[localNome] = { local, projeto, sns: [] };
    }
    acc[localNome].sns.push(unidade.serialNumber);
    return acc;
  }, {} as Record<string, { local: Localidade | undefined, projeto: Projeto | null | undefined, sns: string[] }>);

  const fabricante = produto.fabricanteId ? caches.fabricantes.get(produto.fabricanteId) : null;
  const categoria = produto.categoriaId ? caches.categorias.get(produto.categoriaId) : null;
  const fornecedor = produto.fornecedorId ? caches.fornecedores.get(produto.fornecedorId) : null;

  let documentos = [];
  try {
    documentos = produto.documentos ? JSON.parse(produto.documentos) : [];
  } catch (e) {
    console.error("Erro ao parsear documentos:", e);
  }

  const historicoDoProduto = caches.historico
    .filter(h => h.produtoId === produto.id)
    .sort((a, b) => (b.data?.toDate().getTime() || 0) - (a.data?.toDate().getTime() || 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={produto.nome}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Image
            src={produto.foto_url || placeholderImage}
            alt={`Foto de ${produto.nome}`}
            width={400}
            height={400}
            className="rounded-lg w-full h-auto object-cover shadow-md"
          />
        </div>
        <div className="md:col-span-2 space-y-3 text-sm">
          <p><strong>Tipo de Controle:</strong> <span className="font-semibold">{produto.tipoControle || 'Quantidade'}</span></p>
          <p><strong>Descrição:</strong> <span>{produto.descricao || 'N/A'}</span></p>
          <p><strong>Fabricante/Modelo:</strong> <span>{fabricante?.nome || 'N/A'} / {produto.modelo || 'N/A'}</span></p>
          <p><strong>Categoria:</strong> <span>{categoria?.nome || 'N/A'}</span></p>
          <p><strong>Fornecedor:</strong> <span>{fornecedor?.nome || 'N/A'}</span></p>
          <p><strong>Notas:</strong> <span>{produto.notas_internas || 'N/A'}</span></p>

          <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <button onClick={() => setIsStockAccordionOpen(!isStockAccordionOpen)} className="w-full flex justify-between items-center">
              <h4 className="font-bold text-md">Estoque por Localidade</h4>
              <FontAwesomeIcon icon={faChevronDown} className={`transition-transform ${isStockAccordionOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStockAccordionOpen && (
              <div className="mt-2 space-y-2 text-sm pl-2">
                {produto.tipoControle === 'Serial Number' ? (
                  Object.entries(unidadesPorLocal).length > 0 ? Object.entries(unidadesPorLocal).map(([localNome, data]) => (
                    <div key={localNome}>
                      <div className="flex items-center">
                        <span style={{ backgroundColor: data.projeto?.cor || '#ccc' }} className="w-3 h-3 rounded-full mr-2 border border-gray-300 dark:border-gray-600"></span>
                        <p className="font-semibold">{localNome} ({data.sns.length})</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 pl-5">
                        {data.sns.map((sn: string) => <span key={sn} className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{sn}</span>)}
                      </div>
                    </div>
                  )) : <p className="text-gray-500 dark:text-gray-400">Sem estoque.</p>
                ) : (
                  estoqueDoProduto.length > 0 ? estoqueDoProduto.map(item => {
                    const local = caches.localidades.get(item.localidadeId);
                    const projeto = local?.projetoId ? caches.projetos.get(local.projetoId) : null;
                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span style={{ backgroundColor: projeto?.cor || '#ccc' }} className="w-3 h-3 rounded-full mr-2 border border-gray-300 dark:border-gray-600"></span>
                          <span>{local?.nome || 'Desconhecido'}</span>
                        </div>
                        <span className="font-semibold">{item.quantidade} {produto.unidade}</span>
                      </div>
                    )
                  }) : <p className="text-gray-500 dark:text-gray-400">Sem estoque.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <h4 className="font-bold text-md mb-2">Documentos</h4>
            <div className="flex flex-wrap gap-2">
              {documentos.length > 0 ? documentos.map((doc: { link: string, nome: string }, index: number) => (
                <a href={doc.link} key={index} target="_blank" rel="noopener noreferrer" className="bg-teal-100 text-teal-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-teal-200">{doc.nome}</a>
              )) : <p className="text-gray-500 dark:text-gray-400">Nenhum documento.</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Histórico de Movimentação</h3>
        <div className="overflow-x-auto">
          {historicoDoProduto.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 p-4">Nenhum histórico de movimentação para este produto.</p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 font-medium">Data</th>
                  <th className="py-3 px-4 font-medium">Tipo</th>
                  <th className="py-3 px-4 font-medium text-right">Qtd</th>
                  <th className="py-3 px-4 font-medium">Origem</th>
                  <th className="py-3 px-4 font-medium">Destino</th>
                  <th className="py-3 px-4 font-medium">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {historicoDoProduto.map((h: HistoricoItem) => {
                  const tipoCor = { 'ENTRADA': 'text-green-500', 'SAIDA': 'text-red-500', 'TRANSFERENCIA': 'text-blue-500' }[h.tipo] || 'text-gray-400';
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