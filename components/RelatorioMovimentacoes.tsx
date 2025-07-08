'use client';

import { CacheData } from '@/types';

interface RelatorioProps {
  caches: CacheData;
}

export default function RelatorioMovimentacoes({ caches }: RelatorioProps) {
  const historicoOrdenado = [...caches.historico].sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));

  return (
    <table className="min-w-full bg-white text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {historicoOrdenado.map(h => {
            const produto = caches.produtos.get(h.produtoId);
            if (!produto) return null;
            const tipoCor = {'ENTRADA': 'text-green-600', 'SAIDA': 'text-red-600', 'TRANSFERENCIA': 'text-blue-600'}[h.tipo] || 'text-gray-700';
            const origem = h.localidadeOrigemId ? caches.localidades.get(h.localidadeOrigemId)?.nome : 'EXTERNO';
            const destino = h.localidadeDestinoId ? caches.localidades.get(h.localidadeDestinoId)?.nome : 'EXTERNO';
            const usuario = caches.usuarios.get(h.usuario)?.username || 'Desconhecido';
            return (
                <tr key={h.id}>
                    <td className="py-2 px-3">{h.data ? h.data.toDate().toLocaleString('pt-BR') : 'N/A'}</td>
                    <td className="py-2 px-3">{produto.nome}</td>
                    <td className={`py-2 px-3 font-bold ${tipoCor}`}>{h.tipo}</td>
                    <td className="py-2 px-3 text-right">{h.quantidade}</td>
                    <td className="py-2 px-3">{origem}</td>
                    <td className="py-2 px-3">{destino}</td>
                    <td className="py-2 px-3">{usuario}</td>
                </tr>
            );
        })}
      </tbody>
    </table>
  );
}