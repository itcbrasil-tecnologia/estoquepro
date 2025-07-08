'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CacheData } from '@/types'; // Importa do novo arquivo central

// Importe todos os componentes de relatório
import RelatorioEstoquePorLocal from '@/components/RelatorioEstoquePorLocal';
import RelatorioMovimentacoes from '@/components/RelatorioMovimentacoes';
import RelatorioListaEstoque from '@/components/RelatorioListaEstoque';
import RelatorioListaFabricante from '@/components/RelatorioListaFabricante';
import RelatorioMovimentacoesUsuario from '@/components/RelatorioMovimentacoesUsuario';

export default function PaginaRelatorios() {
  const { userRole } = useAuth();
  const [activeReport, setActiveReport] = useState('estoquePorLocal');
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(), estoque: [], localidades: new Map(),
    fabricantes: new Map(), categorias: new Map(), fornecedores: new Map(),
    usuarios: new Map(), historico: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionsToListen: (keyof CacheData)[] = ['produtos', 'estoque', 'localidades', 'fabricantes', 'categorias', 'fornecedores', 'usuarios', 'historico'];
    
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

    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const renderRelatorio = () => {
    if (loading) return <p>Carregando dados do relatório...</p>;

    switch (activeReport) {
      case 'estoquePorLocal': return <RelatorioEstoquePorLocal caches={caches} />;
      case 'movimentacoes': return <RelatorioMovimentacoes caches={caches} />;
      case 'listaEstoque': return <RelatorioListaEstoque caches={caches} />;
      case 'listaFabricante': return <RelatorioListaFabricante caches={caches} />;
      case 'movimentacoesUsuario': return <RelatorioMovimentacoesUsuario caches={caches} />;
      default: return <p>Selecione um relatório para começar.</p>;
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relatórios</h1>
      </header>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div id="report-nav" className="flex flex-wrap gap-2 border-b border-gray-200 mb-4 pb-2">
          <button onClick={() => setActiveReport('estoquePorLocal')} className={activeReport === 'estoquePorLocal' ? 'report-nav-btn-active' : 'report-nav-btn'}>Estoque por Local</button>
          <button onClick={() => setActiveReport('movimentacoes')} className={activeReport === 'movimentacoes' ? 'report-nav-btn-active' : 'report-nav-btn'}>Movimentações</button>
          <button onClick={() => setActiveReport('listaEstoque')} className={activeReport === 'listaEstoque' ? 'report-nav-btn-active' : 'report-nav-btn'}>Lista de Estoque</button>
          <button onClick={() => setActiveReport('listaFabricante')} className={activeReport === 'listaFabricante' ? 'report-nav-btn-active' : 'report-nav-btn'}>Lista por Fabricante</button>
          {userRole === 'master' && (
            <button onClick={() => setActiveReport('movimentacoesUsuario')} className={activeReport === 'movimentacoesUsuario' ? 'report-nav-btn-active' : 'report-nav-btn'}>Movimentações por Usuário</button>
          )}
        </div>
        <div id="report-content">
          {renderRelatorio()}
        </div>
      </div>
    </div>
  );
}