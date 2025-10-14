import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const MORDOMO_LOGO_URL =
  'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinkClasses =
    'flex items-center px-4 py-3 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors';
  const activeNavLinkClasses = 'bg-primary text-white';

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex-col hidden md:flex">
      <div className="p-4 border-b border-gray-700">
        <NavLink to="/dashboard">
            <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-10" />
        </NavLink>
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
  );
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between md:justify-end items-center">
          {/* Mobile Logo */}
          <div className="md:hidden">
            <NavLink to="/dashboard">
                <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-8" />
            </NavLink>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center space-x-3 focus:outline-none"
              aria-haspopup="true"
              aria-expanded={menuOpen}
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

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white border border-gray-100 py-2 z-50">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configurações
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sair
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
