'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db, auth } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { Produto, Localidade, EstoqueItem, UnidadeEstoqueItem, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import SerialNumbersInput from './SerialNumbersInput';

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

  useEffect(() => {
    if (produto && isOpen) {
      setTipo('ENTRADA');
      setQuantidade(1);
      setLocalidadeOrigemId('');
      setLocalidadeDestinoId('');
      setSerialNumbers(['']);
      setUnidadesSelecionadas([]);

      if (produto.tipoControle === 'Serial Number') {
        const unidades = (caches.unidadesEstoque || []).filter(u => u.produtoId === produto.id && u.status === 'Em Estoque');
        setUnidadesDisponiveis(unidades);
      }
    }
  }, [produto, caches, isOpen]);
  
  const handleUnidadeSelect = (sn: string) => {
    setUnidadesSelecionadas(prev => 
        prev.includes(sn) ? prev.filter(item => item !== sn) : [...prev, sn]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto) return;
    setLoading(true);

    try {
        if(produto.tipoControle === 'Quantidade') {
            // Lógica para estoque por quantidade
        } else {
            // Lógica para estoque por Serial Number
            const batch = writeBatch(db);
            
            if(tipo === 'ENTRADA') {
                if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório.");
                const snsValidos = serialNumbers.filter(sn => sn && sn.length > 0);
                if (snsValidos.length === 0) throw new Error("Adicione pelo menos um Serial Number válido.");

                snsValidos.forEach(sn => {
                    const newUnidadeRef = doc(collection(db, "unidades_estoque"));
                    batch.set(newUnidadeRef, {
                        produtoId: produto.id,
                        serialNumber: sn,
                        localidadeId: localidadeDestinoId,
                        status: 'Em Estoque',
                        createdAt: serverTimestamp()
                    });
                });
            } else { // SAIDA ou TRANSFERENCIA
                if (!localidadeOrigemId) throw new Error("Local de origem é obrigatório.");
                if (unidadesSelecionadas.length === 0) throw new Error("Selecione pelo menos uma unidade para movimentar.");

                unidadesSelecionadas.forEach(sn => {
                    const unidade = unidadesDisponiveis.find(u => u.serialNumber === sn);
                    if(unidade) {
                        const unidadeRef = doc(db, "unidades_estoque", unidade.id);
                        if(tipo === 'SAIDA') {
                            batch.update(unidadeRef, { status: 'Baixado', localidadeId: '' });
                        } else { // TRANSFERENCIA
                             if (!localidadeDestinoId) throw new Error("Local de destino é obrigatório.");
                             batch.update(unidadeRef, { localidadeId: localidadeDestinoId });
                        }
                    }
                });
            }
            await batch.commit();
        }
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
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label><input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
      {tipo !== 'ENTRADA' && (
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Origem</label><select value={localidadeOrigemId} onChange={(e) => setLocalidadeOrigemId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
      )}
      {tipo !== 'SAIDA' && (
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label><select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
      )}
    </>
  );

  const renderFormularioSerialNumber = () => (
    <>
      {tipo === 'ENTRADA' && (
        <>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label><select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Numbers</label><SerialNumbersInput serialNumbers={serialNumbers} setSerialNumbers={setSerialNumbers} /></div>
        </>
      )}
      {tipo !== 'ENTRADA' && (
        <>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Origem</label><select value={localidadeOrigemId} onChange={(e) => setLocalidadeOrigemId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{unidadesDisponiveis.map(u => u.localidadeId).filter((v,i,a)=>a.indexOf(v)===i).map(lId => <option key={lId} value={lId}>{caches.localidades.get(lId)?.nome}</option>)}</select></div>
          {tipo === 'TRANSFERENCIA' && <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Destino</label><select value={localidadeDestinoId} onChange={(e) => setLocalidadeDestinoId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Selecione...</option>{Array.from(caches.localidades.values()).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>}
          <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-1">
            {unidadesDisponiveis.filter(u => u.localidadeId === localidadeOrigemId).map(u => (
                <label key={u.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input type="checkbox" checked={unidadesSelecionadas.includes(u.serialNumber)} onChange={() => handleUnidadeSelect(u.serialNumber)} className="h-4 w-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500"/>
                    <span className="font-mono text-sm">{u.serialNumber}</span>
                </label>
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Movimentar ${produto?.nome || ''}`}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="TRANSFERENCIA">Transferência</option></select></div>
          {produto?.tipoControle === 'Serial Number' ? renderFormularioSerialNumber() : renderFormularioQuantidade()}
        </div>
        <div className="flex justify-end mt-8 items-center gap-x-4">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-32">
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmar'}
            </button>
        </div>
      </form>
    </Modal>
  );
}