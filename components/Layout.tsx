
import React, { useState } from 'react';
// FIX: Replaced require() with a proper ES6 import for Outlet.
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClasses = "flex items-center px-4 py-3 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors";
    const activeNavLinkClasses = "bg-primary text-white";

    return (
        <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-10" />
            </div>
            <nav className="flex-grow p-4 space-y-2">
                <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Dashboard</NavLink>
                <NavLink to="/calendar" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Calendário</NavLink>
                <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Configurações</NavLink>
                {user?.role === UserRole.SUPER_ADMIN && (
                    <NavLink to="/super-admin" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Super Admin</NavLink>
                )}
                 <NavLink to="/support" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>Suporte</NavLink>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <div className="text-sm">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-gray-400">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="w-full mt-4 text-left px-4 py-2 text-gray-200 rounded-lg hover:bg-red-600 transition-colors">
                    Sair
                </button>
            </div>
        </div>
    );
};


const Layout: React.FC = () => {

    return (
        <div className="flex bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
