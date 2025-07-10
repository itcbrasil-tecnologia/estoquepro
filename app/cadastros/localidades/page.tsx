'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalAuxiliar from '@/components/ModalAuxiliar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Localidade } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function PaginaLocalidades() {
  const { userRole } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Localidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Localidade | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'localidades'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Localidade));
      setItems(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item: Localidade | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta localidade?")) {
      try {
        await deleteDoc(doc(db, "localidades", id));
        addToast("Localidade excluída com sucesso!", "success");
      } catch (error) {
        addToast("Erro ao excluir localidade.", "error");
      }
    }
  };

  if (loading) return <p className="dark:text-gray-300">Carregando...</p>;

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Localidades</h1>
        {userRole === 'master' && (
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Localidade
          </button>
        )}
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map(item => (
            <li key={item.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <span style={{ backgroundColor: item.cor || '#ccc' }} className="w-4 h-4 rounded-full mr-3 border border-gray-300 dark:border-gray-600"></span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.nome}</span>
              </div>
              {userRole === 'master' && (
                <div className="space-x-4">
                  <button onClick={() => handleOpenModal(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ModalAuxiliar isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemToEdit={itemEmEdicao} collectionName="localidades" title="Localidade" existingItems={items} />
    </div>
  );
}