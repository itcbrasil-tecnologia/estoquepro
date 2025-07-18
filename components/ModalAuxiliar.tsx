'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db } from '@/lib/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Projeto } from '@/types';

interface Item {
  id?: string;
  nome: string;
  contato_nome?: string;
  contato_whatsapp?: string;
  cor?: string;
  projetoId?: string;
}

interface ModalAuxiliarProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Item | null;
  collectionName: string;
  title: string;
  existingItems: Item[];
  projetos?: Map<string, Projeto>; // Prop opcional para projetos
}

const initialFormData: Item = { nome: '', contato_nome: '', contato_whatsapp: '', cor: '#cccccc', projetoId: '' };

export default function ModalAuxiliar({ isOpen, onClose, itemToEdit, collectionName, title, existingItems, projetos }: ModalAuxiliarProps) {
  const [formData, setFormData] = useState<Item>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({ ...initialFormData, ...itemToEdit });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [itemToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      addToast("O campo 'Nome' é obrigatório.", 'error');
      return;
    }
    if (collectionName === 'localidades' && !formData.projetoId) {
        addToast("Por favor, selecione um projeto.", 'error');
        return;
    }
    setLoading(true);

    try {
        const normalizedNewName = formData.nome.trim().toLowerCase();
        const isDuplicate = existingItems.some(
            (item: any) => item.nome.toLowerCase() === normalizedNewName && item.id !== itemToEdit?.id
        );

        if (isDuplicate) {
            throw new Error(`Um item com o nome "${formData.nome}" já existe.`);
        }

        const dataToSave: any = { ...formData, updatedAt: serverTimestamp() };
        delete dataToSave.id;

        if (itemToEdit?.id) {
            const itemRef = doc(db, collectionName, itemToEdit.id);
            await updateDoc(itemRef, dataToSave);
            addToast(`${title} atualizado com sucesso!`, 'success');
        } else {
            dataToSave.createdAt = serverTimestamp();
            await addDoc(collection(db, collectionName), dataToSave);
            addToast(`${title} adicionado com sucesso!`, 'success');
        }
        onClose();
    } catch (error: any) {
        console.error(`Erro ao salvar ${collectionName}:`, error);
        addToast(error.message || `Falha ao salvar ${title}.`, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={itemToEdit ? `Editar ${title}` : `Adicionar ${title}`}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
            <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
          </div>
          {collectionName === 'fornecedores' && (
            <>
              {/* ... campos de fornecedor ... */}
            </>
          )}
          {collectionName === 'localidades' && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Projeto</label>
                    <select name="projetoId" value={formData.projetoId || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Selecione um Projeto...</option>
                        {projetos && Array.from(projetos.values()).map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor da Localidade</label>
                    <div className="flex items-center mt-1 space-x-2">
                        <input type="color" name="cor" value={formData.cor || '#cccccc'} onChange={handleChange} className="w-12 h-10 p-1 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="text" name="cor" value={formData.cor || '#cccccc'} onChange={handleChange} placeholder="#RRGGBB" className="block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                    </div>
                </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-8 items-center gap-x-4">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-28">
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Salvar'}
            </button>
        </div>
      </form>
    </Modal>
  );
}