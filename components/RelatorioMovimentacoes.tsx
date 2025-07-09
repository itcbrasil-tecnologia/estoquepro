'use client';

import { CacheData } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioMovimentacoes({ caches }: RelatorioProps) {
  const historicoOrdenado = [...caches.historico].sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));

  return (
    <table className="min-w-full bg-white dark:bg-gray-800 text-sm text-left text-gray-700 dark:text-gray-300">
      <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
        <tr>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Data</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Produto</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Qtd</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Origem</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Destino</th>
          <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Usuário</th>
        </tr>
      </thead>
      <tbody className="divide-y dark:divide-gray-700">
        {historicoOrdenado.map(h => {
            const produto = caches.produtos.get(h.produtoId);
            if (!produto) return null;
            const tipoCor = {'ENTRADA': 'text-green-500', 'SAIDA': 'text-red-500', 'TRANSFERENCIA': 'text-blue-500'}[h.tipo] || 'text-gray-400';
            const origem = h.localidadeOrigemId ? caches.localidades.get(h.localidadeOrigemId)?.nome : 'EXTERNO';
            const destino = h.localidadeDestinoId ? caches.localidades.get(h.localidadeDestinoId)?.nome : 'EXTERNO';
            const usuario = caches.usuarios.get(h.usuario)?.username || 'Desconhecido';
            return (
                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-3 px-4">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                    <td className="py-3 px-4">{produto.nome}</td>
                    <td className={`py-3 px-4 font-bold ${tipoCor}`}>{h.tipo}</td>
                    <td className="py-3 px-4 text-right">{h.quantidade}</td>
                    <td className="py-3 px-4">{origem}</td>
                    <td className="py-3 px-4">{destino}</td>
                    <td className="py-3 px-4">{usuario}</td>
                </tr>
            );
        })}
      </tbody>
    </table>
  );
}