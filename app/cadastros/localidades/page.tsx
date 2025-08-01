'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModalAuxiliar from '@/components/ModalAuxiliar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Localidade, Projeto } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function PaginaLocalidades() {
  const { userRole } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Localidade[]>([]);
  const [projetos, setProjetos] = useState<Map<string, Projeto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<Localidade | null>(null);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubLocalidades = onSnapshot(collection(db, 'localidades'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Localidade))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      setItems(lista);
      setLoading(false);
    });
    const unsubProjetos = onSnapshot(collection(db, 'projetos'), (snapshot) => {
      const mapa = new Map<string, Projeto>();
      snapshot.docs.forEach(doc => mapa.set(doc.id, { id: doc.id, ...doc.data() } as Projeto));
      setProjetos(mapa);
    });
    return () => {
      unsubLocalidades();
      unsubProjetos();
    };
  }, []);

  const locationsByProject = useMemo(() => {
    const grouped = new Map<string, Localidade[]>();
    const unassigned: Localidade[] = [];
    items.forEach(location => {
      if (location.projetoId && projetos.has(location.projetoId)) {
        const projectId = location.projetoId;
        if (!grouped.has(projectId)) {
          grouped.set(projectId, []);
        }
        grouped.get(projectId)!.push(location);
      } else {
        unassigned.push(location);
      }
    });
    const sortedGrouped = new Map([...grouped.entries()].sort(([projIdA], [projIdB]) => {
        const projA = projetos.get(projIdA);
        const projB = projetos.get(projIdB);
        if (!projA || !projB) return 0;
        return projA.nome.localeCompare(projB.nome);
    }));
    if (unassigned.length > 0) {
        sortedGrouped.set('unassigned', unassigned);
    }
    return sortedGrouped;
  }, [items, projetos]);

  const toggleProject = (projectId: string) => {
    setOpenProjects(prevOpen => {
      const newOpen = new Set(prevOpen);
      if (newOpen.has(projectId)) {
        newOpen.delete(projectId);
      } else {
        newOpen.add(projectId);
      }
      return newOpen;
    });
  };

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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Localidades</h1>
        <button onClick={() => handleOpenModal(null)} className="btn-primary self-start sm:self-auto">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Adicionar Localidade
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from(locationsByProject.entries()).map(([projectId, locations]) => {
            const projeto = projetos.get(projectId);
            const isUnassigned = projectId === 'unassigned';
            const isOpen = openProjects.has(projectId);
            const headerColor = isUnassigned ? '#ccc' : projeto?.cor || '#ccc';

            return (
              <div key={projectId}>
                <button onClick={() => toggleProject(projectId)} className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center">
                    <span style={{ backgroundColor: headerColor }} className="w-4 h-4 rounded-full mr-3 border border-gray-300 dark:border-gray-600"></span>
                    <span className="font-bold text-lg text-gray-700 dark:text-gray-200">{isUnassigned ? 'Sem Projeto' : projeto?.nome}</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown} className={`w-4 h-4 transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <ul className="bg-gray-50 dark:bg-gray-900/50">
                    {locations.map(item => (
                      <li key={item.id} className="p-4 pl-12 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.nome}</span>
                        <div className="space-x-4">
                          <button onClick={() => handleOpenModal(item)} className="text-yellow-600 hover:text-yellow-500"><FontAwesomeIcon icon={faEdit} /></button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ModalAuxiliar isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemToEdit={itemEmEdicao} collectionName="localidades" title="Localidade" existingItems={items} projetos={projetos} />
    </div>
  );
}