"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "./Modal";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { Produto, CacheData, UnidadeEstoqueItem } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import SerialNumbersInput from "./SerialNumbersInput";
import { logAction } from "@/lib/audit";

interface ModalMovimentarProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  caches: CacheData;
}

export default function ModalMovimentar({
  isOpen,
  onClose,
  produto,
  caches,
}: ModalMovimentarProps) {
  const [tipo, setTipo] = useState("ENTRADA");
  const [quantidade, setQuantidade] = useState(1);
  const [localidadeOrigemId, setLocalidadeOrigemId] = useState("");
  const [localidadeDestinoId, setLocalidadeDestinoId] = useState("");
  const [serialNumbers, setSerialNumbers] = useState<string[]>([""]);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const localPadrao = useMemo(
    () =>
      Array.from(caches.localidades.values()).find(
        (l) => l.nome.toUpperCase() === "ITC BRASIL"
      ),
    [caches.localidades]
  );

  const sortedLocalidades = useMemo(
    () =>
      Array.from(caches.localidades.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome)
      ),
    [caches.localidades]
  );

  const localidadesComEstoqueQtde = useMemo(
    () =>
      produto
        ? caches.estoque
            .filter((e) => e.produtoId === produto.id && e.quantidade > 0)
            .map((e) => e.localidadeId)
        : [],
    [caches.estoque, produto]
  );

  const localidadesComEstoqueSN = useMemo(
    () =>
      produto
        ? [
            ...new Set(
              (caches.unidadesEstoque || [])
                .filter(
                  (u) => u.produtoId === produto.id && u.status === "Em Estoque"
                )
                .map((u) => u.localidadeId)
            ),
          ]
        : [],
    [caches.unidadesEstoque, produto]
  );

  useEffect(() => {
    if (produto && isOpen) {
      setTipo("ENTRADA");
      setQuantidade(1);
      setLocalidadeOrigemId("");
      setSerialNumbers([""]);
      setUnidadesSelecionadas([]);
      setLocalidadeDestinoId(localPadrao?.id || "");
    }
  }, [produto, isOpen, localPadrao]);

  const handleUnidadeSelect = (sn: string) => {
    setUnidadesSelecionadas((prev) =>
      prev.includes(sn) ? prev.filter((item) => item !== sn) : [...prev, sn]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !auth.currentUser) return;
    setLoading(true);

    try {
      if (produto.tipoControle === "Quantidade" || !produto.tipoControle) {
        await runTransaction(db, async (transaction) => {
          const qtd = Number(quantidade);
          if (isNaN(qtd) || qtd <= 0) throw new Error("Quantidade inválida.");

          const histRef = doc(collection(db, "historico"));
          let histData: any = {
            produtoId: produto.id,
            tipo,
            quantidade: qtd,
            data: serverTimestamp(),
            usuario: auth.currentUser?.uid,
          };

          // --- FASE DE LEITURA (READS) ---
          const destinoId =
            tipo === "ENTRADA" ? localPadrao?.id : localidadeDestinoId;
          const estoqueOrigemId = `${produto.id}_${localidadeOrigemId}`;
          const estoqueDestinoId = `${produto.id}_${destinoId}`;

          const estoqueOrigemRef = doc(db, "estoque", estoqueOrigemId);
          const estoqueDestinoRef = doc(db, "estoque", estoqueDestinoId);

          let estoqueOrigemDoc = null;
          let estoqueDestinoDoc = null;

          if (tipo !== "ENTRADA") {
            estoqueOrigemDoc = await transaction.get(estoqueOrigemRef);
          }
          if (tipo === "ENTRADA" || tipo === "TRANSFERENCIA") {
            estoqueDestinoDoc = await transaction.get(estoqueDestinoRef);
          }

          // --- FASE DE ESCRITA (WRITES) ---
          if (tipo === "ENTRADA") {
            if (!destinoId)
              throw new Error("Local padrão 'ITC BRASIL' não encontrado.");
            histData.localidadeDestinoId = destinoId;

            if (!estoqueDestinoDoc?.exists()) {
              transaction.set(estoqueDestinoRef, {
                produtoId: produto.id,
                localidadeId: destinoId,
                quantidade: qtd,
              });
            } else {
              const qtdAtual = estoqueDestinoDoc.data()?.quantidade || 0;
              transaction.update(estoqueDestinoRef, {
                quantidade: qtdAtual + qtd,
              });
            }
          } else {
            // SAIDA ou TRANSFERENCIA
            if (!localidadeOrigemId)
              throw new Error("Local de origem é obrigatório.");
            if (!estoqueOrigemDoc?.exists())
              throw new Error("Estoque na origem não existe.");

            const qtdOrigemAtual = estoqueOrigemDoc.data()?.quantidade || 0;
            if (qtdOrigemAtual < qtd)
              throw new Error("Estoque insuficiente na origem.");

            transaction.update(estoqueOrigemRef, {
              quantidade: qtdOrigemAtual - qtd,
            });
            histData.localidadeOrigemId = localidadeOrigemId;

            if (tipo === "TRANSFERENCIA") {
              if (!localidadeDestinoId)
                throw new Error("Local de destino é obrigatório.");
              if (localidadeOrigemId === localidadeDestinoId)
                throw new Error("Origem e destino iguais.");

              histData.localidadeDestinoId = localidadeDestinoId;

              if (!estoqueDestinoDoc?.exists()) {
                transaction.set(estoqueDestinoRef, {
                  produtoId: produto.id,
                  localidadeId: localidadeDestinoId,
                  quantidade: qtd,
                });
              } else {
                const qtdDestinoAtual =
                  estoqueDestinoDoc.data()?.quantidade || 0;
                transaction.update(estoqueDestinoRef, {
                  quantidade: qtdDestinoAtual + qtd,
                });
              }
            }
          }
          transaction.set(histRef, histData);
        });
      } else {
        // Lógica de Serial Number
        const batch = writeBatch(db);
        const histRef = doc(collection(db, "historico"));
        let histData: any = {
          produtoId: produto.id,
          tipo,
          data: serverTimestamp(),
          usuario: auth.currentUser?.uid,
        };

        if (tipo === "ENTRADA") {
          const destinoId = localPadrao?.id;
          if (!destinoId)
            throw new Error("Local padrão 'ITC BRASIL' não encontrado.");

          const snsValidos = serialNumbers.filter(
            (sn) => sn && sn.trim().length > 0
          );
          if (snsValidos.length === 0)
            throw new Error("Adicione pelo menos um Serial Number.");

          histData = {
            ...histData,
            localidadeDestinoId: destinoId,
            quantidade: snsValidos.length,
            serialNumbers: snsValidos,
          };

          snsValidos.forEach((sn) => {
            const newUnidadeRef = doc(collection(db, "unidadesEstoque"));
            batch.set(newUnidadeRef, {
              produtoId: produto.id,
              serialNumber: sn.trim(),
              localidadeId: destinoId,
              status: "Em Estoque",
              createdAt: serverTimestamp(),
            });
          });
        } else {
          if (!localidadeOrigemId)
            throw new Error("Local de origem é obrigatório.");
          if (unidadesSelecionadas.length === 0)
            throw new Error("Selecione pelo menos uma unidade.");

          histData = {
            ...histData,
            localidadeOrigemId,
            quantidade: unidadesSelecionadas.length,
            serialNumbers: unidadesSelecionadas,
          };

          const unidadesAbertas = (caches.unidadesEstoque || []).filter((u) =>
            unidadesSelecionadas.includes(u.serialNumber)
          );

          unidadesAbertas.forEach((unidade: UnidadeEstoqueItem) => {
            if (unidade.localidadeId !== localidadeOrigemId)
              throw new Error(
                `Serial ${unidade.serialNumber} não está no local de origem.`
              );

            const unidadeRef = doc(db, "unidadesEstoque", unidade.id);
            if (tipo === "SAIDA") {
              batch.update(unidadeRef, { status: "Baixado", localidadeId: "" });
            } else {
              if (!localidadeDestinoId)
                throw new Error("Local de destino é obrigatório.");
              if (localidadeOrigemId === localidadeDestinoId)
                throw new Error("Origem e destino iguais.");
              histData.localidadeDestinoId = localidadeDestinoId;
              batch.update(unidadeRef, { localidadeId: localidadeDestinoId });
            }
          });
        }
        batch.set(histRef, histData);
        await batch.commit();
      }

      const detalhesLog: any = {
        tipo,
        produto: produto.nome,
        quantidade:
          produto.tipoControle === "Serial Number"
            ? unidadesSelecionadas.length
            : quantidade,
      };

      if (tipo === "ENTRADA") {
        detalhesLog.origem = "EXTERNO";
        detalhesLog.destino = localPadrao?.nome || "N/A";
        if (produto.tipoControle === "Serial Number") {
          detalhesLog.serialNumbers = serialNumbers.filter(
            (sn) => sn && sn.trim().length > 0
          );
        }
      } else if (tipo === "SAIDA") {
        detalhesLog.origem =
          caches.localidades.get(localidadeOrigemId)?.nome || "N/A";
        detalhesLog.destino = "EXTERNO";
        if (produto.tipoControle === "Serial Number") {
          detalhesLog.serialNumbers = unidadesSelecionadas;
        }
      } else if (tipo === "TRANSFERENCIA") {
        detalhesLog.origem =
          caches.localidades.get(localidadeOrigemId)?.nome || "N/A";
        detalhesLog.destino =
          caches.localidades.get(localidadeDestinoId)?.nome || "N/A";
        if (produto.tipoControle === "Serial Number") {
          detalhesLog.serialNumbers = unidadesSelecionadas;
        }
      }

      await logAction("MOVIMENTACAO_ESTOQUE", detalhesLog);
      addToast("Movimentação realizada com sucesso!", "success");
      onClose();
    } catch (error: any) {
      console.error("Erro na movimentação:", error);
      addToast(`Falha: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderFormularioQuantidade = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Quantidade
        </label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          required
          className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      {tipo !== "ENTRADA" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Local de Origem
          </label>
          <select
            value={localidadeOrigemId}
            onChange={(e) => setLocalidadeOrigemId(e.target.value)}
            required
            className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Selecione...</option>
            {sortedLocalidades
              .filter((l) => localidadesComEstoqueQtde.includes(l.id!))
              .map((local) => (
                <option key={local.id} value={local.id!}>
                  {local.nome}
                </option>
              ))}
          </select>
        </div>
      )}
      {tipo === "ENTRADA" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Local de Destino
          </label>
          <div className="mt-1 block w-full p-2 border border-gray-200 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400">
            {localPadrao
              ? localPadrao.nome
              : "Padrão 'ITC BRASIL' não encontrado"}
          </div>
        </div>
      )}
      {tipo === "TRANSFERENCIA" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Local de Destino
          </label>
          <select
            value={localidadeDestinoId}
            onChange={(e) => setLocalidadeDestinoId(e.target.value)}
            required
            className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Selecione...</option>
            {sortedLocalidades.map((l) => (
              <option key={l.id} value={l.id!}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );

  const renderFormularioSerialNumber = () => (
    <>
      {tipo === "ENTRADA" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Local de Destino
            </label>
            <div className="mt-1 block w-full p-2 border border-gray-200 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400">
              {localPadrao
                ? localPadrao.nome
                : "Padrão 'ITC BRASIL' não encontrado"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Serial Numbers
            </label>
            <SerialNumbersInput
              serialNumbers={serialNumbers}
              setSerialNumbers={setSerialNumbers}
            />
          </div>
        </>
      )}
      {tipo !== "ENTRADA" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Local de Origem
            </label>
            <select
              value={localidadeOrigemId}
              onChange={(e) => setLocalidadeOrigemId(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione...</option>
              {sortedLocalidades
                .filter((l) => localidadesComEstoqueSN.includes(l.id!))
                .map((local) => (
                  <option key={local.id} value={local.id!}>
                    {local.nome}
                  </option>
                ))}
            </select>
          </div>
          {tipo === "TRANSFERENCIA" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Local de Destino
              </label>
              <select
                value={localidadeDestinoId}
                onChange={(e) => setLocalidadeDestinoId(e.target.value)}
                required
                className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecione...</option>
                {sortedLocalidades.map((l) => (
                  <option key={l.id} value={l.id!}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          {localidadeOrigemId && (
            <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-1 mt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unidades Disponíveis
              </label>
              {(caches.unidadesEstoque || [])
                .filter(
                  (u) =>
                    u.localidadeId === localidadeOrigemId &&
                    u.produtoId === produto?.id &&
                    u.status === "Em Estoque"
                )
                .map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={unidadesSelecionadas.includes(u.serialNumber)}
                      onChange={() => handleUnidadeSelect(u.serialNumber)}
                      className="h-4 w-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                      {u.serialNumber}
                    </span>
                  </label>
                ))}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimentar ${produto?.nome || ""}`}
    >
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Movimentação
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </div>
          {produto?.tipoControle === "Serial Number"
            ? renderFormularioSerialNumber()
            : renderFormularioQuantidade()}
        </div>
        <div className="flex justify-end mt-8 items-center gap-x-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-32 hover:bg-teal-700 transition-colors"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
