'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db, auth } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, where, query, getDocs, addDoc } from 'firebase/firestore';
import { Produto, Localidade, EstoqueItem } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface ModalMovimentarProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: {
    estoque: EstoqueItem[];
    localidades: Map<string, Localidade>;
  };
}

export default function ModalMovimentar({ isOpen, onClose, produto, caches }: ModalMovimentarProps) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [quantidade, setQuantidade] = useState(1);
  const [localidadeOrigemId, setLocalidadeOrigemId] = useState('');
  const [localidadeDestinoId, setLocalidadeDestinoId] = useState('');
  const [locaisComEstoque, setLocaisComEstoque] = useState<Localidade[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (produto && isOpen) {
      const locais = caches.estoque
        .filter((item) => item.produtoId === produto.id && item.quantidade > 0)
        .map((item) => caches.localidades.get(item.localidadeId))
        .filter((l): l is Localidade => l !== undefined);
      setLocaisComEstoque(locais);
      setLocalidadeOrigemId('');
      setLocalidadeDestinoId('');
      setQuantidade(1);
      setTipo('ENTRADA');
    }
  }, [produto, caches, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !quantidade || quantidade <= 0) {
      addToast("Dados inválidos.", 'error');
      return;
    }
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const historicoData: any = { 
            produtoId: produto.id, 
            tipo, 
            quantidade, 
            data: serverTimestamp(), 
            usuario: auth.currentUser?.uid 
        };

        const estoqueQuery = query(collection(db, "estoque"), where("produtoId", "==", produto.id));
        const estoqueDocs = await getDocs(estoqueQuery);
        const estoquePorLocal = new Map(estoqueDocs.docs.map(d => [d.data().localidadeId, {id: d.id, ref: d.ref, ...d.data()}]));

        if (tipo === 'ENTRADA') {
            if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório para entradas.");
            const estoqueDestino = estoquePorLocal.get(localidadeDestinoId);
            if (estoqueDestino) {
                const docAtual = await transaction.get(estoqueDestino.ref);
                if(!docAtual.exists()) throw new Error("Documento de estoque de destino não encontrado.");
                const qtdAtual = docAtual.data().quantidade;
                transaction.update(estoqueDestino.ref, { quantidade: qtdAtual + quantidade });
            } else {
                const newEstoqueRef = doc(collection(db, "estoque"));
                transaction.set(newEstoqueRef, { produtoId: produto.id, localidadeId: localidadeDestinoId, quantidade });
            }
            historicoData.localidadeDestinoId = localidadeDestinoId;
        } else {
            if (!localidadeOrigemId) throw new Error("Local de origem é obrigatório.");
            const estoqueOrigem = estoquePorLocal.get(localidadeOrigemId);
            if (!estoqueOrigem) throw new Error("Estoque na origem não existe.");
            
            const docOrigemAtual = await transaction.get(estoqueOrigem.ref);
            if(!docOrigemAtual.exists()) throw new Error("Documento de estoque de origem não encontrado.");
            const qtdOrigemAtual = docOrigemAtual.data().quantidade;

            if (qtdOrigemAtual < quantidade) throw new Error("Estoque insuficiente na origem.");
            
            if (tipo === 'TRANSFERENCIA') {
                if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório para transferências.");
                if (localidadeOrigemId === localidadeDestinoId) throw new Error("Local de origem e destino não podem ser iguais.");
                const estoqueDestino = estoquePorLocal.get(localidadeDestinoId);
                let qtdDestinoAtual = 0;
                if (estoqueDestino) {
                    const docDestinoAtual = await transaction.get(estoqueDestino.ref);
                    qtdDestinoAtual = docDestinoAtual.data()?.quantidade || 0;
                }
                
                transaction.update(estoqueOrigem.ref, { quantidade: qtdOrigemAtual - quantidade });
                if (estoqueDestino) {
                    transaction.update(estoqueDestino.ref, { quantidade: qtdDestinoAtual + quantidade });
                } else {
                    const newEstoqueRef = doc(collection(db, "estoque"));
                    transaction.set(newEstoqueRef, { produtoId: produto.id, localidadeId: localidadeDestinoId, quantidade });
                }
                historicoData.localidadeDestinoId = localidadeDestinoId;
            } else { // Apenas SAIDA
                transaction.update(estoqueOrigem.ref, { quantidade: qtdOrigemAtual - quantidade });
            }
            historicoData.localidadeOrigemId = localidadeOrigemId;
        }
        transaction.set(doc(collection(db, "historico")), historicoData);
      });
      addToast('Movimentação realizada com sucesso!', 'success');
      onClose();
    } catch (error: any) {
      console.error("Erro na transação:", error);
      addToast(`Falha: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Movimentar ${produto?.nome || ''}`}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="TRANSFERENCIA">Transferência</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label><input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
          {tipo !== 'ENTRADA' && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Origem</label><select value={localidadeOrigemId} onChange={(e) => setLocalidadeOrigemId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{locaisComEstoque.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
          )}
          {tipo !== 'SAIDA' && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label><select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
          )}
        </div>
        <div className="flex justify-end mt-8 space-x-4">
            <button type="button" onClick={onClose} className="btn-cancel bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-32">
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmar'}
            </button>
        </div>
      </form>
    </Modal>
  );
}