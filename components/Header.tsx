
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';


const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/">
          <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-12"/>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-primary">Início</Link>
          <Link to="/pricing" className="text-gray-600 hover:text-primary">Planos</Link>
          <Link to="/support" className="text-gray-600 hover:text-primary">Suporte</Link>
          <Link to="/login" className="text-gray-600 hover:text-primary">Login</Link>
        </nav>
        <Link to="/signup">
            <Button variant="primary">Comece o trial de 3 dias</Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
