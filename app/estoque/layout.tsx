// ARQUIVO: app/estoque/layout.tsx
// (Crie uma nova pasta 'estoque' dentro de 'app' e, nela, crie este arquivo)
// Este é um layout de segurança. Ele protege todas as páginas dentro de /estoque.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); // Se não estiver carregando e não houver usuário, redireciona para o login
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-8">{children}</main>
    </div>
  );
}