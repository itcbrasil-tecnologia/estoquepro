'use client';

import ProtectedLayout from '@/app/estoque/layout'; // Reutiliza o layout de segurança

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}