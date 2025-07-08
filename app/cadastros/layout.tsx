'use client';

import ProtectedLayout from '@/app/estoque/layout';

export default function CadastrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}