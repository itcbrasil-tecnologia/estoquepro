'use client';

import ProtectedLayout from '@/app/estoque/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuditoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole !== 'master') {
      router.push('/dashboard'); // Redireciona se não for master
    }
  }, [userRole, loading, router]);

  if (loading || userRole !== 'master') {
    return <div className="flex items-center justify-center h-screen dark:text-white">Verificando permissões...</div>;
  }

  return <ProtectedLayout>{children}</ProtectedLayout>;
}