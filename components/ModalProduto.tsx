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
import { faTrash, faSpinner } from "@fortawesome/free-solid-svg-icons";
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.nome) return;
    setIsUploading(true);
    const storageRef = ref(
      storage,
      `produtos/${formData.nome.toLowerCase()}-${Date.now()}`
    );
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
        })
    );
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const dataToSave: any = {
      ...formData,
      documentos: JSON.stringify(documentos),
      updatedAt: serverTimestamp(),
    };

    try {
      await runTransaction(db, async (transaction) => {
        const produtoRef = produtoToEdit?.id
          ? doc(db, "produtos", produtoToEdit.id)
          : doc(collection(db, "produtos"));
        const localId = localPadrao?.id;

        // --- 1. FASE DE LEITURA (READS) ---
        // Mesmo em produtos novos, precisamos ler a referência de estoque se houver quantidade inicial
        let estoqueDoc = null;
        const estoqueRef = localId
          ? doc(db, "estoque", `${produtoRef.id}_${localId}`)
          : null;

        if (
          estoqueRef &&
          !produtoToEdit &&
          formData.tipoControle === "Quantidade"
        ) {
          estoqueDoc = await transaction.get(estoqueRef);
        }

        // --- 2. FASE DE ESCRITA (WRITES) ---
        if (produtoToEdit) {
          transaction.update(produtoRef, dataToSave);
        } else {
          dataToSave.createdAt = serverTimestamp();
          transaction.set(produtoRef, dataToSave);

          if (formData.tipoControle === "Quantidade") {
            const formElements = e.currentTarget.elements as any;
            const qtd = parseFloat(formElements.quantidade_inicial?.value) || 0;
            if (qtd > 0 && estoqueRef) {
              transaction.set(estoqueRef, {
                produtoId: produtoRef.id,
                localidadeId: localId,
                quantidade: qtd,
              });
              transaction.set(doc(collection(db, "historico")), {
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
                transaction.set(doc(collection(db, "unidadesEstoque")), {
                  produtoId: produtoRef.id,
                  serialNumber: sn.trim(),
                  localidadeId: localId,
                  status: "Em Estoque",
                  createdAt: serverTimestamp(),
                });
              });
              transaction.set(doc(collection(db, "historico")), {
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
      addToast("Salvo com sucesso!", "success");
      onClose();
    } catch (error: any) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produtoToEdit ? "Editar" : "Novo Produto"}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Nome do Produto"
          required
          className="w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:text-white"
        />

        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="tipoControle"
              value="Quantidade"
              checked={formData.tipoControle === "Quantidade"}
              onChange={() =>
                setFormData({ ...formData, tipoControle: "Quantidade" })
              }
            />{" "}
            <span className="ml-2">Quantidade</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="tipoControle"
              value="Serial Number"
              checked={formData.tipoControle === "Serial Number"}
              onChange={() =>
                setFormData({ ...formData, tipoControle: "Serial Number" })
              }
            />{" "}
            <span className="ml-2">Serial Number</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">Foto do Produto</label>
          <input
            type="file"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-gray-500"
          />
          {isUploading && (
            <div className="w-full bg-gray-200 h-1 mt-2">
              <div
                className="bg-teal-600 h-1"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {!produtoToEdit && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-bold mb-2">
              Entrada Inicial (ITC BRASIL)
            </p>
            {formData.tipoControle === "Quantidade" ? (
              <input
                type="number"
                name="quantidade_inicial"
                placeholder="Qtd Inicial"
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

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
