'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CacheData } from '@/types';

// Importe os componentes de relatório necessários
import RelatorioListaEstoque from '@/components/RelatorioListaEstoque';
import RelatorioMovimentacoes from '@/components/RelatorioMovimentacoes';

export default function PaginaRelatorios() {
  const { userRole } = useAuth();
  const [activeReport, setActiveReport] = useState('listaEstoque');
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(),
    estoque: [],
    localidades: new Map(),
    fabricantes: new Map(),
    categorias: new Map(),
    fornecedores: new Map(),
    usuarios: new Map(),
    historico: [],
    projetos: new Map(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionsToListen: (keyof CacheData)[] = ['produtos', 'estoque', 'localidades', 'fabricantes', 'categorias', 'fornecedores', 'usuarios', 'historico', 'projetos'];
    
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

  const renderRelatorio = () => {
    if (loading) return <p className="dark:text-gray-400">Carregando dados do relatório...</p>;

    switch (activeReport) {
      case 'listaEstoque': return <RelatorioListaEstoque caches={caches} />;
      case 'movimentacoes': return <RelatorioMovimentacoes caches={caches} />;
      default: return <p>Selecione um relatório para começar.</p>;
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios</h1>
      </header>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-4 pb-4">
          <button onClick={() => setActiveReport('listaEstoque')} className={activeReport === 'listaEstoque' ? 'report-nav-btn-active' : 'report-nav-btn'}>Estoque Geral</button>
          <button onClick={() => setActiveReport('movimentacoes')} className={activeReport === 'movimentacoes' ? 'report-nav-btn-active' : 'report-nav-btn'}>Movimentações</button>
        </div>
        <div id="report-content">
          {renderRelatorio()}
        </div>
      </div>
    </div>
  );
}