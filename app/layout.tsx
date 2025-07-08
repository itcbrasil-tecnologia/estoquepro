// ARQUIVO: app/layout.tsx
// (Substitua o conteúdo deste arquivo)
// Agora ele irá "envolver" toda a aplicação com o nosso provedor de autenticação.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { AuthProvider } from "@/contexts/AuthContext"; // Importa o AuthProvider

config.autoAddCss = false; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Controle de Estoque",
  description: "Gerencie seu estoque de forma eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider> {/* Envolve a aplicação com o contexto */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}