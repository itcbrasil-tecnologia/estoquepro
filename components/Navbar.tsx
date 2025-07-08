// ARQUIVO: components/Navbar.tsx
// (Crie uma nova pasta 'components' na raiz e, dentro dela, este arquivo)
// Este é o componente da barra de navegação.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faChevronDown, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link href="/estoque" className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl text-blue-600" />
            <span className="text-xl font-bold">EstoquePRO</span>
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/estoque" className="nav-btn-active px-3 py-2 rounded-md text-sm font-medium">Estoque</Link>
            <Link href="/relatorios" className="nav-btn px-3 py-2 rounded-md text-sm font-medium">Relatórios</Link>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="nav-btn px-3 py-2 rounded-md text-sm font-medium flex items-center">
                Cadastros <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-xs" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                  <Link href="/cadastros/localidades" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Localidades</Link>
                  <Link href="/cadastros/fornecedores" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Fornecedores</Link>
                  <Link href="/cadastros/categorias" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Categorias</Link>
                  <Link href="/cadastros/fabricantes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Fabricantes</Link>
                  {userRole === 'master' && (
                    <Link href="/cadastros/usuarios" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Usuários</Link>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center ml-4">
            <span className="text-sm text-gray-500 mr-4 font-semibold">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center">
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}