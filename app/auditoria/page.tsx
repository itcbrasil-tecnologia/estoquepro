'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AuditLogItem } from '@/types';
import Paginacao from '@/components/Paginacao';

const ITENS_POR_PAGINA = 20;

export default function PaginaAuditoria() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = query(collection(db, 'auditoria'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogItem));
      setLogs(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalPages = Math.ceil(logs.length / ITENS_POR_PAGINA);
  const startIndex = (currentPage - 1) * ITENS_POR_PAGINA;
  const endIndex = startIndex + ITENS_POR_PAGINA;
  const logsPaginados = logs.slice(startIndex, endIndex);

  if (loading) return <p className="dark:text-gray-300">Carregando log de auditoria...</p>;

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Log de Auditoria</h1>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
            <tr>
              <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
              <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Usuário</th>
              <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Ação</th>
              <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logsPaginados.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="py-3 px-4 whitespace-nowrap">{log.timestamp?.toDate().toLocaleString('pt-BR') || 'N/A'}</td>
                <td className="py-3 px-4">{log.userEmail}</td>
                <td className="py-3 px-4 font-semibold">{log.action}</td>
                <td className="py-3 px-4 text-xs font-mono">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacao currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}