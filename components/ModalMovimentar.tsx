'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db, auth } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, where, query, getDocs, writeBatch, getDoc, collectionGroup, documentId } from 'firebase/firestore';
import { Produto, Localidade, EstoqueItem, UnidadeEstoqueItem, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import SerialNumbersInput from './SerialNumbersInput';
import { logAction } from '@/lib/audit';

interface ModalMovimentarProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: CacheData;
}

export default function ModalMovimentar({ isOpen, onClose, produto, caches }: ModalMovimentarProps) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [quantidade, setQuantidade] = useState(1);
  const [localidadeOrigemId, setLocalidadeOrigemId] = useState('');
  const [localidadeDestinoId, setLocalidadeDestinoId] = useState('');
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<string[]>([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<UnidadeEstoqueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const localidadesComEstoqueQtde = produto
    ? caches.estoque.filter(e => e.produtoId === produto.id && e.quantidade > 0).map(e => e.localidadeId)
    : [];
    
  const localidadesComEstoqueSN = produto
    ? [...new Set(
        (caches.unidadesEstoque || [])
        .filter(u => u.produtoId === produto.id && u.status === 'Em Estoque')
        .map(u => u.localidadeId)
      )]
    : [];

  useEffect(() => {
    if (produto && isOpen) {
      setTipo('ENTRADA');
      setQuantidade(1);
      setLocalidadeOrigemId('');
      setLocalidadeDestinoId('');
      setSerialNumbers(['']);
      setUnidadesSelecionadas([]);

      if (produto.tipoControle === 'Serial Number') {
        const unidades = (caches.unidadesEstoque || []).filter(u =>
          u.produtoId === produto.id && u.status === 'Em Estoque'
        );
        setUnidadesDisponiveis(unidades);
      }
    }
  }, [produto, caches.unidadesEstoque, isOpen]);

  const handleUnidadeSelect = (sn: string) => {
    setUnidadesSelecionadas(prev =>
      prev.includes(sn) ? prev.filter(item => item !== sn) : [...prev, sn]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !auth.currentUser) return;

    setLoading(true);

    try {
      if (produto.tipoControle === 'Quantidade') {
        // --- TRANSAÇÃO PARA ESTOQUE POR QUANTIDADE ---
        await runTransaction(db, async (transaction) => {
          const qtd = Number(quantidade);
          if (isNaN(qtd) || qtd <= 0) throw new Error("Quantidade inválida.");

          const histRef = doc(collection(db, "historico"));
          let histData: any = {
            produtoId: produto.id,
            tipo,
            quantidade: qtd,
            data: serverTimestamp(),
            usuario: auth.currentUser?.uid
          };
          
          // LÓGICA DE ENTRADA
          if (tipo === 'ENTRADA') {
            if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório.");
            histData.localidadeDestinoId = localidadeDestinoId;

            const estoqueQuery = query(collection(db, "estoque"), where("produtoId", "==", produto.id), where("localidadeId", "==", localidadeDestinoId));
            const estoqueSnap = await getDocs(estoqueQuery); // getDocs é ok aqui pois é para encontrar o doc, não ler o valor.
            
            if (estoqueSnap.empty) {
              const newEstoqueRef = doc(collection(db, "estoque"));
              transaction.set(newEstoqueRef, { produtoId: produto.id, localidadeId: localidadeDestinoId, quantidade: qtd });
            } else {
              const estoqueRef = estoqueSnap.docs[0].ref;
              const estoqueDoc = await transaction.get(estoqueRef);
              const qtdAtual = estoqueDoc.data()?.quantidade || 0;
              transaction.update(estoqueRef, { quantidade: qtdAtual + qtd });
            }
          } else { // LÓGICA DE SAÍDA E TRANSFERÊNCIA
            if (!localidadeOrigemId) throw new Error("Local de origem é obrigatório.");
            histData.localidadeOrigemId = localidadeOrigemId;
            
            const estoqueOrigemQuery = query(collection(db, "estoque"), where("produtoId", "==", produto.id), where("localidadeId", "==", localidadeOrigemId));
            const estoqueOrigemSnap = await getDocs(estoqueOrigemQuery);
            if (estoqueOrigemSnap.empty) throw new Error("Estoque na origem não existe.");

            const estoqueOrigemRef = estoqueOrigemSnap.docs[0].ref;
            const estoqueOrigemDoc = await transaction.get(estoqueOrigemRef);
            const qtdOrigemAtual = estoqueOrigemDoc.data()?.quantidade || 0;
            if (qtdOrigemAtual < qtd) throw new Error("Estoque insuficiente na origem.");

            transaction.update(estoqueOrigemRef, { quantidade: qtdOrigemAtual - qtd });

            if (tipo === 'TRANSFERENCIA') {
              if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório para transferência.");
              if (localidadeOrigemId === localidadeDestinoId) throw new Error("Origem e destino não podem ser iguais.");
              histData.localidadeDestinoId = localidadeDestinoId;

              const estoqueDestinoQuery = query(collection(db, "estoque"), where("produtoId", "==", produto.id), where("localidadeId", "==", localidadeDestinoId));
              const estoqueDestinoSnap = await getDocs(estoqueDestinoQuery);

              if (estoqueDestinoSnap.empty) {
                const newEstoqueRef = doc(collection(db, "estoque"));
                transaction.set(newEstoqueRef, { produtoId: produto.id, localidadeId: localidadeDestinoId, quantidade: qtd });
              } else {
                const estoqueDestinoRef = estoqueDestinoSnap.docs[0].ref;
                const estoqueDestinoDoc = await transaction.get(estoqueDestinoRef);
                const qtdDestinoAtual = estoqueDestinoDoc.data()?.quantidade || 0;
                transaction.update(estoqueDestinoRef, { quantidade: qtdDestinoAtual + qtd });
              }
            }
          }
          transaction.set(histRef, histData);
        });
      } else {
        // --- TRANSAÇÃO PARA ESTOQUE POR SERIAL NUMBER ---
        const batch = writeBatch(db);
        const histRef = doc(collection(db, "historico"));
        let histData: any = {
          produtoId: produto.id,
          tipo,
          data: serverTimestamp(),
          usuario: auth.currentUser?.uid
        };

        if (tipo === 'ENTRADA') {
          if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório.");
          const snsValidos = serialNumbers.filter(sn => sn && sn.trim().length > 0);
          if (snsValidos.length === 0) throw new Error("Adicione pelo menos um Serial Number válido.");
          
          histData = { ...histData, localidadeDestinoId, quantidade: snsValidos.length, serialNumbers: snsValidos };

          snsValidos.forEach(sn => {
            const newUnidadeRef = doc(collection(db, "unidadesEstoque"));
            batch.set(newUnidadeRef, {
              produtoId: produto.id,
              serialNumber: sn.trim(),
              localidadeId: localidadeDestinoId,
              status: 'Em Estoque',
              createdAt: serverTimestamp(),
            });
          });
        } else { // SAÍDA ou TRANSFERÊNCIA
          if (!localidadeOrigemId) throw new Error("Local de origem é obrigatório.");
          if (unidadesSelecionadas.length === 0) throw new Error("Selecione pelo menos uma unidade para movimentar.");

          histData = { ...histData, localidadeOrigemId, quantidade: unidadesSelecionadas.length, serialNumbers: unidadesSelecionadas };
          
          const unidadesAbertas = (caches.unidadesEstoque || []).filter(u => unidadesSelecionadas.includes(u.serialNumber));

          unidadesAbertas.forEach(unidade => {
              if(unidade.localidadeId !== localidadeOrigemId) throw new Error(`Serial Number ${unidade.serialNumber} não está no local de origem selecionado.`);
              
              const unidadeRef = doc(db, "unidadesEstoque", unidade.id);
              if (tipo === 'SAIDA') {
                  batch.update(unidadeRef, { status: 'Baixado', localidadeId: '' });
              } else { // TRANSFERENCIA
                  if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório.");
                  if (localidadeOrigemId === localidadeDestinoId) throw new Error("Origem e destino não podem ser iguais.");
                  histData.localidadeDestinoId = localidadeDestinoId;
                  batch.update(unidadeRef, { localidadeId: localidadeDestinoId });
              }
          });
        }
        batch.set(histRef, histData);
        await batch.commit();
      }
      
      await logAction('MOVIMENTACAO_ESTOQUE', { tipo, produto: produto.nome, quantidade: quantidade || serialNumbers.length });
      addToast('Movimentação realizada com sucesso!', 'success');
      onClose();

    } catch (error: any) {
      console.error("Erro na movimentação:", error);
      addToast(`Falha: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderFormularioQuantidade = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label>
        <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
      </div>

      {tipo !== 'ENTRADA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Origem</label>
          <select value={localidadeOrigemId} onChange={(e) => setLocalidadeOrigemId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Selecione...</option>
            {localidadesComEstoqueQtde.map(localId => {
              const local = caches.localidades.get(localId);
              return local ? <option key={local.id} value={local.id}>{local.nome}</option> : null;
            })}
          </select>
        </div>
      )}

      {tipo !== 'SAIDA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label>
          <select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Selecione...</option>
            {Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      )}
    </>
  );

  const renderFormularioSerialNumber = () => (
    <>
      {tipo === 'ENTRADA' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label>
            <select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">Selecione...</option>
              {Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Numbers</label>
            <SerialNumbersInput serialNumbers={serialNumbers} setSerialNumbers={setSerialNumbers} />
          </div>
        </>
      )}

      {tipo !== 'ENTRADA' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Origem</label>
            <select value={localidadeOrigemId} onChange={(e) => setLocalidadeOrigemId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">Selecione...</option>
              {localidadesComEstoqueSN.map(localId => {
                  const local = caches.localidades.get(localId);
                  return local ? <option key={local.id} value={local.id}>{local.nome}</option> : null;
              })}
            </select>
          </div>

          {tipo === 'TRANSFERENCIA' && (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label>
                <select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Selecione...</option>
                    {Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
             </div>
          )}
          
          {localidadeOrigemId && (
            <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-1 mt-2">
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Unidades Disponíveis</label>
                {unidadesDisponiveis.filter(u => u.localidadeId === localidadeOrigemId).map(u => (
                    <label key={u.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" checked={unidadesSelecionadas.includes(u.serialNumber)} onChange={() => handleUnidadeSelect(u.serialNumber)} className="h-4 w-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500"/>
                        <span className="font-mono text-sm">{u.serialNumber}</span>
                    </label>
                ))}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Movimentar ${produto?.nome || ''}`}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </div>

          {produto?.tipoControle === 'Serial Number' ? renderFormularioSerialNumber() : renderFormularioQuantidade()}
        </div>

        <div className="flex justify-end mt-8 items-center gap-x-4">
          <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-32">
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}