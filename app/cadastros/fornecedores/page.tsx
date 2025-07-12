'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalAuxiliar from '@/components/ModalAuxiliar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Fornecedor } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const FornecedorListItemMobile = ({ item, onEdit, onDelete }: { item: Fornecedor, onEdit: (item: Fornecedor) => void, onDelete: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center text-left">
                <span className="font-medium text-gray-800 dark:text-gray-200">{item.nome}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Contato:</strong> {item.contato_nome || 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>WhatsApp:</strong> {item.contato_whatsapp || 'N/A'}</p>
                    <div className="flex space-x-4 mt-3">
                        <button onClick={() => onEdit(item)} className="text-yellow-600 hover:text-yellow-500 flex items-center gap-2"><FontAwesomeIcon icon={faEdit} /> Editar</button>
                        <button onClick={() => onDelete(item.id!)} className="text-red-600 hover:text-red-500 flex items-center gap-2"><FontAwesomeIcon icon={faTrash} /> Excluir</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PaginaFornecedores() {
  const { userRole } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Fornecedor | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fornecedores'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fornecedor))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      setItems(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item: Fornecedor | null = null) => {
    setItemEmEdicao(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
       try {
        await deleteDoc(doc(db, "fornecedores", id));
        addToast("Fornecedor excluído com sucesso!", "success");
      } catch (error) {
        addToast("Erro ao excluir fornecedor.", "error");
      }
    }
  };

  if (loading) return <p className="dark:text-gray-300">Carregando...</p>;

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Fornecedores</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center self-start sm:self-auto">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Fornecedor
        </button>
      </header>
      
      {/* Tabela para Telas Maiores */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fornecedor</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contato</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">WhatsApp</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map(item => (
                        <tr key={item.id}>
                            <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{item.nome}</td>
                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.contato_nome}</td>
                            <td className="p-4 text-gray-600 dark:text-gray-400">{item.contato_whatsapp}</td>
                            <td className="p-4">
                                <div className="space-x-4">
                                    <button onClick={() => handleOpenModal(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Lista para Telas Pequenas */}
      <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(item => (
                <FornecedorListItemMobile key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleDelete} />
            ))}
        </div>
      </div>

      <ModalAuxiliar isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemToEdit={itemEmEdicao} collectionName="fornecedores" title="Fornecedor" existingItems={items} />
    </div>
  );
}