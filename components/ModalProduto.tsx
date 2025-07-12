'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db, auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { doc, addDoc, updateDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Produto, CacheData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { logAction } from '@/lib/audit';

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
    notas_internas: '', documentos: '[]', estoqueMinimo: 0,
};

// Função para limpar e padronizar o nome do arquivo
const sanitizeFilename = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/[^a-z0-9-.]/g, ''); // Remove caracteres especiais, exceto hífens e pontos
};


export default function ModalProduto({ isOpen, onClose, produtoToEdit, caches, onDelete }: ModalProdutoProps) {
  const [formData, setFormData] = useState<Omit<Produto, 'id'>>(initialFormData);
  const [documentos, setDocumentos] = useState<{nome: string, link: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
    const isNumber = e.target.type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.nome) {
        addToast("Por favor, preencha o nome do produto antes de fazer o upload.", "error");
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const sanitizedProductName = sanitizeFilename(formData.nome);
    const fileExtension = file.name.split('.').pop();
    const newFilename = `${sanitizedProductName}_${Date.now()}.${fileExtension}`;
    
    const storageRef = ref(storage, `produtos/${newFilename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        addToast("Falha no upload da imagem.", "error");
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData(prev => ({ ...prev, foto_url: downloadURL }));
          addToast("Imagem enviada com sucesso!", "success");
          setIsUploading(false);
        });
      }
    );
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSave: any = { ...formData, documentos: JSON.stringify(documentos), updatedAt: serverTimestamp() };

    try {
      if (produtoToEdit?.id) {
        const produtoRef = doc(db, "produtos", produtoToEdit.id);
        await updateDoc(produtoRef, dataToSave);
        await logAction('PRODUTO_EDITADO', { id: produtoToEdit.id, nome: dataToSave.nome });
        addToast('Produto atualizado com sucesso!', 'success');
      } else {
        dataToSave.createdAt = serverTimestamp();
        
        const formElements = e.currentTarget.elements as any;
        const qtdInicial = parseFloat(formElements.quantidade_inicial.value);
        const localInicial = formElements.localidade_inicial.value;

        if (qtdInicial > 0 && !localInicial) {
            throw new Error("Por favor, selecione uma localidade para o estoque inicial.");
        }

        const batch = writeBatch(db);
        const produtoRef = doc(collection(db, "produtos"));
        batch.set(produtoRef, dataToSave);
        await logAction('PRODUTO_CRIADO', { id: produtoRef.id, nome: dataToSave.nome });

        if (qtdInicial > 0 && localInicial) {
            const estoqueRef = doc(collection(db, "estoque"));
            batch.set(estoqueRef, { produtoId: produtoRef.id, localidadeId: localInicial, quantidade: qtdInicial });
            
            const histRef = doc(collection(db, "historico"));
            const historicoData = {
                produtoId: produtoRef.id, tipo: 'ENTRADA', quantidade: qtdInicial,
                localidadeDestinoId: localInicial, data: serverTimestamp(), usuario: auth.currentUser?.uid
            };
            batch.set(histRef, historicoData);
            await logAction('MOVIMENTACAO_ESTOQUE', { tipo: 'ENTRADA', quantidade: qtdInicial, produto: dataToSave.nome });
        }
        await batch.commit();
        addToast('Produto adicionado com sucesso!', 'success');
      }
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      addToast(error.message || 'Falha ao salvar produto.', 'error');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label><textarea name="descricao" value={formData.descricao || ''} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea></div>
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL da Foto</label>
                <div className="flex items-center space-x-2 mt-1">
                    <input type="url" name="foto_url" value={formData.foto_url || ''} onChange={handleChange} className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                    <label htmlFor="image-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
                        Escolher...
                    </label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
            </div>
            
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label><input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade</label><input type="text" name="unidade" value={formData.unidade || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label><input type="text" name="modelo" value={formData.modelo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estoque Mínimo</label><input type="number" name="estoqueMinimo" value={formData.estoqueMinimo || 0} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label><select name="categoriaId" value={formData.categoriaId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{popularSelect(caches.categorias, 'Selecione...')}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fabricante</label><select name="fabricanteId" value={formData.fabricanteId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{popularSelect(caches.fabricantes, 'Selecione...')}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor</label><select name="fornecedorId" value={formData.fornecedorId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{popularSelect(caches.fornecedores, 'Selecione...')}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label><textarea name="notas_internas" value={formData.notas_internas || ''} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea></div>
        </div>
        
        <div className="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Documentos</p>
                <button type="button" onClick={addDocumentoField} className="text-sm bg-blue-100 text-blue-700 font-semibold py-1 px-3 rounded-md hover:bg-blue-200">Adicionar</button>
            </div>
            <div id="documentosContainer" className="space-y-2">
                {documentos.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input type="text" value={doc.nome} onChange={(e) => handleDocChange(index, 'nome', e.target.value)} placeholder="Nome do Documento" className="w-1/3 p-2 border border-gray-400 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <input type="url" value={doc.link} onChange={(e) => handleDocChange(index, 'link', e.target.value)} placeholder="Link do Documento" className="flex-grow p-2 border border-gray-400 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <button type="button" onClick={() => removeDocumentoField(index)} className="text-red-500 hover:text-red-700 p-2"><FontAwesomeIcon icon={faTrash} /></button>
                    </div>
                ))}
            </div>
        </div>
        
        {!produtoToEdit && (
            <div className="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Estoque Inicial (Opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label><input type="number" step="any" name="quantidade_inicial" className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localidade</label><select name="localidade_inicial" className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{popularSelect(caches.localidades, 'Selecione...')}</select></div>
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mt-8">
            <div>
                {produtoToEdit && (
                    <button type="button" onClick={() => onDelete(produtoToEdit.id)} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />Excluir
                    </button>
                )}
            </div>
            <div className="flex items-center gap-x-4">
                <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-28">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Salvar'}
                </button>
            </div>
        </div>
      </form>
    </Modal>
  );
}
