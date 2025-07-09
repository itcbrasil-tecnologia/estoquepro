'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import CardProduto from '@/components/CardProduto';
import ModalProduto from '@/components/ModalProduto';
import ModalDetalhes from '@/components/ModalDetalhes';
import ModalMovimentar from '@/components/ModalMovimentar';
import { Produto, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function PaginaEstoque() {
  const { userRole } = useAuth();
  const { addToast } = useToast();
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(), estoque: [], localidades: new Map(),
    fabricantes: new Map(), categorias: new Map(), fornecedores: new Map(),
    usuarios: new Map(), historico: [],
  });
  const [loading, setLoading] = useState(true);

  const [modalState, setModalState] = useState({
    produto: false,
    detalhes: false,
    movimentar: false,
  });
  
  const [itemSelecionado, setItemSelecionado] = useState<Produto | null>(null);

  useEffect(() => {
    const collectionsToListen: (keyof CacheData)[] = ['produtos', 'estoque', 'localidades', 'fabricantes', 'categorias', 'fornecedores', 'usuarios', 'historico'];
    
    let loadedCount = 0;
    const unsubscribers = collectionsToListen.map(name => 
      onSnapshot(collection(db, name), (snapshot) => {
        setCaches((prevCaches: CacheData) => {
          const newCache = { ...prevCaches };
          if (name === 'estoque' || name === 'historico') {
            newCache[name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          } else {
            const newMap = new Map();
            snapshot.docs.forEach(doc => newMap.set(doc.id, { id: doc.id, ...doc.data() }));
            (newCache as any)[name] = newMap;
          }
          return newCache;
        });
        loadedCount++;
        if (loadedCount === collectionsToListen.length) {
            setLoading(false);
        }
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const handleOpenModal = (tipo: 'add' | 'edit' | 'details' | 'move', produto: Produto | null = null) => {
    setItemSelecionado(produto);
    if (tipo === 'add' || tipo === 'edit') setModalState(s => ({...s, produto: true}));
    if (tipo === 'details') setModalState(s => ({...s, detalhes: true}));
    if (tipo === 'move') setModalState(s => ({...s, movimentar: true}));
  };
  
  const handleCloseModals = () => {
    setModalState({ produto: false, detalhes: false, movimentar: false });
    setItemSelecionado(null);
  };

  const handleDeleteProduto = async (id: string) => {
    if(userRole !== 'master') {
        addToast("Apenas administradores podem excluir produtos.", 'error');
        return;
    }

    const produto = caches.produtos.get(id);
    if (!produto) return;

    const totalEstoque = caches.estoque.filter(e => e.produtoId === id).reduce((sum, e) => sum + e.quantidade, 0);
    if (totalEstoque > 0) {
        addToast(`Não é possível excluir: ainda há ${totalEstoque} ${produto.unidade}(s) em estoque.`, 'error');
        return;
    }

    if (confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"? Todo o seu histórico será perdido.`)) {
        const batch = writeBatch(db);
        batch.delete(doc(db, "produtos", id));
        caches.estoque.filter(e => e.produtoId === id).forEach(item => batch.delete(doc(db, "estoque", item.id)));
        caches.historico.filter(h => h.produtoId === id).forEach(item => batch.delete(doc(db, "historico", item.id)));
        
        try {
            await batch.commit();
            addToast("Produto excluído com sucesso!", 'success');
            handleCloseModals();
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            addToast("Ocorreu um erro ao tentar excluir o produto.", 'error');
        }
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Carregando estoque...</div>;
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Visão Geral do Estoque</h1>
        <button onClick={() => handleOpenModal('add')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Produto
        </button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from(caches.produtos.values()).map(produto => (
          <CardProduto 
            key={produto.id} 
            produto={produto} 
            estoque={caches.estoque}
            fabricantes={caches.fabricantes}
            onEdit={() => handleOpenModal('edit', produto)}
            onDetails={() => handleOpenModal('details', produto)}
            onMove={() => handleOpenModal('move', produto)}
          />
        ))}
      </div>

      <ModalProduto
        isOpen={modalState.produto}
        onClose={handleCloseModals}
        produtoToEdit={itemSelecionado}
        caches={caches}
        onDelete={handleDeleteProduto}
      />
      <ModalDetalhes
        isOpen={modalState.detalhes}
        onClose={handleCloseModals}
        produto={itemSelecionado}
        caches={caches}
      />
      <ModalMovimentar
        isOpen={modalState.movimentar}
        onClose={handleCloseModals}
        produto={itemSelecionado}
        caches={caches}
      />
    </div>
  );
}