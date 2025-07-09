'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db } from '@/lib/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Item {
  id?: string;
  nome: string;
  contato_nome?: string;
  contato_whatsapp?: string;
}

interface ModalAuxiliarProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Item | null;
  collectionName: string;
  title: string;
  existingItems: Item[];
}

const initialFormData = { nome: '', contato_nome: '', contato_whatsapp: '' };

export default function ModalAuxiliar({ isOpen, onClose, itemToEdit, collectionName, title, existingItems }: ModalAuxiliarProps) {
  const [formData, setFormData] = useState<Item>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (itemToEdit) {
      setFormData(itemToEdit);
    } else {
      setFormData(initialFormData);
    }
  }, [itemToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      addToast("O campo 'Nome' é obrigatório.", 'error');
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Contato</label>
                <input type="text" name="contato_nome" value={formData.contato_nome || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</label>
                <input type="text" name="contato_whatsapp" value={formData.contato_whatsapp || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
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