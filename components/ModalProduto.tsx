"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "./Modal";
import { db, auth, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Produto, CacheData } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faSpinner, faPlus } from "@fortawesome/free-solid-svg-icons";
import { logAction } from "@/lib/audit";
import SerialNumbersInput from "./SerialNumbersInput";

interface ModalProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  produtoToEdit: Produto | null;
  caches: CacheData;
  onDelete: (id: string) => void;
}

const initialFormData: Omit<Produto, "id" | "createdAt" | "updatedAt"> = {
  nome: "",
  unidade: "",
  descricao: "",
  foto_url: "",
  serialNumber: "",
  modelo: "",
  categoriaId: "",
  fabricanteId: "",
  fornecedorId: "",
  notas_internas: "",
  documentos: "[]",
  estoqueMinimo: 0,
  tipoControle: "Quantidade",
};

const sanitizeFilename = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-.]/g, "");
};

export default function ModalProduto({
  isOpen,
  onClose,
  produtoToEdit,
  caches,
  onDelete,
}: ModalProdutoProps) {
  const [formData, setFormData] =
    useState<Omit<Produto, "id">>(initialFormData);
  const [documentos, setDocumentos] = useState<
    { nome: string; link: string }[]
  >([]);
  const [initialSerialNumbers, setInitialSerialNumbers] = useState<string[]>([
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  const localPadrao = useMemo(
    () =>
      Array.from(caches.localidades.values()).find(
        (l) => l.nome.toUpperCase() === "ITC BRASIL"
      ),
    [caches.localidades]
  );

  useEffect(() => {
    if (isOpen) {
      if (produtoToEdit) {
        setFormData({ ...initialFormData, ...produtoToEdit });
        try {
          setDocumentos(
            produtoToEdit.documentos ? JSON.parse(produtoToEdit.documentos) : []
          );
        } catch {
          setDocumentos([]);
        }
      } else {
        setFormData(initialFormData);
        setDocumentos([]);
        setInitialSerialNumbers([""]);
      }
    }
  }, [produtoToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === "number";
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.nome) return;
    setIsUploading(true);
    setUploadProgress(0);
    const sanitizedName = sanitizeFilename(formData.nome);
    const storageRef = ref(storage, `produtos/${sanitizedName}-${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (s) => setUploadProgress((s.bytesTransferred / s.totalBytes) * 100),
      () => {
        setIsUploading(false);
        addToast("Erro no upload", "error");
      },
      () =>
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setFormData((prev) => ({ ...prev, foto_url: url }));
          setIsUploading(false);
          addToast("Imagem carregada!", "success");
        })
    );
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    const dataToSave: any = {
      ...formData,
      documentos: JSON.stringify(documentos),
      updatedAt: serverTimestamp(),
    };

    try {
      await runTransaction(db, async (transaction) => {
        const localId = localPadrao?.id;
        if (!localId && !produtoToEdit)
          throw new Error("Local 'ITC BRASIL' não configurado.");

        // 1. DEFINIÇÃO DAS REFERÊNCIAS
        const produtoRef = produtoToEdit?.id
          ? doc(db, "produtos", produtoToEdit.id)
          : doc(collection(db, "produtos"));

        const estoqueRef = localId
          ? doc(db, "estoque", `${produtoRef.id}_${localId}`)
          : null;
        const histRef = doc(collection(db, "historico"));

        // 2. FASE DE LEITURA (READS) - OBRIGATÓRIO SER PRIMEIRO

        await transaction.get(produtoRef);
        if (estoqueRef) {
          await transaction.get(estoqueRef);
        }

        // 3. FASE DE ESCRITA (WRITES)
        if (produtoToEdit) {
          transaction.update(produtoRef, dataToSave);
        } else {
          dataToSave.createdAt = serverTimestamp();
          transaction.set(produtoRef, dataToSave);

          // Entrada inicial
          if (formData.tipoControle === "Quantidade") {
            const formElements = e.currentTarget.elements as any;
            const qtd = parseFloat(formElements.quantidade_inicial?.value) || 0;
            if (qtd > 0 && estoqueRef) {
              transaction.set(estoqueRef, {
                produtoId: produtoRef.id,
                localidadeId: localId,
                quantidade: qtd,
              });
              transaction.set(histRef, {
                produtoId: produtoRef.id,
                tipo: "ENTRADA",
                quantidade: qtd,
                localidadeDestinoId: localId,
                data: serverTimestamp(),
                usuario: auth.currentUser?.uid,
              });
            }
          } else {
            const sns = initialSerialNumbers.filter((s) => s.trim());
            if (sns.length > 0 && localId) {
              sns.forEach((sn) => {
                const uniRef = doc(collection(db, "unidadesEstoque"));
                transaction.set(uniRef, {
                  produtoId: produtoRef.id,
                  serialNumber: sn.trim(),
                  localidadeId: localId,
                  status: "Em Estoque",
                  createdAt: serverTimestamp(),
                });
              });
              transaction.set(histRef, {
                produtoId: produtoRef.id,
                tipo: "ENTRADA",
                quantidade: sns.length,
                serialNumbers: sns,
                localidadeDestinoId: localId,
                data: serverTimestamp(),
                usuario: auth.currentUser?.uid,
              });
            }
          }
        }
      });

      await logAction(produtoToEdit ? "PRODUTO_EDITADO" : "PRODUTO_CRIADO", {
        nome: dataToSave.nome,
      });
      addToast(
        `Produto ${produtoToEdit ? "atualizado" : "adicionado"} com sucesso!`,
        "success"
      );
      onClose();
    } catch (error: any) {
      console.error("Erro no salvamento:", error);
      addToast(
        error.message || "Erro de transação no banco de dados.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const popularSelect = (
    cache: Map<string, { id?: string; nome: string }>,
    placeholder: string
  ) => {
    const sorted = Array.from(cache.entries()).sort(([, a], [, b]) =>
      a.nome.localeCompare(b.nome)
    );
    return [
      <option key="" value="">
        {placeholder}
      </option>,
      ...sorted.map(([id, item]) => (
        <option key={id} value={id}>
          {item.nome}
        </option>
      )),
    ];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produtoToEdit ? "Editar Produto" : "Adicionar Novo Produto"}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Nome</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              Tipo de Controle
            </label>
            <div className="mt-2 flex gap-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoControle"
                  value="Quantidade"
                  checked={formData.tipoControle === "Quantidade"}
                  onChange={handleChange}
                  className="h-4 w-4 text-teal-600"
                />
                <span className="ml-2 text-sm">Quantidade</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoControle"
                  value="Serial Number"
                  checked={formData.tipoControle === "Serial Number"}
                  onChange={handleChange}
                  className="h-4 w-4 text-teal-600"
                />
                <span className="ml-2 text-sm">Serial Number</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              Foto (URL ou Upload)
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                name="foto_url"
                value={formData.foto_url}
                onChange={handleChange}
                className="flex-grow p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <label className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold">
                Upload...
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            {isUploading && (
              <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Unidade</label>
            <input
              type="text"
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Modelo</label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Categoria</label>
            <select
              name="categoriaId"
              value={formData.categoriaId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            >
              {popularSelect(caches.categorias, "Selecione...")}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Fabricante</label>
            <select
              name="fabricanteId"
              value={formData.fabricanteId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            >
              {popularSelect(caches.fabricantes, "Selecione...")}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Fornecedor</label>
            <select
              name="fornecedorId"
              value={formData.fornecedorId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            >
              {popularSelect(caches.fornecedores, "Selecione...")}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Estoque Mínimo</label>
            <input
              type="number"
              name="estoqueMinimo"
              value={formData.estoqueMinimo}
              onChange={handleChange}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Notas Internas</label>
            <textarea
              name="notas_internas"
              value={formData.notas_internas}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
            ></textarea>
          </div>
        </div>

        <div className="border-t pt-4 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold">Documentos</label>
            <button
              type="button"
              onClick={() =>
                setDocumentos([...documentos, { nome: "", link: "" }])
              }
              className="text-xs bg-teal-100 text-teal-700 font-bold py-1 px-3 rounded hover:bg-teal-200"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1" /> Adicionar
            </button>
          </div>
          {documentos.map((doc, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={doc.nome}
                onChange={(e) => {
                  const d = [...documentos];
                  d[i].nome = e.target.value;
                  setDocumentos(d);
                }}
                placeholder="Nome"
                className="w-1/3 p-2 border rounded text-xs dark:bg-gray-700"
              />
              <input
                type="text"
                value={doc.link}
                onChange={(e) => {
                  const d = [...documentos];
                  d[i].link = e.target.value;
                  setDocumentos(d);
                }}
                placeholder="Link"
                className="flex-grow p-2 border rounded text-xs dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() =>
                  setDocumentos(documentos.filter((_, idx) => idx !== i))
                }
                className="text-red-500 px-2"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>

        {!produtoToEdit && (
          <div className="border-t pt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg dark:border-gray-700">
            <p className="text-sm font-bold mb-3 text-teal-700 dark:text-teal-400">
              Entrada Inicial (ITC BRASIL)
            </p>
            {formData.tipoControle === "Quantidade" ? (
              <input
                type="number"
                name="quantidade_inicial"
                step="any"
                placeholder="Quantidade inicial..."
                className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700"
              />
            ) : (
              <SerialNumbersInput
                serialNumbers={initialSerialNumbers}
                setSerialNumbers={setInitialSerialNumbers}
              />
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-4 border-t dark:border-gray-700">
          {produtoToEdit ? (
            <button
              type="button"
              onClick={() => onDelete(produtoToEdit.id)}
              className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faTrash} /> Excluir
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-teal-600 text-white rounded-lg font-bold disabled:opacity-50 min-w-[120px]"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                "Confirmar"
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
