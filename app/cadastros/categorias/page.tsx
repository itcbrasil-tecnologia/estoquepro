'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalAuxiliar from '@/components/ModalAuxiliar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Categoria } from '@/types';

export default function PaginaCategorias() {
  const { userRole } = useAuth();
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Categoria | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categorias'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria));
      setItems(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item: Categoria | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteDoc(doc(db, "categorias", id));
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categorias</h1>
        {userRole === 'master' && (
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Categoria
          </button>
        )}
      </header>
      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="p-4 flex justify-between items-center">
              <span className="font-medium">{item.nome}</span>
              {userRole === 'master' && (
                <div className="space-x-4">
                  <button onClick={() => handleOpenModal(item)} className="text-yellow-600"><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ModalAuxiliar isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemToEdit={itemEmEdicao} collectionName="categorias" title="Categoria" />
    </div>
  );
}