'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CacheData, Produto, EstoqueItem, HistoricoItem, Usuario } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import TabelaMovimentacoesRecentes from '@/components/TabelaMovimentacoesRecentes';
import TabelaEstoqueBaixo from '@/components/TabelaEstoqueBaixo';
import ModalDetalhes from '@/components/ModalDetalhes';
import Modal from '@/components/Modal'; // Importa o componente de Modal genérico

const SummaryCard = ({ title, value, icon, colorClass, children }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between transition-transform transform hover:-translate-y-1">
    <div className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            <FontAwesomeIcon icon={icon} className="text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
    {children && <div className="mt-4 self-end">{children}</div>}
  </div>
);

export default function DashboardPage() {
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(), estoque: [], localidades: new Map(),
    fabricantes: new Map(), categorias: new Map(), fornecedores: new Map(),
    usuarios: new Map(), historico: [],
  });
  const [loading, setLoading] = useState(true);
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [isEstoqueBaixoModalOpen, setIsEstoqueBaixoModalOpen] = useState(false);
  const [produtoDetalhes, setProdutoDetalhes] = useState<Produto | null>(null);

  useEffect(() => {
    const collectionsToListen: (keyof CacheData)[] = ['produtos', 'estoque', 'historico', 'usuarios', 'localidades', 'fabricantes', 'categorias', 'fornecedores'];
    
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
        if(loadedCount >= collectionsToListen.length) {
            setLoading(false);
        }
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const handleOpenDetalhes = (produto: Produto) => {
    setProdutoDetalhes(produto);
    setIsEstoqueBaixoModalOpen(false); // Fecha o modal de estoque baixo
    setIsDetalhesModalOpen(true); // Abre o modal de detalhes do produto
  };

  const totalProdutos = caches.produtos.size;
  
  const itensComEstoqueBaixo = Array.from(caches.produtos.values()).filter(p => {
    const totalEstoque = caches.estoque
        .filter(e => e.produtoId === p.id)
        .reduce((sum, e) => sum + e.quantidade, 0);
    return totalEstoque < (p.estoqueMinimo || 0);
  });

  if (loading) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Carregando Dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total de Produtos" value={totalProdutos} icon={faBoxesStacked} colorClass="bg-blue-500" />
        <SummaryCard title="Itens com Estoque Baixo" value={itensComEstoqueBaixo.length} icon={faExclamationTriangle} colorClass="bg-red-500">
            <button 
                onClick={() => setIsEstoqueBaixoModalOpen(true)} 
                className="text-sm font-semibold px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 transition-colors"
            >
                Detalhes
            </button>
        </SummaryCard>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Últimas Movimentações</h2>
        <TabelaMovimentacoesRecentes caches={caches} />
      </div>

      <Modal
        isOpen={isEstoqueBaixoModalOpen}
        onClose={() => setIsEstoqueBaixoModalOpen(false)}
        title="Itens com Estoque Baixo"
      >
        <TabelaEstoqueBaixo 
            produtos={Array.from(caches.produtos.values())} 
            estoque={caches.estoque}
            onDetailsClick={handleOpenDetalhes}
        />
      </Modal>

      <ModalDetalhes 
        isOpen={isDetalhesModalOpen}
        onClose={() => setIsDetalhesModalOpen(false)}
        produto={produtoDetalhes}
        caches={caches}
      />
    </div>
  );
}
