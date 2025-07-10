'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faChevronDown, faSignOutAlt, faUserCircle, faKey } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const { user, userRole } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [cadastrosDropdownOpen, setCadastrosDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const cadastrosDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      addToast('Email do usuário não encontrado.', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      addToast('Email de redefinição de senha enviado!', 'success');
      setProfileDropdownOpen(false);
    } catch (error) {
      console.error("Erro ao enviar email de redefinição de senha:", error);
      addToast('Falha ao enviar email. Tente novamente mais tarde.', 'error');
    }
  };
  
  const getLinkClass = (path: string) => {
    return pathname === path ? 'nav-btn-active' : 'nav-btn';
  };
  
  const getCadastrosClass = () => {
    return pathname.startsWith('/cadastros') || pathname.startsWith('/auditoria') ? 'nav-btn-active' : 'nav-btn';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cadastrosDropdownRef.current && !cadastrosDropdownRef.current.contains(event.target as Node)) {
        setCadastrosDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cadastrosDropdownRef, profileDropdownRef]);

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
            <div className="relative" ref={cadastrosDropdownRef}>
              <button onClick={() => setCadastrosDropdownOpen(!cadastrosDropdownOpen)} className={`${getCadastrosClass()} flex items-center`}>
                Administração <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-xs" />
              </button>
              {cadastrosDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20" onClick={() => setCadastrosDropdownOpen(false)}>
                  <Link href="/cadastros/localidades" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Localidades</Link>
                  <Link href="/cadastros/fornecedores" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Fornecedores</Link>
                  <Link href="/cadastros/categorias" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Categorias</Link>
                  <Link href="/cadastros/fabricantes" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Fabricantes</Link>
                  {userRole === 'master' && (
                    <>
                      <Link href="/cadastros/usuarios" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Usuários</Link>
                      <Link href="/auditoria" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Log de Auditoria</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center ml-4 space-x-4">
            <ThemeSwitcher />
            <div className="relative" ref={profileDropdownRef}>
                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="p-2 rounded-full text-gray-300 hover:bg-gray-700">
                    <FontAwesomeIcon icon={faUserCircle} size="xl" />
                </button>
                {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 p-2">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-800 dark:text-white">Logado como</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{user?.email}</p>
                        </div>
                        <button onClick={handlePasswordReset} className="w-full text-left mt-1 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md flex items-center transition-colors">
                            <FontAwesomeIcon icon={faKey} className="mr-2" />Alterar Senha
                        </button>
                        <button onClick={handleLogout} className="w-full text-left mt-1 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600 rounded-md flex items-center transition-colors">
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />Sair
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}