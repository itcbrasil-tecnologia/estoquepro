'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faChevronDown, faSignOutAlt, faUserCircle, faKey, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const { user, userRole } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [cadastrosDropdownOpen, setCadastrosDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
          
          {/* Menu Desktop */}
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
                  <Link href="/cadastros/projetos" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Projetos</Link>
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
            {/* Botão de Perfil (Desktop) */}
            <div className="hidden md:flex relative" ref={profileDropdownRef}>
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

            {/* Botão Hambúrguer (Mobile) */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
                <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 dark:bg-gray-900">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Dashboard</Link>
            <Link href="/estoque" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Produtos</Link>
            <Link href="/relatorios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Relatórios</Link>
            <Link href="/cadastros/projetos" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Projetos</Link>
            <Link href="/cadastros/localidades" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Localidades</Link>
            <Link href="/cadastros/fornecedores" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Fornecedores</Link>
            <Link href="/cadastros/categorias" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Categorias</Link>
            <Link href="/cadastros/fabricantes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Fabricantes</Link>
            {userRole === 'master' && (
              <>
                <Link href="/cadastros/usuarios" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Usuários</Link>
                <Link href="/auditoria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Log de Auditoria</Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-5">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button onClick={handlePasswordReset} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                <FontAwesomeIcon icon={faKey} className="mr-3" />Alterar Senha
              </button>
              <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700 hover:text-white flex items-center">
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}