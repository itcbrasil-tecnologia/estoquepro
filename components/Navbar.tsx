'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faChevronDown, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const getLinkClass = (path: string) => {
    return pathname === path ? 'nav-btn-active' : 'nav-btn';
  };
  
  const getCadastrosClass = () => {
    return pathname.startsWith('/cadastros') ? 'nav-btn-active' : 'nav-btn';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className="bg-gray-800 dark:bg-gray-950 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl text-blue-400" />
            <span className="text-xl font-bold text-white">EstoquePRO</span>
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
            <Link href="/estoque" className={getLinkClass('/estoque')}>Produtos</Link>
            <Link href="/relatorios" className={getLinkClass('/relatorios')}>Relatórios</Link>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`${getCadastrosClass()} flex items-center`}>
                Cadastros <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-xs" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20" onClick={() => setDropdownOpen(false)}>
                  <Link href="/cadastros/localidades" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Localidades</Link>
                  <Link href="/cadastros/fornecedores" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Fornecedores</Link>
                  <Link href="/cadastros/categorias" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Categorias</Link>
                  <Link href="/cadastros/fabricantes" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Fabricantes</Link>
                  {userRole === 'master' && (
                    <Link href="/cadastros/usuarios" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Usuários</Link>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center ml-4 space-x-4">
            <ThemeSwitcher />
            <span className="text-sm text-gray-300 font-semibold">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-500 font-medium flex items-center transition-colors">
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}