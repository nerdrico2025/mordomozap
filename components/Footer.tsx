
import React from 'react';
import { Link } from 'react-router-dom';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-12 mb-4"/>
            <p className="text-gray-400">Automatize seu atendimento no WhatsApp com inteligência artificial.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Produto</h3>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="text-gray-400 hover:text-white">Planos</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-white">Funcionalidades</Link></li>
              <li><Link to="/integrations" className="text-gray-400 hover:text-white">Integrações</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white">Sobre nós</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-white">Suporte</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white">Termos de Serviço</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white">Política de Privacidade</Link></li>
              <li><Link to="/lgpd" className="text-gray-400 hover:text-white">LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} MordomoZAP. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
