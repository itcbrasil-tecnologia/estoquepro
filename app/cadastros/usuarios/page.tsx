'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalUsuario from '@/components/ModalUsuario';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function PaginaUsuarios() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Usuario | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item: Usuario | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Esta ação desativará o acesso do usuário, mas manterá seu histórico de movimentações. Deseja continuar?")) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        addToast("Usuário desativado com sucesso.", "success");
      } catch (error) {
        console.error("Erro ao desativar usuário:", error);
        addToast("Falha ao desativar usuário.", "error");
      }
    }
  };

  if (loading) return <p className="dark:text-gray-300">Carregando...</p>;

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Usuário
        </button>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {usuarios.map(item => (
            <li key={item.id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.username}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">{item.email}</span>
                <span className={`ml-4 text-xs font-semibold uppercase px-2 py-1 rounded-full ${item.role === 'master' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{item.role}</span>
              </div>
              {user?.uid !== item.id && (
                <div className="space-x-4">
                  <button onClick={() => handleOpenModal(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ModalUsuario isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={itemEmEdicao} />
    </div>
  );
}