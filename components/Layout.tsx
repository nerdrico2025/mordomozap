import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const MORDOMO_LOGO_URL =
  'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // When the user navigates to a new page, close the mobile menu.
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]); // Dependency on pathname ensures this runs on route change

  const navLinkClasses =
    'flex items-center px-4 py-3 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors';
  const activeNavLinkClasses = 'bg-primary text-white';

  return (
    <>
      {/* Overlay for mobile view */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <NavLink to="/dashboard" onClick={onClose}>
            <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-10" id="sidebar-title" />
          </NavLink>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden p-1 text-gray-300 hover:text-white" aria-label="Fechar menu">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/conversations"
            className={({ isActive }) =>
              `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
            }
          >
            Conversas
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
            }
          >
            Calendário
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
            }
          >
            Configurações
          </NavLink>
          {user?.role === UserRole.SUPER_ADMIN && (
            <NavLink
              to="/super-admin"
              className={({ isActive }) =>
                `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
              }
            >
              Super Admin
            </NavLink>
          )}
          <NavLink
            to="/support"
            className={({ isActive }) =>
              `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
            }
          >
            Suporte
          </NavLink>
        </nav>
      </div>
    </>
  );
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      // A navegação será tratada reativamente pelo PrivateRoute
    } catch (error) {
      console.error("Falha no logout:", error);
      setIsLoggingOut(false); // Resetar em caso de erro
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);
  
  const handleCloseMobileMenu = useCallback(() => {
      setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isMobileMenuOpen} onClose={handleCloseMobileMenu} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center">
            {/* Hamburger button for mobile */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Abrir menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          
            {/* Spacer to push user menu to the right */}
            <div className="flex-grow"></div>
          
            <div className="relative" ref={dropdownRef}>
                <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center space-x-3 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-700">
                    {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {(user?.name?.[0] || 'U').toUpperCase()}
                </div>
                </button>

                {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white border border-gray-100 py-2 z-50">
                    <button
                    onClick={() => {
                        setDropdownOpen(false);
                        navigate('/settings');
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                    Configurações
                    </button>
                    <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                    {isLoggingOut ? 'Saindo...' : 'Sair'}
                    </button>
                </div>
                )}
            </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
