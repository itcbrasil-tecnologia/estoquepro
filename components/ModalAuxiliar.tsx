'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db } from '@/lib/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';

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
}

const initialFormData = { nome: '' };

export default function ModalAuxiliar({ isOpen, onClose, itemToEdit, collectionName, title }: ModalAuxiliarProps) {
  const [formData, setFormData] = useState<Item>(initialFormData);

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
      alert("O campo 'Nome' é obrigatório.");
      return;
    }

    const dataToSave: any = { ...formData, updatedAt: serverTimestamp() };
    delete dataToSave.id;

    try {
      if (itemToEdit?.id) {
        const itemRef = doc(db, collectionName, itemToEdit.id);
        await updateDoc(itemRef, dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, collectionName), dataToSave);
      }
      onClose();
    } catch (error) {
      console.error(`Erro ao salvar ${collectionName}:`, error);
      alert(`Falha ao salvar ${title}.`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={itemToEdit ? `Editar ${title}` : `Adicionar ${title}`}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-lg"/>
          </div>
          {collectionName === 'fornecedores' && (
            <>
              <div>
                <label className="block text-sm font-medium">Nome do Contato</label>
                <input type="text" name="contato_nome" value={formData.contato_nome || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-lg"/>
              </div>
              <div>
                <label className="block text-sm font-medium">WhatsApp</label>
                <input type="text" name="contato_whatsapp" value={formData.contato_whatsapp || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-lg"/>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-8 space-x-4">
            <button type="button" onClick={onClose} className="btn-cancel bg-gray-200 font-bold py-2 px-6 rounded-lg">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}