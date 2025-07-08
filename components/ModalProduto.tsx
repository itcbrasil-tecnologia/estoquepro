'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db } from '@/lib/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Produto, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface ModalProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  produtoToEdit: Produto | null;
  caches: CacheData;
  onDelete: (id: string) => void;
}

const initialFormData: Omit<Produto, 'id' | 'createdAt' | 'updatedAt'> = {
    nome: '', unidade: '', descricao: '', foto_url: '', serialNumber: '',
    modelo: '', categoriaId: '', fabricanteId: '', fornecedorId: '',
    notas_internas: '', documentos: '[]',
};

export default function ModalProduto({ isOpen, onClose, produtoToEdit, caches, onDelete }: ModalProdutoProps) {
  const [formData, setFormData] = useState<Omit<Produto, 'id'>>(initialFormData);
  const [documentos, setDocumentos] = useState<{nome: string, link: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
        if (produtoToEdit) {
            setFormData(produtoToEdit);
            try {
                setDocumentos(produtoToEdit.documentos ? JSON.parse(produtoToEdit.documentos) : []);
            } catch {
                setDocumentos([]);
            }
        } else {
            setFormData(initialFormData);
            setDocumentos([]);
        }
    }
  }, [produtoToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocChange = (index: number, field: 'nome' | 'link', value: string) => {
    const newDocs = [...documentos];
    newDocs[index][field] = value;
    setDocumentos(newDocs);
  };

  const addDocumentoField = () => {
    setDocumentos([...documentos, { nome: '', link: '' }]);
  };

  const removeDocumentoField = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSave: any = { ...formData, documentos: JSON.stringify(documentos), updatedAt: serverTimestamp() };

    try {
      if (produtoToEdit?.id) {
        const produtoRef = doc(db, "produtos", produtoToEdit.id);
        await updateDoc(produtoRef, dataToSave);
        addToast('Produto atualizado com sucesso!', 'success');
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, "produtos"), dataToSave);
        addToast('Produto adicionado com sucesso!', 'success');
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      addToast('Falha ao salvar produto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const popularSelect = (cache: Map<string, {nome: string}>, placeholder: string) => {
    const options = [<option key="" value="">{placeholder}</option>];
    Array.from(cache.entries()).forEach(([id, item]) => {
        options.push(<option key={id} value={id}>{item.nome}</option>);
    });
    return options;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={produtoToEdit ? "Editar Produto" : "Adicionar Novo Produto"}>
      <form onSubmit={handleSave} className="space-y-4">
        {/* ... (o conteúdo do formulário permanece o mesmo) ... */}
        <div className="flex justify-between items-center mt-8">
            {produtoToEdit && (
                <button type="button" onClick={() => onDelete(produtoToEdit.id)} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />Excluir
                </button>
            )}
            <div className="ml-auto space-x-4">
                <button type="button" onClick={onClose} className="btn-cancel bg-gray-200 font-bold py-2 px-6 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </div>
      </form>
    </Modal>
  );
}