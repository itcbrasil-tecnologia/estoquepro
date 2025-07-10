'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalUsuario from '@/components/ModalUsuario';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '@/types';
import { useToast } from '@/contexts/ToastContext';

// Componente interno para a lista em telas pequenas
const UserListItemMobile = ({ item, currentUser, onEdit, onDelete }: { item: Usuario, currentUser: any, onEdit: (item: Usuario) => void, onDelete: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center text-left">
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.username}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Email:</strong> {item.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Perfil:</strong> <span className={`font-semibold ${item.role === 'master' ? 'text-blue-500' : ''}`}>{item.role}</span></p>
                    {currentUser?.uid !== item.id && (
                        <div className="flex space-x-4 mt-3">
                            <button onClick={() => onEdit(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /> Editar</button>
                            <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /> Desativar</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function PaginaUsuarios() {
  const { user, userRole } = useAuth();
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Usuário
        </button>
      </header>
      
      {/* Tabela para Telas Maiores */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuário</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Perfil</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usuarios.map(item => (
                    <tr key={item.id}>
                        <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{item.username}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{item.email}</td>
                        <td className="p-4"><span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${item.role === 'master' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{item.role}</span></td>
                        <td className="p-4">
                            {user?.uid !== item.id && (
                                <div className="space-x-4">
                                    <button onClick={() => handleOpenModal(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Lista para Telas Pequenas */}
      <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {usuarios.map(item => (
                <UserListItemMobile key={item.id} item={item} currentUser={user} onEdit={handleOpenModal} onDelete={handleDelete} />
            ))}
        </div>
      </div>

      <ModalUsuario isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={itemEmEdicao} />
    </div>
  );
}