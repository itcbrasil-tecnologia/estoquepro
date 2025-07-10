'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CacheData, Produto } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faExclamationTriangle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import TabelaMovimentacoesRecentes from '@/components/TabelaMovimentacoesRecentes';
import TabelaEstoqueBaixo from '@/components/TabelaEstoqueBaixo';
import TabelaEstoqueProximo from '@/components/TabelaEstoqueProximo';
import ModalDetalhes from '@/components/ModalDetalhes';
import Modal from '@/components/Modal';

const SummaryCard = ({ title, value, icon, colorClass, children, onClick }: any) => (
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
  const { user, loading: authLoading } = useAuth();
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(), estoque: [], localidades: new Map(),
    fabricantes: new Map(), categorias: new Map(), fornecedores: new Map(),
    usuarios: new Map(), historico: [], projetos: new Map(),
  });
  const [dataLoading, setDataLoading] = useState(true);
  
  const [modalState, setModalState] = useState({
      detalhes: false,
      estoqueBaixo: false,
      estoqueProximo: false
  });
  const [produtoDetalhes, setProdutoDetalhes] = useState<Produto | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const collectionsToListen: (keyof CacheData)[] = ['produtos', 'estoque', 'historico', 'usuarios', 'localidades', 'fabricantes', 'categorias', 'fornecedores', 'projetos'];
    
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
      })
    );
    setDataLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, [authLoading]);

  const handleOpenDetalhes = (produto: Produto) => {
    setProdutoDetalhes(produto);
    setModalState({ detalhes: true, estoqueBaixo: false, estoqueProximo: false });
  };

  const { itensEstoqueBaixo, itensEstoqueProximo } = useMemo(() => {
    const produtosArray = Array.from(caches.produtos.values());
    const baixo: Produto[] = [];
    const proximo: Produto[] = [];

    produtosArray.forEach(p => {
        const totalEstoque = caches.estoque
            .filter(e => e.produtoId === p.id)
            .reduce((sum, e) => sum + e.quantidade, 0);
        
        const estoqueMinimo = p.estoqueMinimo || 0;
        if(estoqueMinimo > 0) {
            if(totalEstoque <= estoqueMinimo / 2) {
                baixo.push(p);
            } else if (totalEstoque < estoqueMinimo) {
                proximo.push(p);
            }
        }
    });
    return { itensEstoqueBaixo: baixo, itensEstoqueProximo: proximo };
  }, [caches.produtos, caches.estoque]);


  if (authLoading || dataLoading) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Carregando Dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total de Produtos" value={caches.produtos.size} icon={faBoxesStacked} colorClass="bg-blue-500" />
        <SummaryCard title="Itens com Estoque Baixo" value={itensEstoqueBaixo.length} icon={faExclamationTriangle} colorClass="bg-red-500">
            <button onClick={() => setModalState(s => ({...s, estoqueBaixo: true}))} className="text-sm font-semibold px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 transition-colors">
                Detalhes
            </button>
        </SummaryCard>
        <SummaryCard title="Próximo do Mínimo" value={itensEstoqueProximo.length} icon={faExclamationCircle} colorClass="bg-yellow-500">
            <button onClick={() => setModalState(s => ({...s, estoqueProximo: true}))} className="text-sm font-semibold px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/80 transition-colors">
                Detalhes
            </button>
        </SummaryCard>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Últimas Movimentações</h2>
        <TabelaMovimentacoesRecentes caches={caches} />
      </div>

      <Modal isOpen={modalState.estoqueBaixo} onClose={() => setModalState(s => ({...s, estoqueBaixo: false}))} title="Itens com Estoque Baixo (Crítico)">
        <TabelaEstoqueBaixo produtos={itensEstoqueBaixo} estoque={caches.estoque} onDetailsClick={handleOpenDetalhes} />
      </Modal>

      <Modal isOpen={modalState.estoqueProximo} onClose={() => setModalState(s => ({...s, estoqueProximo: false}))} title="Itens Próximos do Estoque Mínimo (Atenção)">
        <TabelaEstoqueProximo produtos={itensEstoqueProximo} estoque={caches.estoque} onDetailsClick={handleOpenDetalhes} />
      </Modal>

      <ModalDetalhes 
        isOpen={modalState.detalhes}
        onClose={() => setModalState(s => ({...s, detalhes: false}))}
        produto={produtoDetalhes}
        caches={caches}
      />
    </div>
  );
}