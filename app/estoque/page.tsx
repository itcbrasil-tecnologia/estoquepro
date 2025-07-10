'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import CardProduto from '@/components/CardProduto';
import ModalProduto from '@/components/ModalProduto';
import ModalDetalhes from '@/components/ModalDetalhes';
import ModalMovimentar from '@/components/ModalMovimentar';
import Paginacao from '@/components/Paginacao';
import ProdutoListItem from '@/components/ProdutoListItem';
import { Produto, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTh, faList, faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

const ITENS_POR_PAGINA = 24;

export default function PaginaEstoque() {
  const { userRole, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [caches, setCaches] = useState<CacheData>({
    produtos: new Map(), estoque: [], localidades: new Map(),
    fabricantes: new Map(), categorias: new Map(), fornecedores: new Map(),
    usuarios: new Map(), historico: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recentes');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroLocalidade, setFiltroLocalidade] = useState('');
  
  const [modalState, setModalState] = useState({
    produto: false,
    detalhes: false,
    movimentar: false,
  });
  
  const [itemSelecionado, setItemSelecionado] = useState<Produto | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

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
        if(loadedCount >= collectionsToListen.length) {
            setDataLoading(false);
        }
      })
    );

    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        unsubscribers.forEach(unsub => unsub());
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [authLoading]);

  // ... (o resto das funções permanece o mesmo)

  if (authLoading || dataLoading) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Carregando...</div>;
  }

  // ... (o resto do JSX da página permanece o mesmo)
}