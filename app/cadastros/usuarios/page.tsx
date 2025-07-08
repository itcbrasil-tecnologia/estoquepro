'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalUsuario from '@/components/ModalUsuario';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function PaginaUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Esta ação desativará o acesso do usuário, mas manterá seu histórico de movimentações. Deseja continuar?")) {
      // Nota: Esta ação apenas remove o perfil do Firestore, impedindo o login.
      // A remoção completa do Firebase Auth requer um backend (Admin SDK).
      try {
        await deleteDoc(doc(db, "usuarios", id));
        addToast("Usuário desativado com sucesso.", "success");
      } catch (error) {
        console.error("Erro ao desativar usuário:", error);
        addToast("Falha ao desativar usuário.", "error");
      }
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Usuário
        </button>
      </header>
      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {usuarios.map(item => (
            <li key={item.id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-medium">{item.username}</span>
                <span className="text-sm text-gray-500 ml-4">{item.email}</span>
                <span className={`ml-4 text-xs font-semibold uppercase px-2 py-1 rounded-full ${item.role === 'master' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{item.role}</span>
              </div>
              {user?.uid !== item.id && (
                <div className="space-x-4">
                  <button onClick={() => handleDelete(item.id)} className="text-red-600"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ModalUsuario isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}